import { StoredFunction, ExecutionResult, ExecutionError, isInlineFunction, isFileBasedFunction } from '../types/index.js';
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

      // Get the code to execute
      let codeToExecute: string;
      if (isInlineFunction(func)) {
        codeToExecute = func.code!;
      } else if (isFileBasedFunction(func)) {
        // For file-based functions, we'll need to read the file
        // This will be implemented in the next ticket
        throw new ExecutionError('File-based function execution not yet implemented');
      } else {
        throw new ExecutionError('Function must have either code or codePath');
      }

      // Execute the function with timeout
      const timeout = func.timeout || 30000; // Default 30 seconds
      const startTime = Date.now();
      
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Function execution timed out')), timeout);
      });

      try {
        const result = await Promise.race([
          executor.execute(codeToExecute, args),
          timeoutPromise
        ]);
        clearTimeout(timeoutId!);
        return result;
      } catch (error) {
        clearTimeout(timeoutId!);
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