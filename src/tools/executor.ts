import {
  StoredFunction,
  ExecutionResult,
  ExecutionError,
  FunctionArgs,
  LanguageExecutor,
} from '../types/index.js';
import { getExecutor } from '../utils/language.js';
import { FunctionValidator } from './validator.js';
import { FunctionStorage } from '../storage/functions.js';
import { TIMEOUTS } from '../constants.js';

export class FunctionExecutor {
  private validator: FunctionValidator;
  private storage: FunctionStorage;

  constructor() {
    this.validator = new FunctionValidator();
    this.storage = new FunctionStorage();
  }

  async execute(func: StoredFunction, args: FunctionArgs): Promise<ExecutionResult> {
    try {
      // Validate arguments against schema
      this.validator.validateArguments(func.parameters, args);

      // Get the appropriate executor
      const executor = getExecutor(func.language);
      if (!executor) {
        throw new ExecutionError(`No executor available for language: ${func.language}`);
      }

      // Load code from storage (handles both inline and file-based)
      const code = await this.storage.loadFunctionCode(func);

      // Execute the function with timeout
      const timeout = func.timeout || TIMEOUTS.DEFAULT_EXECUTION;
      const startTime = Date.now();

      // Execute with timeout
      const result = await this.executeWithTimeout(
        executor,
        code,
        args,
        timeout,
        func.entryPoint // Pass entry point for configurable function names
      );

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          error: error.message,
          executionTime: 0,
          isError: true,
        };
      }

      return {
        error: 'Unknown error occurred',
        executionTime: 0,
        isError: true,
      };
    }
  }

  private async executeWithTimeout(
    executor: LanguageExecutor,
    code: string,
    args: FunctionArgs,
    timeout: number,
    entryPoint?: string
  ): Promise<ExecutionResult> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Function execution timed out')), timeout);
      // Unref the timer so it doesn't keep the process alive
      timeoutId.unref();
    });

    try {
      // Always use standard code execution for now
      // The optimized file execution path needs the files to be properly wrapped
      // which they are not when copied from user's source files
      const result = await Promise.race([executor.execute(code, args, entryPoint), timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      if (error instanceof Error && error.message === 'Function execution timed out') {
        return {
          error: `Execution timed out after ${timeout}ms`,
          executionTime: timeout,
          isError: true,
        };
      }
      throw error;
    }
  }
}
