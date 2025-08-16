# Testing DIY Tools Functions

## Overview

With file-based functions, you can now unit test your functions independently from the MCP server. This guide shows how to test your functions before registering them.

## Benefits of Testing File-Based Functions

- **Faster Development**: Test functions without starting the MCP server
- **Better Coverage**: Write comprehensive unit tests for edge cases
- **CI/CD Integration**: Run tests in your continuous integration pipeline
- **Debugging**: Use your favorite debugger and testing tools

## Testing Python Functions

### Example Function (`calculator.py`)

```python
def main(operation, a, b):
    """
    Perform basic arithmetic operations.
    """
    if operation == "add":
        return {"result": a + b}
    elif operation == "subtract":
        return {"result": a - b}
    elif operation == "multiply":
        return {"result": a * b}
    elif operation == "divide":
        if b == 0:
            raise ValueError("Division by zero")
        return {"result": a / b}
    else:
        raise ValueError(f"Unknown operation: {operation}")
```

### Unit Test (`test_calculator.py`)

```python
import pytest
from calculator import main

def test_addition():
    result = main(operation="add", a=5, b=3)
    assert result == {"result": 8}

def test_subtraction():
    result = main(operation="subtract", a=10, b=4)
    assert result == {"result": 6}

def test_multiplication():
    result = main(operation="multiply", a=6, b=7)
    assert result == {"result": 42}

def test_division():
    result = main(operation="divide", a=15, b=3)
    assert result == {"result": 5.0}

def test_division_by_zero():
    with pytest.raises(ValueError, match="Division by zero"):
        main(operation="divide", a=10, b=0)

def test_unknown_operation():
    with pytest.raises(ValueError, match="Unknown operation"):
        main(operation="modulo", a=10, b=3)
```

### Running Python Tests

```bash
# Install pytest if needed
pip install pytest

# Run tests
pytest test_calculator.py -v
```

## Testing JavaScript Functions

### Example Function (`string_utils.js`)

```javascript
function main({ text, operation }) {
  switch (operation) {
    case 'reverse':
      return { result: text.split('').reverse().join('') };
    case 'uppercase':
      return { result: text.toUpperCase() };
    case 'lowercase':
      return { result: text.toLowerCase() };
    case 'count_words':
      return { result: text.trim().split(/\s+/).length };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

module.exports = { main };
```

### Unit Test (`string_utils.test.js`)

```javascript
const { main } = require('./string_utils');

describe('string_utils', () => {
  test('reverses text', () => {
    const result = main({ text: 'hello', operation: 'reverse' });
    expect(result).toEqual({ result: 'olleh' });
  });

  test('converts to uppercase', () => {
    const result = main({ text: 'hello world', operation: 'uppercase' });
    expect(result).toEqual({ result: 'HELLO WORLD' });
  });

  test('converts to lowercase', () => {
    const result = main({ text: 'HELLO WORLD', operation: 'lowercase' });
    expect(result).toEqual({ result: 'hello world' });
  });

  test('counts words', () => {
    const result = main({ text: '  hello   world  ', operation: 'count_words' });
    expect(result).toEqual({ result: 2 });
  });

  test('throws on unknown operation', () => {
    expect(() => {
      main({ text: 'test', operation: 'unknown' });
    }).toThrow('Unknown operation: unknown');
  });
});
```

### Running JavaScript Tests

```bash
# Install Jest if needed
npm install --save-dev jest

# Add to package.json scripts
{
  "scripts": {
    "test": "jest"
  }
}

# Run tests
npm test
```

## Testing TypeScript Functions

### Example Function (`validator.ts`)

```typescript
interface ValidationArgs {
  email?: string;
  url?: string;
  phone?: string;
}

interface ValidationResult {
  valid: boolean;
  type: string;
  value: string;
  error?: string;
}

export function main(args: ValidationArgs): ValidationResult {
  if (args.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(args.email),
      type: 'email',
      value: args.email,
      error: emailRegex.test(args.email) ? undefined : 'Invalid email format'
    };
  }
  
  if (args.url) {
    try {
      new URL(args.url);
      return { valid: true, type: 'url', value: args.url };
    } catch {
      return { 
        valid: false, 
        type: 'url', 
        value: args.url, 
        error: 'Invalid URL format' 
      };
    }
  }
  
  if (args.phone) {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return {
      valid: phoneRegex.test(args.phone),
      type: 'phone',
      value: args.phone,
      error: phoneRegex.test(args.phone) ? undefined : 'Invalid phone format'
    };
  }
  
  throw new Error('No validation type specified');
}
```

