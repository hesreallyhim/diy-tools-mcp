import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  LanguageExecutor,
  ExecutionResult,
  ValidationResult,
  SupportedLanguage,
  FunctionArgs,
} from '../types/index.js';
import { TIMEOUTS } from '../constants.js';

const TEMP_DIR = '/tmp';

abstract class BaseExecutor implements LanguageExecutor {
  abstract validate(code: string, entryPoint?: string): Promise<ValidationResult>;
  abstract execute(code: string, args: FunctionArgs, entryPoint?: string): Promise<ExecutionResult>;
  abstract getFileExtension(): string;

  // Optional optimized file execution
  async executeFile?(
    filepath: string,
    args: FunctionArgs,
    entryPoint?: string
  ): Promise<ExecutionResult>;

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
        killSignal: 'SIGKILL',
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
    } catch {
      // Ignore cleanup errors
    }
  }
}

class PythonExecutor extends BaseExecutor {
  getFileExtension(): string {
    return 'py';
  }

  // Optimized file execution - run the file directly without creating temp file
  async executeFile(
    filepath: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        stdout,
        stderr,
        code: exitCode,
      } = await this.runCommand('python3', [filepath, JSON.stringify(args)]);

      if (exitCode !== 0) {
        let errorMsg = 'Function execution failed';
        try {
          const errorData = JSON.parse(stderr);
          errorMsg = errorData.error || stderr;
        } catch {
          errorMsg = stderr || 'Unknown error';
        }

        return {
          success: false,
          error: errorMsg,
          executionTime: Date.now() - startTime,
        };
      }

      try {
        const result = JSON.parse(stdout);
        return {
          success: true,
          output: result,
          executionTime: Date.now() - startTime,
        };
      } catch (_parseError) {
        return {
          success: false,
          error: `Failed to parse result: ${stdout}`,
          executionTime: Date.now() - startTime,
        };
      }
    } catch {
      return {
        success: false,
        error: 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async validate(code: string, entryPoint: string = 'main'): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'py');

    try {
      const { stderr, code: exitCode } = await this.runCommand('python3', [
        '-m',
        'py_compile',
        filepath,
      ]);

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Python syntax error'],
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        errors: [`Validation failed: Unknown error`],
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(
    code: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    // Check if the code already has the wrapper (for file-based functions)
    const hasWrapper =
      code.includes('if __name__ == "__main__":') && code.includes('json.loads(sys.argv[1])');

    const wrappedCode = hasWrapper
      ? code
      : `
import json
import sys

${code}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        # Module-level functions are in globals()
        if '${entryPoint}' not in globals():
            print(json.dumps({"error": f"Function '${entryPoint}' not found"}), file=sys.stderr)
            sys.exit(1)
        entry_func = globals()['${entryPoint}']
        result = entry_func(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`;

    const filepath = await this.createTempFile(wrappedCode, 'py');
    const startTime = Date.now();

    try {
      const {
        stdout,
        stderr,
        code: exitCode,
      } = await this.runCommand('python3', [filepath, JSON.stringify(args)]);

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
          executionTime,
        };
      }

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime,
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime,
        };
      }
    } catch {
      return {
        success: false,
        error: `Execution failed: Unknown error`,
        executionTime: Date.now() - startTime,
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
  async executeFile(
    filepath: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Create a wrapper script that loads the file and executes it
    const wrapperCode = `
const args = JSON.parse(process.argv[2] || '{}');
const module = require('${filepath}');
const entryFunc = module['${entryPoint}'] || module.${entryPoint} || (module.default && module.default['${entryPoint}']);

if (typeof entryFunc !== 'function') {
  console.error(JSON.stringify({ error: 'Function "${entryPoint}" not found' }));
  process.exit(1);
}

try {
  const result = entryFunc(args);
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
      const {
        stdout,
        stderr,
        code: exitCode,
      } = await this.runCommand('node', [wrapperPath, JSON.stringify(args)]);

      if (exitCode !== 0) {
        let errorMsg = 'Execution failed';
        try {
          const errorData = JSON.parse(stderr);
          errorMsg = errorData.error || stderr;
        } catch {
          errorMsg = stderr || 'Unknown error';
        }

        return {
          success: false,
          error: errorMsg,
          executionTime: Date.now() - startTime,
        };
      }

      try {
        const result = JSON.parse(stdout);
        return {
          success: true,
          output: result,
          executionTime: Date.now() - startTime,
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime: Date.now() - startTime,
        };
      }
    } catch {
      return {
        success: false,
        error: 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      await this.cleanupTempFile(wrapperPath);
    }
  }

  async validate(code: string, entryPoint: string = 'main'): Promise<ValidationResult> {
    const wrappedCode = `
${code}

// Validate that entry point function exists
if (typeof ${entryPoint} !== 'function') {
  throw new Error('Function "${entryPoint}" is not defined');
}
`;

    const filepath = await this.createTempFile(wrappedCode, 'js');

    try {
      const { stderr, code: exitCode } = await this.runCommand('node', ['--check', filepath]);

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'JavaScript syntax error'],
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        errors: [`Validation failed: Unknown error`],
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(
    code: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    const wrappedCode = `
${code}

// Handle CommonJS exports and find entry point
let entryFunc;
if (typeof ${entryPoint} !== 'undefined' && typeof ${entryPoint} === 'function') {
  entryFunc = ${entryPoint};
} else if (typeof module !== 'undefined' && module.exports) {
  if (typeof module.exports['${entryPoint}'] === 'function') {
    entryFunc = module.exports['${entryPoint}'];
  } else if (typeof module.exports.${entryPoint} === 'function') {
    entryFunc = module.exports.${entryPoint};
  } else if (typeof module.exports === 'function' && '${entryPoint}' === 'main') {
    entryFunc = module.exports;
  }
} else if (typeof exports !== 'undefined' && typeof exports['${entryPoint}'] === 'function') {
  entryFunc = exports['${entryPoint}'];
}

if (!entryFunc) {
  console.error(JSON.stringify({ error: 'Function "${entryPoint}" not found' }));
  process.exit(1);
}

// Main execution
(async () => {
  try {
    const args = JSON.parse(process.argv[2] || '{}');
    const result = await entryFunc(args);
    console.log(JSON.stringify(result));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error?.message || 'Unknown error' }));
    process.exit(1);
  }
})();
`;

    const filepath = await this.createTempFile(wrappedCode, 'js');
    const startTime = Date.now();

    try {
      const {
        stdout,
        stderr,
        code: exitCode,
      } = await this.runCommand('node', [filepath, JSON.stringify(args)]);

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
          executionTime,
        };
      }

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime,
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime,
        };
      }
    } catch {
      return {
        success: false,
        error: `Execution failed: Unknown error`,
        executionTime: Date.now() - startTime,
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

  async validate(code: string, entryPoint: string = 'main'): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'sh');

    try {
      const { stderr, code: exitCode } = await this.runCommand('bash', ['-n', filepath]);

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Bash syntax error'],
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        errors: [`Validation failed: Unknown error`],
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(
    code: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    const wrappedCode = `#!/bin/bash
