import { StoredFunction, ExecutionResult, ExecutionError } from '../types/index.js';
import { getExecutor } from '../utils/language.js';
import { FunctionValidator } from './validator.js';

export class FunctionExecutor {
  private validator: FunctionValidator;

  constructor() {
    this.validator = new FunctionValidator();
  }

  async execute(func: StoredFunction, args: any): Promise<ExecutionResult> {
    try {
      // Validate arguments against schema
      this.validator.validateArguments(func.parameters, args);

      // Get the appropriate executor
      const executor = getExecutor(func.language);
      if (!executor) {
        throw new ExecutionError(`No executor available for language: ${func.language}`);
      }

      // Execute the function with timeout
      const timeout = func.timeout || 30000; // Default 30 seconds
      const executionPromise = executor.execute(func.code, args);
      
      const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
        const timer = global.setTimeout(() => reject(new Error('Function execution timed out')), timeout);
      });

      try {
        const result = await Promise.race([executionPromise, timeoutPromise]);
        return result;
      } catch (error) {
        if (error instanceof Error && error.message === 'Function execution timed out') {
          return {
            success: false,
            error: `Execution timed out after ${timeout}ms`,
            executionTime: timeout
          };
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
          executionTime: 0
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
        executionTime: 0
      };
    }
  }
}