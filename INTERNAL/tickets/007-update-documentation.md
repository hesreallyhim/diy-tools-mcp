# Ticket 007: Update Documentation and Examples

## Overview
Update all documentation to reflect the new file-based function capability and provide clear examples.

## Requirements
1. Update README.md with file-based function examples
2. Add migration guide for existing users
3. Document security considerations
4. Provide best practices guide

## Documentation Updates

### README.md Updates

Add new section after existing examples:

```markdown
### File-Based Functions

You can now define functions in separate files instead of inline code. This is useful for:
- Complex functions that are easier to maintain in dedicated files
- Functions you want to version control separately
- Reusing existing code without modification

#### Example: Adding a Python Function from File

1. Create your function file `my_function.py`:
```python
def main(name, age):
    """
    Generate a personalized greeting.
    """
    return {
        "greeting": f"Hello {name}!",
        "message": f"You are {age} years old.",
        "timestamp": datetime.now().isoformat()
    }
```

2. Register the function:
```json
{
  "name": "personalized_greeting",
  "description": "Generate a personalized greeting with timestamp",
  "language": "python",
  "codePath": "./my_function.py",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Person's name"
      },
      "age": {
        "type": "integer",
        "description": "Person's age"
      }
    },
    "required": ["name", "age"]
  }
}
```

#### Example: Adding a JavaScript Function from File

1. Create your function file `data_processor.js`:
```javascript
async function main({ data, format }) {
  // Process data based on format
  if (format === 'csv') {
    return processCSV(data);
  } else if (format === 'json') {
    return processJSON(data);
  }
  throw new Error(`Unsupported format: ${format}`);
}

function processCSV(data) {
  // CSV processing logic
  return { processed: true, format: 'csv', rows: data.split('\n').length };
}

function processJSON(data) {
  // JSON processing logic
  const parsed = JSON.parse(data);
  return { processed: true, format: 'json', keys: Object.keys(parsed) };
}
```

2. Register the function:
```json
{
  "name": "data_processor",
  "description": "Process data in various formats",
  "language": "javascript",
  "codePath": "./data_processor.js",
  "parameters": {
    "type": "object",
    "properties": {
      "data": {
        "type": "string",
        "description": "Raw data to process"
      },
      "format": {
        "type": "string",
        "enum": ["csv", "json"],
        "description": "Data format"
      }
    },
    "required": ["data", "format"]
  }
}
```

### Viewing Function Source Code

Use the `view_source` tool to inspect any registered function:

```json
{
  "name": "view_source",
  "arguments": {
    "name": "data_processor",
    "verbose": true
  }
}
```

### Security Considerations

When using file-based functions:

1. **File Access**: The server validates file paths to prevent unauthorized access
2. **File Size**: Files are limited to 10MB to prevent resource exhaustion
3. **Code Validation**: Files are checked for dangerous patterns before registration
4. **Isolated Execution**: Functions run in separate processes with timeouts

### Best Practices

1. **Use file-based functions for**:
   - Complex logic that benefits from IDE features
   - Functions you want to unit test separately
   - Shared utilities across multiple tools

2. **Use inline functions for**:
   - Simple, single-purpose operations
   - Quick prototypes and experiments
   - Functions that are tightly coupled to their tool definition

3. **Directory Organization**:
   ```
   my-mcp-tools/
   ├── functions/          # Auto-managed metadata
   ├── function-code/      # Auto-managed copies
   └── my-functions/       # Your source files
       ├── data_processor.js
       ├── ml_model.py
       └── tests/
           └── test_data_processor.js
   ```

### Migration Guide

Existing inline functions continue to work without changes. To migrate an inline function to file-based:

1. Copy the code to a new file
2. Update the tool definition:
   - Remove the `code` field
   - Add `codePath` pointing to your file
3. Re-register the tool

The server will automatically handle the transition.
```

## Testing Documentation

Create `docs/TESTING.md`:

```markdown
# Testing File-Based Functions

## Unit Testing Your Functions

Since functions are now in separate files, you can unit test them:

### Python Example
```python
# test_my_function.py
from my_function import main

def test_main():
    result = main(name="Alice", age=30)
    assert result["greeting"] == "Hello Alice!"
    assert result["age"] == 30
```

### JavaScript Example
```javascript
// test_data_processor.js
const { main } = require('./data_processor');

describe('data_processor', () => {
  it('processes CSV data', async () => {
    const result = await main({ 
      data: 'a,b,c\n1,2,3', 
      format: 'csv' 
    });
    expect(result.format).toBe('csv');
    expect(result.rows).toBe(2);
  });
});
```
```

## Acceptance Criteria
- [ ] README updated with file-based examples
- [ ] Security considerations documented
- [ ] Best practices guide added
- [ ] Migration guide provided
- [ ] Testing documentation created
- [ ] All examples are tested and working