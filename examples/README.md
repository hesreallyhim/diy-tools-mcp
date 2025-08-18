# DIY Tools MCP Examples

This directory contains example functions that can be registered with the DIY Tools MCP server. Each subdirectory contains examples for a specific programming language.

## Directory Structure

```
examples/
├── python/       # Python function examples
├── javascript/   # JavaScript function examples  
├── typescript/   # TypeScript function examples
├── bash/         # Bash script examples
└── ruby/         # Ruby function examples
```

## How to Use These Examples

### 1. Inline Registration

You can copy the code from any example and register it as an inline function:

```json
{
  "name": "example_function",
  "description": "Description of what it does",
  "language": "python",
  "code": "<paste code here>",
  "parameters": { ... }
}
```

### 2. File-Based Registration

Point directly to the example file:

```json
{
  "name": "example_function",
  "description": "Description of what it does",
  "language": "python",
  "codePath": "./examples/python/data_processor.py",
  "parameters": { ... }
}
```

## Example Categories

### Data Processing
- `python/data_processor.py` - CSV/JSON data manipulation with parsing and transformation
- `python/web_scraper.py` - HTML parsing and data extraction utilities
- `javascript/api_client.js` - Mock API interactions and data handling
- `typescript/data_transformer.ts` - Advanced data transformation operations

### Text & String Utilities
- `python/text_analyzer.py` - Text statistics and analysis (entry point example)
- `javascript/string_utils.js` - Comprehensive string manipulation functions
- `javascript/json_transformer.js` - JSON structure transformation
- `ruby/text_analyzer.rb` - Advanced text analysis with NLP-like features

### Mathematical Operations
- `python/simple_math.py` - Mathematical operations and statistical functions
- `python/math_utils.py` - Mathematical utility functions (entry point example)

### Date & Time
- `javascript/date_formatter.js` - Date formatting and manipulation utilities

### System & File Operations
- `bash/system_info.sh` - Gather system information
- `bash/file_operations.sh` - Advanced file and directory operations

### Type Validation & Schema
- `typescript/type_validator.ts` - Runtime type validation and schema checking

### Entry Point Examples
Located in `entry-points/`:
- `math_utils.py` - Example of function with multiple entry points

## Testing Examples

Each example includes:
1. Clear documentation in comments
2. Input validation
3. Error handling
4. Return type descriptions

You can test any example by:
1. Registering it with the MCP server
2. Calling it with appropriate parameters
3. Viewing the source with `view_source` tool

## Contributing

When adding new examples:
- Include comprehensive comments
- Add input validation
- Handle edge cases
- Follow language-specific best practices
- Test thoroughly before committing