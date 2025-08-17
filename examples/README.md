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
- `python/data_processor.py` - CSV/JSON data manipulation
- `javascript/json_transformer.js` - JSON structure transformation

### Text Utilities
- `python/text_analyzer.py` - Text statistics and analysis
- `javascript/markdown_generator.js` - Generate markdown documents

### System Utilities
- `bash/system_info.sh` - Gather system information
- `python/file_organizer.py` - Organize files by type/date

### Web Utilities
- `javascript/url_parser.js` - Parse and validate URLs
- `python/web_scraper.py` - Basic web scraping

### Math & Calculations
- `python/calculator.py` - Advanced calculations
- `typescript/statistics.ts` - Statistical functions

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