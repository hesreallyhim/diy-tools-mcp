# DIY Tools MCP Server Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Configure Claude Desktop

Add this to your Claude Desktop configuration file:
- On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "diy-tools": {
      "command": "node",
      "args": [
        "/absolute/path/to/diy-tools-mcp/dist/index.js"
      ]
    }
  }
}
```

Replace `/absolute/path/to/diy-tools-mcp` with the actual path to this project.

### 4. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the DIY Tools server.

## Available Tools

Once configured, the following tools will be available in Claude:

### 1. `add_tool`
Add a new custom tool/function to the server.

**Parameters:**
- `name` (string, required): Tool name (must be unique, alphanumeric + underscores)
- `description` (string, required): What the tool does
- `language` (string, required): One of: `python`, `javascript`, `typescript`, `bash`, `ruby`, `node`
- `code` (string, required): The function code (must define a `main` function)
- `parameters` (object, required): JSON Schema for input parameters
- `returns` (string, optional): Description of return value
- `dependencies` (array, optional): List of dependencies
- `timeout` (number, optional): Timeout in milliseconds (max 300000ms)

### 2. `remove_tool`
Remove a custom tool from the server.

**Parameters:**
- `name` (string, required): Name of the tool to remove

### 3. `list_tools`
List all available custom tools.

**Parameters:** None

## Example Usage in Claude

Once configured, you can ask Claude to:

1. **Add a Python tool:**
   ```
   "Add a tool called 'calculate_factorial' that calculates the factorial of a number using Python"
   ```

2. **Use the tool:**
   ```
   "Calculate the factorial of 7"
   ```

3. **Add a JavaScript tool:**
   ```
   "Create a tool that formats dates in JavaScript"
   ```

4. **List all tools:**
   ```
   "Show me all the custom tools available"
   ```

## Running the Demo

To see the server in action:

```bash
npx tsx demo.ts
```

This will demonstrate adding and using tools in different languages.

## Development

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npx tsx integration-test.temp.ts
```

### Clean Build
```bash
npm run clean
```

## Troubleshooting

### Server Not Starting
- Check that all dependencies are installed: `npm install`
- Ensure the project is built: `npm run build`
- Verify the path in Claude Desktop config is correct

### Tools Not Persisting
- Check that the `functions/` directory exists and is writable
- Look for error messages in the console

### Execution Errors
- Ensure Python 3.x is installed for Python tools
- Ensure Node.js is installed for JavaScript tools
- Check that the required language runtime is in your PATH

## Security Notes

- Tools run with the same permissions as the server
- Only add tools from trusted sources
- Consider running in a sandboxed environment for production use