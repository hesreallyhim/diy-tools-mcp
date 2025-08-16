# Ticket 003: Modify Executors to Work with File Paths

## Overview
Update the executor system to handle both inline code and file references for function execution.

## Requirements
1. Modify executors to accept either code strings or file paths
2. Optimize execution for file-based functions (avoid unnecessary temp files)
3. Maintain current execution behavior for inline functions

## Implementation Details

### Update src/tools/executor.ts

```typescript
import { FunctionStorage } from '../storage/functions.js';

export class FunctionExecutor {
  private validator: FunctionValidator;
  private storage: FunctionStorage;

  constructor() {
    this.validator = new FunctionValidator();
    this.storage = new FunctionStorage();
  }

  async execute(func: StoredFunction, args: any): Promise<ExecutionResult> {
    try {
      // Validate arguments
      this.validator.validateArguments(func.parameters, args);

      // Get the appropriate executor
      const executor = getExecutor(func.language);
      if (!executor) {
        throw new ExecutionError(`No executor available for language: ${func.language}`);
      }

      // Load code if needed
      const code = await this.storage.loadFunctionCode(func);

      // Execute with timeout
      const timeout = func.timeout || 30000;
      const startTime = Date.now();
      
      // For file-based functions with certain languages, we might optimize
      const result = await this.executeWithTimeout(
        executor, 
        code, 
        args, 
        timeout,
        func.codePath // Pass the file path for potential optimization
      );
      
      return result;
    } catch (error) {
      // Error handling...
    }
  }

  private async executeWithTimeout(
    executor: LanguageExecutor,
    code: string,
    args: any,
    timeout: number,
    codePath?: string
  ): Promise<ExecutionResult> {
    // Implementation with timeout logic
    // Could optimize for file-based functions
  }
}
```

### Update src/utils/language.ts

Add optional optimization for file-based execution:

```typescript
abstract class BaseExecutor implements LanguageExecutor {
  // Add optional file execution method
  async executeFile?(filepath: string, args: any): Promise<ExecutionResult>;
  
  async execute(code: string, args: any, codePath?: string): Promise<ExecutionResult> {
    // If we have a file path and the executor supports direct file execution
    if (codePath && this.executeFile) {
      return this.executeFile(codePath, args);
    }
    
    // Otherwise use the existing temp file approach
    return this.executeCode(code, args);
  }
}
```

## Benefits
- Avoid creating temp files for functions already stored as files
- Better performance for file-based functions
- Maintain compatibility with inline functions

## Testing
- Test execution of inline functions
- Test execution of file-based functions
- Test timeout handling for both types
- Test error handling and reporting

## Acceptance Criteria
- [ ] Executors handle both inline and file-based functions
- [ ] Performance optimized for file-based functions where possible
- [ ] Timeout and error handling work correctly
- [ ] All supported languages work with both approaches