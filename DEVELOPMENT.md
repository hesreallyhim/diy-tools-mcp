# Development Guide

## Available Scripts

All development tasks are managed through npm scripts:

### Core Commands
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server (requires build)
- `npm test` - Run all tests

### Testing
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only

### Utilities
- `npm run typecheck` - Check TypeScript types without building
- `npm run demo` - Run the demo script
- `npm run clean` - Clean build artifacts
- `npm run clean:all` - Clean everything including node_modules

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch
```

## Testing

Tests are organized by module:
- Unit tests: `src/<module>/__tests__/`
- Integration tests: `src/__tests__/integration/`

## Building for Production

```bash
npm run build
npm start
```

## Publishing

The package will automatically be built and tested before publishing:

```bash
npm publish
```