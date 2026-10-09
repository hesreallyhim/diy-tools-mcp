[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/hesreallyhim-diy-tools-mcp-badge.png)](https://mseep.ai/app/hesreallyhim-diy-tools-mcp)

# DIY Tools MCP Server

[![npm version](https://img.shields.io/npm/v/diy-tools-mcp.svg)](https://www.npmjs.com/package/diy-tools-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/node/v/diy-tools-mcp.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/hesreallyhim/diy-tools-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/hesreallyhim/diy-tools-mcp/actions/workflows/ci.yml)
[![Verified on MseeP](https://mseep.ai/badge.svg)](https://mseep.ai/app/a3f05c40-4cc1-432d-b081-f5b418d00fd1)

A Model Context Protocol (MCP) server that allows you to create custom tools/functions at runtime in any programming language and expose them to Claude or other MCP clients.

## Overview

The DIY Tools MCP server enables you to dynamically add custom tools without needing to write a full MCP server. Simply provide the function code, parameters schema, and the server handles the rest - validation, execution, persistence, and MCP protocol integration.

This server bridges the gap between simple function definitions and the MCP protocol, making it easy to extend Claude's capabilities with custom tools written in Python, JavaScript, Bash, Ruby, or TypeScript.

## Features

- **Dynamic Tool Registration**: Add new tools at runtime without restarting the server
- **Multi-Language Support**: Write functions in Python, JavaScript, Bash, and more
- **File-Based Functions**: Define functions in separate files for better maintainability
- **Automatic Validation**: Functions are validated for syntax before registration
- **Security Validation**: Comprehensive security checks for file-based functions
- **Persistence**: Registered tools are saved and automatically loaded on server restart
- **Type Safety**: Full JSON Schema validation for function parameters
- **Error Handling**: Comprehensive error messages and timeout protection
- **Source Code Viewer**: Built-in tool to inspect function source code

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/diy-tools-mcp.git
cd diy-tools-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Starting the Server

```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### Adding Tools

The server provides four built-in tools:

1. **`add_tool`** - Register a new custom function
2. **`remove_tool`** - Remove a registered function
3. **`list_tools`** - List all available custom tools
4. **`view_source`** - View the source code of a registered tool

### Example: Adding a Python Tool

```json
{
  "name": "calculate_factorial",
  "description": "Calculate the factorial of a number",
  "language": "python",
  "code": "def main(n):\n    if n <= 1:\n        return 1\n    return n * main(n - 1)",
  "parameters": {
    "type": "object",
    "properties": {
      "n": {
        "type": "integer",
        "description": "The number to calculate factorial for",
        "minimum": 0
      }
    },
    "required": ["n"]
  },
  "returns": "The factorial of the input number"
}
```

### Example: Adding a JavaScript Tool

```json
{
  "name": "format_date",
  "description": "Format a date string",
  "language": "javascript",
  "code": "function main({ date, format }) {\n  const d = new Date(date);\n  if (format === 'short') {\n    return d.toLocaleDateString();\n  }\n  return d.toLocaleString();\n}",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "Date string to format"
      },
      "format": {
        "type": "string",
        "enum": ["short", "long"],
        "default": "long"
      }
    },
    "required": ["date"]
  }
}
```

### Example: Adding a Bash Tool

```json
{
  "name": "system_info",
  "description": "Get basic system information",
  "language": "bash",
  "code": "main() {\n  echo '{\"os\": \"'$(uname -s)'\", \"kernel\": \"'$(uname -r)'\", \"arch\": \"'$(uname -m)'\"}'\n}",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

### File-Based Functions

You can now define functions in separate files instead of inline code. This is useful for:
- Complex functions that are easier to maintain in dedicated files
- Functions you want to version control separately
- Reusing existing code without modification

#### Example: Adding a Python Function from File

1. Create your function file `my_function.py`:
```python
from datetime import datetime

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

module.exports = { main };
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

### Configurable Entry Points (New in v1.2.0)

You can now specify any function name as the entry point, not just `main`. This allows you to:
- Use existing code without renaming functions
- Share a single file between multiple tools with different entry points
- Better organize related functions

#### Example: Multiple Tools from One File

1. Create a file with multiple functions `math_utils.py`:
```python
def calculate_tax(income, tax_rate):
    """Calculate tax amount."""
    return {
        "tax_amount": income * tax_rate,
        "net_income": income * (1 - tax_rate)
    }

def compound_interest(principal, rate, time):
    """Calculate compound interest."""
    amount = principal * (1 + rate) ** time
    return {
        "principal": principal,
        "interest": amount - principal,
        "total": amount
    }
```

2. Register multiple tools using different entry points:
```json
// Tax calculator tool
{
  "name": "tax_calculator",
  "description": "Calculate tax and net income",
  "language": "python",
  "codePath": "./math_utils.py",
  "entryPoint": "calculate_tax",  // Specify which function to use
  "parameters": {
    "type": "object",
    "properties": {
      "income": { "type": "number" },
      "tax_rate": { "type": "number" }
    },
    "required": ["income", "tax_rate"]
  }
}

// Interest calculator tool
{
  "name": "interest_calculator",
  "description": "Calculate compound interest",
  "language": "python",
  "codePath": "./math_utils.py",
  "entryPoint": "compound_interest",  // Different function from same file
  "parameters": {
    "type": "object",
    "properties": {
      "principal": { "type": "number" },
      "rate": { "type": "number" },
      "time": { "type": "number" }
    },
    "required": ["principal", "rate", "time"]
  }
}
```

If no `entryPoint` is specified, the system defaults to looking for a function named `main` for backward compatibility.

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

The `verbose` option includes full metadata about the tool in addition to the source code.

## Supported Languages

- **Python** (`python`) - Requires Python 3.x
- **JavaScript** (`javascript` or `node`) - Requires Node.js
- **Bash** (`bash`) - Requires Bash shell
- **TypeScript** (`typescript`) - Transpiled and run as JavaScript
- **Ruby** (`ruby`) - Requires Ruby

## Function Requirements

### Python Functions

- Must define a `main` function that accepts keyword arguments
- Should return JSON-serializable data
- Example:
  ```python
  def main(x, y):
      return x + y
  ```

### JavaScript Functions

- Must define a `main` function (regular or async)
- Receives parameters as a single object
- Example:
  ```javascript
  function main({ x, y }) {
    return x + y;
  }
  ```

### Bash Functions

- Must define a `main` function
- Receives JSON arguments as first parameter
- Should output JSON to stdout
- Example:
  ```bash
  main() {
    # Parse JSON args if needed
    echo '{"result": "success"}'
  }
  ```

### Ruby Functions

- Must define a `main` method that accepts keyword arguments
- Should return JSON-serializable data
- Example:
  ```ruby
  def main(name:, age:)
    { greeting: "Hello #{name}, you are #{age} years old!" }
  end
  ```

## Configuration

### Timeout Settings

You can specify a timeout for each function (in milliseconds):

```json
{
  "timeout": 5000 // 5 seconds
}
```

Maximum timeout is 300000ms (5 minutes).

### Dependencies

For Python functions, you can specify required packages:

```json
{
  "dependencies": ["numpy", "pandas"]
}
```

Note: Automatic dependency installation is not yet implemented.

## Error Handling

The server provides detailed error messages for:

- Syntax errors in function code
- Invalid parameter schemas
- Runtime execution errors
- Timeout violations
- Missing dependencies

## Storage

Functions are stored in the `functions/` directory as JSON files. Each file contains:

- Function specification
- Unique ID
- Creation and update timestamps

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Security Considerations

### File-Based Functions Security

When using file-based functions, the server implements multiple security layers:

1. **Path Traversal Protection**: Prevents access to files outside the intended directories
2. **Symbolic Link Detection**: Blocks symbolic links to prevent unauthorized file access
3. **System Directory Protection**: Restricts access to critical system directories including:
   - `/etc`, `/usr/bin`, `/System` (macOS), `C:\Windows`
   - User-specific sensitive directories (`~/.ssh`, `~/.aws`, etc.)
4. **File Size Limits**: Files are limited to 10MB to prevent resource exhaustion
5. **Dangerous Pattern Detection**: Scans for potentially malicious code patterns:
   - `eval()` and `exec()` calls
   - Dynamic imports and requires
   - Dangerous shell commands (`rm -rf /`, etc.)
   - Subprocess calls with shell=True
6. **File Extension Validation**: Only allows appropriate extensions for each language
7. **Main Function Requirement**: Enforces that all functions have a proper `main` entry point

### General Security Notes

- Functions run with the same permissions as the server
- No built-in sandboxing (use with trusted code only)
- Network and file system access depends on the language runtime
- Consider running in a containerized environment for production use
- When copying function files, the server creates isolated copies to prevent external modifications

## Best Practices

### When to Use File-Based vs Inline Functions

**Use file-based functions for:**
- Complex logic that benefits from IDE features (syntax highlighting, linting, debugging)
- Functions you want to unit test separately
- Shared utilities across multiple tools
- Functions that require multiple helper functions
- Code that you want to version control independently

**Use inline functions for:**
- Simple, single-purpose operations (< 20 lines)
- Quick prototypes and experiments
- Functions that are tightly coupled to their tool definition
- One-off utilities that don't need separate maintenance

### Directory Organization

Organize your functions for maintainability:

```
my-mcp-tools/
├── functions/          # Auto-managed metadata (don't edit)
├── function-code/      # Auto-managed copies (don't edit)
└── my-functions/       # Your source files
    ├── data/
    │   ├── processor.js
    │   └── validator.py
    ├── ml/
    │   ├── predictor.py
    │   └── trainer.py
    └── tests/
        ├── test_processor.js
        └── test_validator.py
```

### Function Design Guidelines

1. **Keep functions focused**: Each function should do one thing well
2. **Use clear parameter names**: Make your API intuitive
3. **Provide comprehensive descriptions**: Help users understand what your tool does
4. **Handle errors gracefully**: Return meaningful error messages
5. **Validate inputs early**: Check parameters before processing
6. **Document edge cases**: Use the `returns` field to explain output format

## Migration Guide

### Migrating from Inline to File-Based Functions

Existing inline functions continue to work without changes. To migrate an inline function to file-based:

1. **Extract the code to a new file:**
   ```python
   # Before (inline)
   "code": "def main(x, y):\n    return x + y"
   
   # After (calculator.py)
   def main(x, y):
       return x + y
   ```

2. **Update the tool definition:**
   ```json
   // Before
   {
     "name": "calculator",
     "code": "def main(x, y):\n    return x + y",
     ...
   }
   
   // After
   {
     "name": "calculator",
     "codePath": "./my-functions/calculator.py",
     ...
   }
   ```

3. **Re-register the tool:**
   - Use `remove_tool` to remove the old inline version
   - Use `add_tool` with the new file-based definition

The server automatically handles the transition, copying the file to its managed directory and preserving all functionality.

### Gradual Migration Strategy

1. **Start with new functions**: Write all new functions as files
2. **Migrate complex functions first**: Move functions that would benefit most from IDE support
3. **Keep simple functions inline**: Don't migrate unless there's a clear benefit
4. **Test after migration**: Ensure functions work identically after migration

## Roadmap

### Completed Features ✅
- [x] Allow users to write functions in stand-alone files, as opposed to inline in the tool definition
- [x] Add tool to view function source code (`view_source`)
- [x] Enforce single `main` function entry point with comprehensive validation
- [x] Comprehensive security validation for file-based functions

### Future Enhancements
- [ ] Configurable entry points (use any function name instead of requiring `main`)
- [ ] Support for multiple entry points per file (share code between tools)
- [ ] File watching and hot-reload for development workflow
- [ ] Dependency resolution for local imports
- [ ] Version tracking and rollback capabilities
- [ ] Streaming output for long-running functions
- [ ] Function composition and chaining

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT
