import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  LanguageExecutor, 
  ExecutionResult, 
  ValidationResult, 
  SupportedLanguage,
  FunctionArgs 
} from '../types/index.js';
import { TIMEOUTS } from '../constants.js';

const TEMP_DIR = '/tmp';

abstract class BaseExecutor implements LanguageExecutor {
  abstract validate(code: string): Promise<ValidationResult>;
  abstract execute(code: string, args: FunctionArgs): Promise<ExecutionResult>;
  abstract getFileExtension(): string;
  
  // Optional optimized file execution
  async executeFile?(filepath: string, args: FunctionArgs): Promise<ExecutionResult>;

  protected async runCommand(
    command: string, 
    args: string[], 
    input?: string,
    timeout: number = TIMEOUTS.DEFAULT_EXECUTION
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        // Detach from parent to prevent hanging
        detached: false,
        // Kill the process group when parent dies
        killSignal: 'SIGKILL'
      });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          timedOut = true;
          proc.kill('SIGKILL');
        }
      }, timeout);

      // Unref the timer so it doesn't keep the process alive
      timer.unref();

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
        finished = true;
        clearTimeout(timer);
        if (timedOut) {
          reject(new Error('Execution timed out'));
        } else {
          resolve({ stdout, stderr, code: code || 0 });
        }
      });

      proc.on('error', (error) => {
        finished = true;
        clearTimeout(timer);
        reject(error);
      });

      // Ensure process is killed on exit
      proc.unref();
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

  // Optimized file execution - run the file directly without creating temp file
  async executeFile(filepath: string, args: FunctionArgs): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'python3',
        [filepath, JSON.stringify(args)]
      );

      if (exitCode !== 0) {
        let error = 'Function execution failed';
        try {
          const errorData = JSON.parse(stderr);
          error = errorData.error || stderr;
        } catch {
          error = stderr || 'Unknown error';
        }
        
        return {
          success: false,
          error,
          executionTime: Date.now() - startTime
        };
      }

      try {
        const result = JSON.parse(stdout);
        return {
          success: true,
          output: result,
          executionTime: Date.now() - startTime
        };
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse result: ${stdout}`,
          executionTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
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

  async execute(code: string, args: FunctionArgs): Promise<ExecutionResult> {
    // Check if the code already has the wrapper (for file-based functions)
    const hasWrapper = code.includes('if __name__ == "__main__":') && 
                      code.includes('json.loads(sys.argv[1])');
    
    const wrappedCode = hasWrapper ? code : `
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

  // Optimized file execution
  async executeFile(filepath: string, args: FunctionArgs): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Create a wrapper script that loads the file and executes it
    const wrapperCode = `
const args = JSON.parse(process.argv[2] || '{}');
const module = require('${filepath}');
const main = module.main || module.default || module;

if (typeof main !== 'function') {
  console.error(JSON.stringify({ error: 'No main function found' }));
  process.exit(1);
}

try {
  const result = main(args);
  if (result instanceof Promise) {
    result.then(res => {
      console.log(JSON.stringify(res));
    }).catch(err => {
      console.error(JSON.stringify({ error: err.message || err.toString() }));
      process.exit(1);
    });
  } else {
    console.log(JSON.stringify(result));
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message || err.toString() }));
  process.exit(1);
}
`;
    
    const wrapperPath = await this.createTempFile(wrapperCode, 'js');
    
    try {
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'node',
        [wrapperPath, JSON.stringify(args)]
      );

      if (exitCode !== 0) {
        let error = 'Execution failed';
        try {
          const errorData = JSON.parse(stderr);
          error = errorData.error || stderr;
        } catch {
          error = stderr || 'Unknown error';
        }
        
        return {
          success: false,
          error,
          executionTime: Date.now() - startTime
        };
      }

      try {
        const result = JSON.parse(stdout);
        return {
          success: true,
          output: result,
          executionTime: Date.now() - startTime
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.cleanupTempFile(wrapperPath);
    }
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

  async execute(code: string, args: FunctionArgs): Promise<ExecutionResult> {
    const wrappedCode = `
${code}

// Handle CommonJS exports
let mainFunc;
if (typeof main !== 'undefined' && typeof main === 'function') {
  mainFunc = main;
} else if (typeof module !== 'undefined' && module.exports) {
  if (typeof module.exports.main === 'function') {
    mainFunc = module.exports.main;
  } else if (typeof module.exports === 'function') {
    mainFunc = module.exports;
  }
} else if (typeof exports !== 'undefined' && typeof exports.main === 'function') {
  mainFunc = exports.main;
}

if (!mainFunc) {
  console.error(JSON.stringify({ error: 'No main function found' }));
  process.exit(1);
}

// Main execution
(async () => {
  try {
    const args = JSON.parse(process.argv[2] || '{}');
    const result = await mainFunc(args);
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

  async execute(code: string, args: FunctionArgs): Promise<ExecutionResult> {
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

class RubyExecutor extends BaseExecutor {
  getFileExtension(): string {
    return 'rb';
  }

  async validate(code: string): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'rb');
    
    try {
      const { stderr, code: exitCode } = await this.runCommand(
        'ruby',
        ['-c', filepath]
      );

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Ruby syntax error']
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

  async execute(code: string, args: FunctionArgs): Promise<ExecutionResult> {
    const wrappedCode = `
require 'json'

${code}

begin
  args = ARGV[0] ? JSON.parse(ARGV[0]) : {}
  result = main(**args.transform_keys(&:to_sym))
  puts JSON.generate(result)
rescue => e
  STDERR.puts JSON.generate({ error: e.message })
  exit 1
end
`;

    const filepath = await this.createTempFile(wrappedCode, 'rb');
    const startTime = Date.now();

    try {
      const { stdout, stderr, code: exitCode } = await this.runCommand(
        'ruby',
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

const executors: Record<SupportedLanguage, LanguageExecutor> = {
  python: new PythonExecutor(),
  javascript: new JavaScriptExecutor(),
  node: new JavaScriptExecutor(),
  typescript: new JavaScriptExecutor(), // TypeScript will be transpiled before execution
  bash: new BashExecutor(),
  ruby: new RubyExecutor()
};

export function getExecutor(language: SupportedLanguage): LanguageExecutor | null {
  return executors[language] || null;
}

export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return language in executors;
}