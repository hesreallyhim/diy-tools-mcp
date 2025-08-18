# Contributing to DIY Tools MCP Server

Thank you for your interest in contributing to the DIY Tools MCP Server! This guide will help you get started with contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, inclusive, and constructive in all interactions. We welcome contributors from all backgrounds and skill levels.

## How to Contribute

### Reporting Issues

Before creating a new issue, please:

1. **Check existing issues** - Search through open and closed issues to avoid duplicates
2. **Use issue templates** when available for consistency
3. **Provide detailed information** including:
   - Clear description of the problem or feature request
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - System information (OS, Node.js version)
   - Relevant logs or error messages
   - Code samples or screenshots if applicable

### Suggesting Features

1. **Check the roadmap** in README.md to see if the feature is already planned
2. **Open a discussion first** for major features to gather feedback
3. **Provide clear use cases** and examples of how the feature would be used
4. **Consider backward compatibility** and potential breaking changes

### Submitting Pull Requests

1. **Fork the repository** and create your own copy
2. **Create a feature branch** from `develop`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** following the code style guidelines
4. **Write or update tests** for any new functionality
5. **Update documentation** if your changes affect user-facing features
6. **Commit your changes** using conventional commit messages
7. **Push to your fork** and create a pull request
8. **Fill out the PR template** with:
   - Clear title and description
   - Link to related issue(s)
   - Screenshots or examples if applicable
   - Testing instructions for reviewers

## Development Setup

### Prerequisites

- **Node.js 18.0.0 or higher** (check with `node --version`)
- **npm** package manager
- **Git** for version control

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/diy-tools-mcp.git
cd diy-tools-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the development server with auto-reload
npm run dev

# Run tests to ensure everything is working
npm test
```

### Development Scripts

See [DEVELOPMENT.md](./DEVELOPMENT.md) for a complete list of available npm scripts and their usage.

### Project Structure

See [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) for detailed information about the codebase organization and architecture.

## Code Style Guidelines

This project uses **TypeScript** with strict type checking and follows consistent coding standards:

### Language and Framework
- **TypeScript** for all source code
- **ES2022** features and modules
- **Node.js** runtime environment

### Code Style Rules
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings
- **Indentation**: 2 spaces, no tabs
- **Line length**: Maximum 100 characters
- **Trailing commas**: Use ES5-style trailing commas

### Best Practices
- **Meaningful names**: Use descriptive variable and function names
- **Small functions**: Keep functions focused and small
- **Type safety**: Avoid `any` types when possible
- **Error handling**: Handle errors gracefully with proper error messages
- **Documentation**: Add JSDoc comments for public APIs
- **Testing**: Write tests for new features and bug fixes

### Code Quality Tools

The project uses automated tools to maintain code quality:

- **ESLint**: Linting with TypeScript-specific rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Jest**: Testing framework

All code quality checks must pass before merging:

```bash
# Run all quality checks
npm run lint
npm run format:check
npm run typecheck
npm test
```

## Commit Message Format

We use **conventional commits** for clear and consistent commit messages:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat:` - New feature for users
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or modifying tests
- `chore:` - Build process, tooling, or dependency updates

### Examples
```bash
feat: add configurable entry points for file-based functions
fix: resolve path traversal vulnerability in file validation
docs: update README with new security features
test: add integration tests for Python function execution
chore: update ESLint configuration for TypeScript 5.0
```

### Scope (Optional)
Include a scope to specify the area of change:
```bash
feat(executor): add timeout configuration for function execution
fix(security): prevent access to system directories
docs(api): update function registration examples
```

## Testing Requirements

### Test Coverage
- **Write tests** for all new features and bug fixes
- **Update existing tests** when modifying functionality
- **Aim for high coverage** - the CI pipeline reports coverage metrics
- **Test edge cases** and error conditions

### Test Types
- **Unit tests**: Test individual functions and modules
- **Integration tests**: Test component interactions and workflows
- **Security tests**: Validate security measures and protections

### Running Tests

See [DEVELOPMENT.md](./DEVELOPMENT.md#testing) for testing commands and guidelines.

### Test Guidelines
- **Descriptive test names**: Clearly describe what is being tested
- **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
- **Mock external dependencies**: Use Jest mocks for external services and file system operations
- **Test both success and failure cases**: Include error scenarios and edge cases

## Documentation Standards

### Code Documentation
- **JSDoc comments** for public functions, classes, and interfaces
- **Inline comments** for complex logic or business rules
- **Type annotations** for better code understanding

### User Documentation
- **Update README.md** for user-facing changes
- **Include examples** for new features
- **Update function specifications** if changing APIs

### Example JSDoc Format
```typescript
/**
 * Validates and registers a new custom tool.
 * 
 * @param toolSpec - The tool specification including code and parameters
 * @param options - Optional configuration for registration
 * @returns Promise resolving to the registered tool metadata
 * @throws {ValidationError} When tool specification is invalid
 * @throws {SecurityError} When file-based code fails security checks
 */
async function registerTool(toolSpec: ToolSpec, options?: RegisterOptions): Promise<ToolMetadata>
```

## Review Process

### Automated Checks
All pull requests must pass automated checks:

1. **Linting**: ESLint checks for code quality
2. **Formatting**: Prettier checks for consistent formatting
3. **Type checking**: TypeScript compiler validates types
4. **Tests**: Jest runs all test suites
5. **Coverage**: Coverage reports are generated and uploaded

### Code Review
1. **Automated checks must pass** before human review
2. **Maintainer review** - At least one project maintainer must approve
3. **Address feedback** - Respond to comments and make requested changes
4. **Re-review** - Additional review cycles as needed
5. **Approval and merge** - Maintainer merges after approval

### CI/CD Pipeline
The project uses GitHub Actions for continuous integration:

- **Node.js versions**: Tests run on Node.js 18.x and 20.x
- **Operating system**: Tests run on Ubuntu latest
- **Automated reporting**: Coverage reports are uploaded to Codecov

## Development Workflow

### Branch Strategy
- **Main branch**: `main` - Production-ready code
- **Development branch**: `develop` - Integration branch for features
- **Feature branches**: `feature/description` - Individual features
- **Bug fix branches**: `fix/description` - Bug fixes

### Typical Workflow
1. **Create feature branch** from `develop`
2. **Implement changes** with tests and documentation
3. **Commit frequently** with clear messages
4. **Push to your fork** regularly
5. **Create pull request** when ready
6. **Address review feedback** as needed
7. **Merge** after approval

## Security Considerations

### Reporting Security Issues
See [SECURITY.md](./SECURITY.md) for detailed security reporting procedures.

### Security Guidelines
- **Validate all inputs** from external sources
- **Sanitize file paths** to prevent directory traversal
- **Limit resource usage** to prevent denial of service
- **Review dependencies** for known vulnerabilities
- **Follow principle of least privilege** in code design

## Getting Help

### Questions and Discussions
- **GitHub Discussions**: For general questions and feature discussions
- **Issues**: For bug reports and specific problems
- **Code comments**: For clarification on specific code sections

### Resources
- **[README.md](./README.md)**: Project overview and usage instructions
- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Available scripts and commands
- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)**: Codebase organization
- **[SECURITY.md](./SECURITY.md)**: Security policies and procedures
- **Examples directory**: Sample functions and usage patterns
- **Tests**: Examples of expected behavior and usage

## Recognition

Contributors will be recognized in:
- **Git history**: Your commits will be preserved with proper attribution
- **Release notes**: Significant contributions will be mentioned
- **Documentation**: Major contributors may be listed in project docs

Thank you for contributing to the DIY Tools MCP Server! Your contributions help make this project better for everyone.