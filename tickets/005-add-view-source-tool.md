# Ticket 005: Add view_source Tool for Viewing Function Code

## Overview
Implement a new MCP tool that allows users to view the source code of registered functions. This addresses the second item in the roadmap.

## Requirements
1. Create a new `view_source` tool
2. Support viewing code for both inline and file-based functions
3. Include metadata about the function (language, parameters, etc.)
4. Format output in a readable way

## Implementation Details

### Add to src/tools/manager.ts

```typescript
export class ToolManager {
  getTools(): Array<{ name: string; description: string; inputSchema: any }> {
    // ... existing tools ...
    
    // Add view_source tool
    tools.push({
      name: 'view_source',
      description: 'View the source code of a registered custom tool',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the tool to view'
          },
          verbose: {
            type: 'boolean',
            description: 'Include full metadata in addition to source code',
            default: false
          }
        },
        required: ['name']
      }
    });
    
    return tools;
  }

  async handleToolCall(request: any): Promise<any> {
    const { name, arguments: args } = request.params;

    switch (name) {
      // ... existing cases ...
      
      case 'view_source': {
        const { name: toolName, verbose = false } = args as { name: string; verbose?: boolean };
        const tool = this.registeredTools.get(toolName);
        
        if (!tool) {
          return {
            success: false,
            error: `Tool "${toolName}" not found`
          };
        }
        
        // Load the source code
        const sourceCode = await this.storage.loadFunctionCode(tool);
        
        if (verbose) {
          return {
            success: true,
            tool: {
              name: tool.name,
              description: tool.description,
              language: tool.language,
              parameters: tool.parameters,
              returns: tool.returns,
              dependencies: tool.dependencies,
              timeout: tool.timeout,
              isFileBased: !!tool.codePath,
              codePath: tool.codePath,
              createdAt: tool.createdAt,
              updatedAt: tool.updatedAt,
              sourceCode
            }
          };
        } else {
          return {
            success: true,
            name: tool.name,
            language: tool.language,
            sourceCode
          };
        }
      }
      
      default: {
        // ... existing default case ...
      }
    }
  }
}
```

## Output Format Examples

### Basic output (verbose=false):
```json
{
  "success": true,
  "name": "add_numbers",
  "language": "python",
  "sourceCode": "def main(a, b):\n    return a + b"
}
```

### Verbose output (verbose=true):
```json
{
  "success": true,
  "tool": {
    "name": "add_numbers",
    "description": "Adds two numbers",
    "language": "python",
    "parameters": {
      "type": "object",
      "properties": {
        "a": { "type": "number" },
        "b": { "type": "number" }
      }
    },
    "returns": "The sum of a and b",
    "dependencies": [],
    "timeout": 5000,
    "isFileBased": true,
    "codePath": "function-code/add_numbers.py",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "sourceCode": "def main(a, b):\n    return a + b"
  }
}
```

## Testing
- Test viewing inline function source
- Test viewing file-based function source
- Test verbose vs non-verbose output
- Test error handling for non-existent tools
- Test with functions in different languages

## Acceptance Criteria
- [ ] view_source tool is available
- [ ] Works for both inline and file-based functions
- [ ] Verbose mode provides full metadata
- [ ] Clean, readable output format
- [ ] Proper error handling for missing tools