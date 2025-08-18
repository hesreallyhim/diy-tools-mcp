# Development Guide

This guide provides detailed information about available scripts and commands for developing the DIY Tools MCP Server.

## Available Scripts

All development tasks are managed through npm scripts defined in `package.json`:

### Core Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with auto-reload using nodemon |
| `npm run build` | Compile TypeScript to JavaScript in the `dist/` directory |
| `npm start` | Start production server (requires build) |
| `npm test` | Run all test suites with Jest |

### Testing Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode for development |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

### Code Quality Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Check code for ESLint errors |
| `npm run lint:fix` | Automatically fix ESLint errors where possible |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is properly formatted |
| `npm run typecheck` | Run TypeScript type checking without building |

### Utility Commands

| Command | Description |
|---------|-------------|
| `npm run demo` | Run the demo script to test functionality |
| `npm run clean` | Remove build artifacts (`dist/` directory) |
| `npm run clean:all` | Remove build artifacts and dependencies |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch
```

## Testing

### Test Organization

Tests are organized by module and type:

- **Unit tests**: Located in `src/<module>/__tests__/` directories
- **Integration tests**: Located in `src/__tests__/integration/`
- **Test fixtures**: Located in `test-fixtures/` for test support files

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
```

### Test Coverage

The project aims for high test coverage. Coverage reports are generated in the `coverage/` directory and can be viewed by opening `coverage/lcov-report/index.html` in a browser.

## Building for Production

```bash
# Clean previous build
npm run clean

# Build the project
npm run build

# Start production server
npm start
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

This starts the MCP server with auto-reload on file changes.

### 2. Make Changes

Edit files in the `src/` directory. The server will automatically restart when you save changes.

### 3. Run Tests

```bash
# Check if your changes break existing tests
npm test

# Run tests in watch mode for continuous feedback
npm run test:watch
```

### 4. Check Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Check types
npm run typecheck
```

### 5. Build and Test Production

```bash
# Build for production
npm run build

# Test production build
npm start
```

## Debugging

### VS Code Debugging

The project includes VS Code debug configurations. Use the "Run and Debug" panel in VS Code to:

- Debug the development server
- Debug tests
- Debug the production build

### Console Logging

During development, you can use `console.log()` for debugging. Remember to remove or replace with proper logging before committing.

### Test Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Run a specific test file
npm test -- path/to/test.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should validate"
```

## Publishing

The package is configured for npm publishing with proper preparation:

```bash
# The prepublishOnly script automatically runs:
# 1. Clean build artifacts
# 2. Run tests
# 3. Build the project

npm publish
```

This ensures that only tested and built code is published to npm.

## Environment Variables

The following environment variables can be used during development:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `DEBUG` | Enable debug logging | - |

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run typecheck` to see detailed type errors
- Ensure all dependencies are installed with `npm install`

**Tests fail after changes**
- Run `npm run test:watch` to see which tests are affected
- Check test files in the corresponding `__tests__/` directory

**Development server won't start**
- Check if port is already in use
- Ensure all dependencies are installed
- Try cleaning and rebuilding: `npm run clean && npm run build`

**ESLint or Prettier errors**
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code with Prettier

## Performance Profiling

To profile the application performance:

1. Start the server with profiling enabled
2. Use Chrome DevTools or similar profiling tools
3. Analyze CPU and memory usage patterns

## Additional Resources

- **Project Structure**: See [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) for codebase organization
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- **Security**: See [SECURITY.md](./SECURITY.md) for security policies
- **Examples**: Check the `examples/` directory for usage examples