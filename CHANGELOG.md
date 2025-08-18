# Changelog

All notable changes to the DIY Tools MCP server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-08-17

### Added
- **File-based function support** - Functions can now be defined in separate files using `codePath` parameter
- **`view_source` tool** - New built-in tool to view source code of registered functions with optional verbose mode
- **Comprehensive security validation** for file-based functions:
  - Path traversal protection
  - Symbolic link detection
  - System directory blocking
  - Dangerous code pattern detection (eval, exec, os.system, etc.)
  - File size limits (10MB)
  - Main function enforcement
- **Examples directory** with sample functions for all supported languages
- **Integration tests** - 50+ new tests for file-based functions and security
- **Documentation improvements**:
  - Added TESTING.md with unit testing guide
  - Added PROJECT-STRUCTURE.md documenting repository layout
  - Added migration guide for moving from inline to file-based functions
  - Added best practices guide

### Changed
- Enhanced type system to support both `code` (inline) and `codePath` (file-based) function definitions
- Updated storage layer to copy file-based functions to managed directory
- Improved error messages for better debugging
- Reorganized repository structure for better maintainability

### Fixed
- Resolved flaky timeout test in executor
- Fixed memory leak warnings in test suite
- Corrected test execution issues in ES module environment

### Security
- Implemented multi-layer security validation for file-based functions
- Added protection against malicious code patterns
- Blocked access to sensitive system directories

## [1.0.0] - 2024-07-26

### Added
- Initial release
- Dynamic tool registration at runtime
- Support for Python, JavaScript, TypeScript, Bash, and Ruby
- Inline function definitions with `code` parameter
- Automatic function validation
- Function persistence across restarts
- JSON Schema parameter validation
- Timeout protection
- Built-in tools: `add_tool`, `remove_tool`, `list_tools`

### Features
- MCP protocol integration
- Automatic syntax validation
- Error handling with detailed messages
- Support for async functions
- Configurable timeouts (max 5 minutes)

## Future Enhancements

### Planned
- Configurable entry points (custom function names instead of `main`)
- Multiple entry points per file
- File watching and hot-reload for development
- Dependency resolution for local imports
- Version tracking and rollback capabilities
- Streaming output for long-running functions
- Function composition and chaining

---

For more details on each release, see the [GitHub releases page](https://github.com/yourusername/diy-tools-mcp/releases).