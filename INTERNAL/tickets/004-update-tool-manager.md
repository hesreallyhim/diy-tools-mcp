# Ticket 004: Update Tool Manager for File-Based Functions

## Overview
Modify the tool manager to handle registration and management of file-based functions.

## Requirements
1. Update `add_tool` to accept both inline code and file paths
2. Enhance validation for file-based functions
3. Update tool schema to reflect new options

## Implementation Details

### Update src/tools/manager.ts

```typescript
export class ToolManager {
  async addTool(spec: FunctionSpecification): Promise<StoredFunction> {
    try {
      // Validate mutual exclusivity
      if (spec.code && spec.codePath) {
        throw new RegistrationError('Cannot specify both code and codePath');
      }
      
      if (!spec.code && !spec.codePath) {
        throw new RegistrationError('Must specify either code or codePath');
      }
      
      // Validate file path if provided
      if (spec.codePath) {
        await this.validateFilePath(spec.codePath, spec.language);
      }
      
      // Validate the function
      await this.validator.validate(spec);

      // Check for duplicate names
      if (this.registeredTools.has(spec.name)) {
        throw new RegistrationError(`Tool with name "${spec.name}" already exists`);
      }

      // Save to storage (handles file copying)
      const storedFunction = await this.storage.save(spec);

      // Register the tool
      await this.registerTool(storedFunction, true);

      return storedFunction;
    } catch (error) {
      // Error handling...
    }
  }

  private async validateFilePath(filePath: string, language: SupportedLanguage): Promise<void> {
    const resolvedPath = resolve(filePath);
    
    // Check file exists
    if (!existsSync(resolvedPath)) {
      throw new RegistrationError(`File not found: ${filePath}`);
    }
    
    // Check file extension matches language
    const ext = extname(resolvedPath).slice(1);
    const expectedExt = getLanguageExtension(language);
    
    if (ext !== expectedExt) {
      throw new RegistrationError(
        `File extension .${ext} doesn't match language ${language} (expected .${expectedExt})`
      );
    }
    
    // Additional security checks
    // - Ensure file is readable
    // - Check file size limits
    // - Verify not a symlink to sensitive location
  }

  getTools(): Array<{ name: string; description: string; inputSchema: any }> {
    const tools = Array.from(this.registeredTools.values()).map(func => ({
      name: func.name,
      description: func.description,
      inputSchema: func.parameters
    }));

    // Update add_tool schema
    tools.push({
      name: 'add_tool',
      description: 'Add a new custom tool/function to the server',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the tool (must be unique)',
            pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
          },
          description: {
            type: 'string',
            description: 'A description of what the tool does'
          },
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'typescript', 'bash', 'ruby', 'node'],
            description: 'The programming language the function is written in'
          },
          code: {
            type: 'string',
            description: 'The function code (inline). Mutually exclusive with codePath'
          },
          codePath: {
            type: 'string',
            description: 'Path to file containing the function code. Mutually exclusive with code'
          },
          parameters: {
            type: 'object',
            description: 'JSON Schema defining the input parameters'
          },
          returns: {
            type: 'string',
            description: 'Optional description of what the function returns'
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of dependencies'
          },
          timeout: {
            type: 'number',
            description: 'Optional timeout in milliseconds',
            minimum: 1,
            maximum: 300000
          }
        },
        required: ['name', 'description', 'language', 'parameters'],
        oneOf: [
          { required: ['code'] },
          { required: ['codePath'] }
        ]
      }
    });

    // ... rest of tools
    return tools;
  }
}
```

## Testing
- Test adding inline functions
- Test adding file-based functions
- Test validation of file paths
- Test error cases (missing files, wrong extensions, etc.)
- Test security validations

## Acceptance Criteria
- [ ] Tool manager accepts both inline and file-based functions
- [ ] Proper validation for file paths
- [ ] Updated schema with oneOf constraint
- [ ] Security checks implemented
- [ ] Clear error messages for validation failures