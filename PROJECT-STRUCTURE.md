# DIY Tools MCP - Project Structure

## Directory Layout

```
diy-tools-mcp/
├── src/                      # Source code
│   ├── __tests__/           # Test files
│   │   ├── integration/     # Integration tests
│   │   └── *.test.ts        # Unit tests
│   ├── storage/             # Storage layer for functions
│   │   └── functions.ts     # Function persistence
│   ├── tools/               # Tool management
│   │   ├── executor.ts      # Function execution
│   │   ├── manager.ts       # Tool registration/management
│   │   └── validator.ts     # Function validation
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Core types and interfaces
│   ├── utils/               # Utility functions
│   │   ├── language.ts      # Language-specific utilities
│   │   └── security.ts      # Security validation
│   ├── index.ts             # Main entry point
│   └── server.ts            # MCP server implementation
│
├── examples/                 # Example functions
│   ├── python/              # Python examples
│   ├── javascript/          # JavaScript examples
│   ├── typescript/          # TypeScript examples
│   ├── bash/                # Bash script examples
│   └── ruby/                # Ruby examples
│
├── test-fixtures/           # Test support files
│   └── temp-tests/          # Temporary test files (preserved)
│
├── docs/                    # Documentation
│   └── TESTING.md           # Testing guide
│
├── tickets/                 # Development tickets
│   └── *.md                 # Feature implementation tickets
│
├── dist/                    # Build output (gitignored)
├── functions/               # Stored function metadata (gitignored)
├── function-code/           # Copied function files (gitignored)
└── node_modules/            # Dependencies (gitignored)
```

## Key Files

### Configuration
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration
- `.gitignore` - Git ignore patterns
- `claude_desktop_config.json` - Claude Desktop integration

### Documentation
- `README.md` - Main project documentation
- `SETUP.md` - Installation and setup guide
- `PROJECT-STATUS.md` - Development progress tracking
- `PROJECT-STRUCTURE.md` - This file
- `TEST-NOTES.md` - Testing documentation
- `docs/TESTING.md` - Comprehensive testing guide

### Entry Points
- `src/index.ts` - Main application entry
- `src/server.ts` - MCP server implementation
- `demo.ts` - Demonstration script

## Data Flow

1. **Function Registration**
   - User provides function spec (inline or file-based)
   - `ToolManager` validates via `SecurityValidator`
   - `FunctionStorage` persists metadata
   - File-based functions copied to `function-code/`

2. **Function Execution**
   - `ToolManager` receives execution request
   - `FunctionExecutor` validates arguments
   - Language-specific runner executes function
   - Results returned to user

3. **Storage Structure**
   - `functions/` - JSON metadata for each function
   - `function-code/` - Copies of file-based functions
   - Both directories are auto-managed and gitignored

## Development Workflow

1. **Adding Features**
   - Create ticket in `tickets/`
   - Implement in appropriate `src/` module
   - Add tests in `src/__tests__/`
   - Update documentation

2. **Testing**
   - Unit tests: `npm test`
   - Coverage: `npm test -- --coverage`
   - Integration tests in `src/__tests__/integration/`

3. **Examples**
   - Add example functions to `examples/[language]/`
   - Include comments and documentation
   - Test before committing

## Security Layers

1. **Path Validation** (`SecurityValidator`)
   - Path traversal protection
   - Symbolic link detection
   - System directory blocking

2. **Code Validation**
   - Dangerous pattern detection
   - Main function enforcement
   - File size limits (10MB)

3. **Execution Safety**
   - Timeout protection
   - Argument validation
   - Error isolation

## Build and Distribution

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed information about build commands and development workflow.

## Additional Resources

- **Contributing Guidelines**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute
- **Development Guide**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for available scripts and commands
- **Security Policy**: See [SECURITY.md](./SECURITY.md) for security information
- **Tickets**: Check `INTERNAL/tickets/` for planned features and improvements