### Unit Test (`validator.test.ts`)

```typescript
import { main } from './validator';

describe('validator', () => {
  describe('email validation', () => {
    test('validates correct email', () => {
      const result = main({ email: 'user@example.com' });
      expect(result.valid).toBe(true);
      expect(result.type).toBe('email');
    });

    test('rejects invalid email', () => {
      const result = main({ email: 'not-an-email' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('URL validation', () => {
    test('validates correct URL', () => {
      const result = main({ url: 'https://example.com' });
      expect(result.valid).toBe(true);
      expect(result.type).toBe('url');
    });

    test('rejects invalid URL', () => {
      const result = main({ url: 'not a url' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('phone validation', () => {
    test('validates correct phone', () => {
      const result = main({ phone: '+1-555-123-4567' });
      expect(result.valid).toBe(true);
      expect(result.type).toBe('phone');
    });

    test('rejects invalid phone', () => {
      const result = main({ phone: 'abc123' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid phone format');
    });
  });
});
```

## Integration Testing

### Testing with the MCP Server

Once your unit tests pass, test the function with the actual MCP server:

1. **Start the MCP server**:
   ```bash
   npm start
   ```

2. **Register your function**:
   ```json
   {
     "name": "calculator",
     "description": "Perform arithmetic operations",
     "language": "python",
     "codePath": "./my-functions/calculator.py",
     "parameters": {
       "type": "object",
       "properties": {
         "operation": {
           "type": "string",
           "enum": ["add", "subtract", "multiply", "divide"]
         },
         "a": { "type": "number" },
         "b": { "type": "number" }
       },
       "required": ["operation", "a", "b"]
     }
   }
   ```

3. **Test the registered function**:
   ```json
   {
     "name": "calculator",
     "arguments": {
       "operation": "add",
       "a": 10,
       "b": 5
     }
   }
   ```

### Automated Integration Tests

Create a test script that registers and tests functions:

```javascript
// integration.test.js
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk');

describe('MCP Server Integration', () => {
  let server;
  let client;

  beforeAll(async () => {
    // Start the MCP server
    server = spawn('npm', ['start']);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Connect client
    client = new Client();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    server.kill();
  });

  test('register and execute function', async () => {
    // Register function
    const registerResult = await client.callTool('add_tool', {
      name: 'test_function',
      language: 'javascript',
      codePath: './test_function.js',
      parameters: { type: 'object', properties: {} }
    });
    
    expect(registerResult.success).toBe(true);
    
    // Execute function
    const execResult = await client.callTool('test_function', {});
    expect(execResult).toBeDefined();
  });
});
```

## Best Practices for Testing

1. **Test Edge Cases**: Include tests for invalid inputs, edge values, and error conditions
2. **Mock External Dependencies**: Use mocking for database calls, API requests, etc.
3. **Test Return Types**: Verify that functions return JSON-serializable data
4. **Performance Testing**: Test functions with large inputs to ensure they complete within timeout
5. **Security Testing**: Test that functions properly validate and sanitize inputs

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Functions

on: [push, pull_request]

jobs:
  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install pytest
      - run: pytest my-functions/tests/

  test-javascript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
```

## Debugging Tips

1. **Add Logging**: Use console.log/print statements during development
2. **Test Locally First**: Always test functions locally before registering
3. **Check Error Messages**: The MCP server provides detailed error messages
4. **Use view_source**: Verify the registered function matches your expectations
5. **Monitor Timeouts**: Ensure functions complete within the configured timeout

## Common Issues and Solutions

### Issue: Function works locally but fails when registered

**Solution**: Check that:
- The file path is correct
- All imports are available in the server environment
- The function returns JSON-serializable data

### Issue: Tests pass but function times out

**Solution**: 
- Increase the timeout in the tool definition
- Optimize the function for better performance
- Consider breaking complex functions into smaller ones

### Issue: Different behavior between inline and file-based

**Solution**:
- Ensure the file has proper imports
- Check that the main function signature matches
- Verify the file encoding is UTF-8