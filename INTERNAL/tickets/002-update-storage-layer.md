# Ticket 002: Update Storage Layer to Handle File References

## Overview
Modify the storage layer to support saving and loading functions with file references instead of inline code.

## Requirements
1. Update storage to handle both inline and file-based functions
2. Create a dedicated directory for user function files
3. Implement file management utilities

## Implementation Details

### Directory Structure
```
functions/           # Existing - JSON metadata files
  add_a_and_b.json
  
function-code/       # New - actual code files
  add_a_and_b.py
  my_function.js
```

### Update src/storage/functions.ts

```typescript
import { readFile, writeFile, copyFile } from 'fs/promises';
import { basename, join, resolve } from 'path';

const FUNCTIONS_DIR = join(process.cwd(), 'functions');
const FUNCTION_CODE_DIR = join(process.cwd(), 'function-code');

export class FunctionStorage {
  private async ensureDirectoriesExist(): Promise<void> {
    await mkdir(FUNCTIONS_DIR, { recursive: true });
    await mkdir(FUNCTION_CODE_DIR, { recursive: true });
  }

  async save(spec: FunctionSpecification): Promise<StoredFunction> {
    await this.ensureDirectoriesExist();
    
    let finalSpec = { ...spec };
    
    // If codePath is provided, copy the file to our managed directory
    if (spec.codePath) {
      const sourceFile = resolve(spec.codePath);
      const ext = getLanguageExtension(spec.language);
      const destFile = join(FUNCTION_CODE_DIR, `${spec.name}.${ext}`);
      
      // Copy the file
      await copyFile(sourceFile, destFile);
      
      // Update the spec to use relative path
      finalSpec.codePath = `function-code/${spec.name}.${ext}`;
      delete finalSpec.code; // Ensure no inline code
    }
    
    const storedFunction: StoredFunction = {
      ...finalSpec,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save metadata
    const filename = `${spec.name}.json`;
    const filepath = join(FUNCTIONS_DIR, filename);
    await writeFile(filepath, JSON.stringify(storedFunction, null, 2));
    
    return storedFunction;
  }

  async loadFunctionCode(func: StoredFunction): Promise<string> {
    if (func.code) {
      return func.code;
    }
    
    if (func.codePath) {
      const fullPath = join(process.cwd(), func.codePath);
      return await readFile(fullPath, 'utf-8');
    }
    
    throw new Error('Function has neither code nor codePath');
  }
}
```

## Testing
- Test saving inline functions (backward compatibility)
- Test saving file-based functions
- Test loading both types
- Test error handling for missing files
- Test path resolution and security

## Acceptance Criteria
- [ ] Storage layer supports both inline and file-based functions
- [ ] Files are properly copied to managed directory
- [ ] Existing inline functions continue to work
- [ ] File paths are stored as relative paths
- [ ] Code loading works for both types