set -e

${code}

# Parse JSON arguments
ARGS='${JSON.stringify(args)}'

# Call entry point function
${entryPoint} "$ARGS"
`;

    const filepath = await this.createTempFile(wrappedCode, 'sh');
    const startTime = Date.now();

    try {
      await this.runCommand('chmod', ['+x', filepath]);

      const { stdout, stderr, code: exitCode } = await this.runCommand('bash', [filepath]);

      const executionTime = Date.now() - startTime;

      if (exitCode !== 0) {
        return {
          success: false,
          error: stderr || 'Bash execution failed',
          executionTime,
        };
      }

      // Try to parse as JSON, otherwise return as string
      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime,
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime,
        };
      }
    } catch {
      return {
        success: false,
        error: `Execution failed: Unknown error`,
        executionTime: Date.now() - startTime,
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

  async validate(code: string, entryPoint: string = 'main'): Promise<ValidationResult> {
    const filepath = await this.createTempFile(code, 'rb');

    try {
      const { stderr, code: exitCode } = await this.runCommand('ruby', ['-c', filepath]);

      if (exitCode !== 0) {
        return {
          valid: false,
          errors: [stderr || 'Ruby syntax error'],
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        errors: [`Validation failed: Unknown error`],
      };
    } finally {
      await this.cleanupTempFile(filepath);
    }
  }

  async execute(
    code: string,
    args: FunctionArgs,
    entryPoint: string = 'main'
  ): Promise<ExecutionResult> {
    const wrappedCode = `
require 'json'

${code}

begin
  args = ARGV[0] ? JSON.parse(ARGV[0]) : {}
  result = ${entryPoint}(**args.transform_keys(&:to_sym))
  puts JSON.generate(result)
rescue => e
  STDERR.puts JSON.generate({ error: e.message })
  exit 1
end
`;

    const filepath = await this.createTempFile(wrappedCode, 'rb');
    const startTime = Date.now();

    try {
      const {
        stdout,
        stderr,
        code: exitCode,
      } = await this.runCommand('ruby', [filepath, JSON.stringify(args)]);

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
          executionTime,
        };
      }

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          output,
          executionTime,
        };
      } catch {
        return {
          success: true,
          output: stdout.trim(),
          executionTime,
        };
      }
    } catch {
      return {
        success: false,
        error: `Execution failed: Unknown error`,
        executionTime: Date.now() - startTime,
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
  ruby: new RubyExecutor(),
};

export function getExecutor(language: SupportedLanguage): LanguageExecutor | null {
  return executors[language] || null;
}

export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return language in executors;
}
