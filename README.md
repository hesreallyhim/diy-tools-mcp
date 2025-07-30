[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/hesreallyhim-diy-tools-mcp-badge.png)](https://mseep.ai/app/hesreallyhim-diy-tools-mcp)

# DIY Tools MCP Server

A Model Context Protocol (MCP) server that allows you to create custom tools/functions at runtime in any programming language and expose them to Claude or other MCP clients.

## Overview

The DIY Tools MCP server enables you to dynamically add custom tools without needing to write a full MCP server. Simply provide the function code, parameters schema, and the server handles the rest - validation, execution, persistence, and MCP protocol integration.

This server bridges the gap between simple function definitions and the MCP protocol, making it easy to extend Claude's capabilities with custom tools written in Python, JavaScript, Bash, Ruby, or TypeScript.

## Features

- **Dynamic Tool Registration**: Add new tools at runtime without restarting the server
- **Multi-Language Support**: Write functions in Python, JavaScript, Bash, and more
- **Automatic Validation**: Functions are validated for syntax before registration
- **Persistence**: Registered tools are saved and automatically loaded on server restart
- **Type Safety**: Full JSON Schema validation for function parameters
- **Error Handling**: Comprehensive error messages and timeout protection

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

The server provides three built-in tools:

1. **`add_tool`** - Register a new custom function
2. **`remove_tool`** - Remove a registered function
3. **`list_tools`** - List all available custom tools

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

- Functions run with the same permissions as the server
- No built-in sandboxing (use with trusted code only)
- Network and file system access depends on the language runtime
- Consider running in a containerized environment for production use

## Roadmap:

- [ ] Allow users to write functions in a stand-alone file, as opposed to inline in the tool definition.
- [ ] Add tool/resources to view function source code.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT
