import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  LanguageExecutor, 
  ExecutionResult, 
  ValidationResult, 
  SupportedLanguage 
} from '../types/index.js';

const TEMP_DIR = '/tmp';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

abstract class BaseExecutor implements LanguageExecutor {
  abstract validate(code: string): Promise<ValidationResult>;
  abstract execute(code: string, args: any): Promise<ExecutionResult>;
  abstract getFileExtension(): string;

  protected async runCommand(
    command: string, 
    args: string[], 
    input?: string,
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGTERM');
      }, timeout);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      if (input) {
        proc.stdin.write(input);
        proc.stdin.end();
      }

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) {
          reject(new Error('Execution timed out'));
        } else {
          resolve({ stdout, stderr, code: code || 0 });
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  protected async createTempFile(content: string, extension: string): Promise<string> {
    const filename = `${uuidv4()}.${extension}`;
    const filepath = join(TEMP_DIR, filename);
    await writeFile(filepath, content);
    return filepath;
  }

  protected async cleanupTempFile(filepath: string): Promise<void> {
    try {
      await unlink(filepath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

class PythonExecutor extends BaseExecutor {
  getFileExtension(): string {
    return 'py';
  }

  async validate(code: string): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'py');
    
    try {
      const { stderr, code: exitCode } = await this.runCommand(
        'python3', 
        ['-m', 'py_compile', filepath]
      );

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Python syntax error']
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(code: string, args: any): Promise<ExecutionResult> {
    const wrappedCode = `
import json
import sys

${code}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = main(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`;

    const filepath = await this.createTempFile(wrappedCode, 'py');
    const startTime = Date.now();

    try {
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'python3',
        [filepath, JSON.stringify(args)]
      );

      const executionTime = Date.now() - startTime;

      if (exitCode !== 0) {
        let errorMessage = stderr;
        try {
          const errorJson = JSON.parse(stderr);
          errorMessage = errorJson.error || stderr;
        } catch {
          // Use raw stderr if not JSON
        }

        return {
          success: false,
          error: errorMessage,
          executionTime
        };
      }

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }
}

class JavaScriptExecutor extends BaseExecutor {
  getFileExtension(): string {
    return 'js';
  }

  async validate(code: string): Promise<ValidationResult> {
    const wrappedCode = `
${code}

// Validate that main function exists
if (typeof main !== 'function') {
  throw new Error('Function "main" is not defined');
}
`;

    const filepath = await this.createTempFile(wrappedCode, 'js');
    
    try {
      const { stderr, code: exitCode } = await this.runCommand(
        'node',
        ['--check', filepath]
      );

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'JavaScript syntax error']
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(code: string, args: any): Promise<ExecutionResult> {
    const wrappedCode = `
${code}

// Main execution
(async () => {
  try {
    const args = JSON.parse(process.argv[2] || '{}');
    const result = await main(args);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
})();
`;

    const filepath = await this.createTempFile(wrappedCode, 'js');
    const startTime = Date.now();

    try {
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'node',
        [filepath, JSON.stringify(args)]
      );

      const executionTime = Date.now() - startTime;

      if (exitCode !== 0) {
        let errorMessage = stderr;
        try {
          const errorJson = JSON.parse(stderr);
          errorMessage = errorJson.error || stderr;
        } catch {
          // Use raw stderr if not JSON
        }

        return {
          success: false,
          error: errorMessage,
          executionTime
        };
      }

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }
}

class BashExecutor extends BaseExecutor {
  getFileExtension(): string {
    return 'sh';
  }

  async validate(code: string): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'sh');
    
    try {
      const { stderr, code: exitCode } = await this.runCommand(
        'bash',
        ['-n', filepath]
      );

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Bash syntax error']
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(code: string, args: any): Promise<ExecutionResult> {
    const wrappedCode = `#!/bin/bash
set -e

${code}

# Parse JSON arguments
ARGS='${JSON.stringify(args)}'

# Call main function
main "$ARGS"
`;

    const filepath = await this.createTempFile(wrappedCode, 'sh');
    const startTime = Date.now();

    try {
      await this.runCommand('chmod', ['+x', filepath]);
      
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'bash',
        [filepath]
      );

      const executionTime = Date.now() - startTime;

      if (exitCode !== 0) {
        return {
          success: false,
          error: stderr || 'Bash execution failed',
          executionTime
        };
      }

      // Try to parse as JSON, otherwise return as string
      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }
}

const executors: Record<SupportedLanguage, LanguageExecutor> = {
  python: new PythonExecutor(),
  javascript: new JavaScriptExecutor(),
  node: new JavaScriptExecutor(),
  typescript: new JavaScriptExecutor(), // TypeScript will be transpiled before execution
  bash: new BashExecutor(),
  ruby: null as any // Placeholder - not implemented yet
};

export function getExecutor(language: SupportedLanguage): LanguageExecutor | null {
  return executors[language] || null;
}

export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return language in executors;
}