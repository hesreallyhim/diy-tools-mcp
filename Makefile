# DIY Tools MCP Server - Makefile
# Standard commands for development and operations

# Variables
NODE := node
NPM := npm
TSX := npx tsx
DIST_DIR := dist
SRC_DIR := src
TEST_DIR := src/__tests__
COVERAGE_DIR := coverage
FUNCTIONS_DIR := functions
FUNCTION_CODE_DIR := function-code

# Color output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Default target - show help
.DEFAULT_GOAL := help

# Phony targets (not files)
.PHONY: help install build dev start test test-watch test-coverage clean lint typecheck format check serve demo version publish setup

## Help command
help: ## Show this help message
	@echo "$(GREEN)DIY Tools MCP Server - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make setup      # First time setup"
	@echo "  make dev        # Start development server"
	@echo "  make test       # Run tests"
	@echo ""

## Installation and Setup
setup: clean install build ## Complete setup from scratch
	@echo "$(GREEN)✓ Setup complete! Run 'make dev' to start development server$(NC)"

install: ## Install dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	$(NPM) install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

ci-install: ## Install dependencies for CI (uses npm ci)
	@echo "$(GREEN)Installing dependencies for CI...$(NC)"
	$(NPM) ci
	@echo "$(GREEN)✓ CI dependencies installed$(NC)"

## Build commands
build: clean-dist ## Build the project
	@echo "$(GREEN)Building project...$(NC)"
	$(NPM) run build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-watch: ## Build and watch for changes
	@echo "$(GREEN)Building in watch mode...$(NC)"
	npx tsc --watch

## Development
dev: ## Start development server with auto-reload
	@echo "$(GREEN)Starting development server...$(NC)"
	$(NPM) run dev

start: build ## Build and start production server
	@echo "$(GREEN)Starting production server...$(NC)"
	$(NPM) start

serve: start ## Alias for start

demo: ## Run the demo script
	@echo "$(GREEN)Running demo...$(NC)"
	$(TSX) demo.ts

## Testing
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test

test-watch: ## Run tests in watch mode
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test -- --watch

test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test -- --coverage
	@echo "$(GREEN)✓ Coverage report generated in $(COVERAGE_DIR)/$(NC)"

test-unit: ## Run only unit tests
	@echo "$(GREEN)Running unit tests...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test -- --testPathIgnorePatterns=integration

test-integration: ## Run only integration tests
	@echo "$(GREEN)Running integration tests...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test -- --testPathPattern=integration

test-verbose: ## Run tests with verbose output
	@echo "$(GREEN)Running tests (verbose)...$(NC)"
	NODE_OPTIONS="--experimental-vm-modules" $(NPM) test -- --verbose

## Code Quality
lint: ## Run ESLint (when configured)
	@echo "$(YELLOW)Note: ESLint not currently configured$(NC)"
	@echo "To add linting, install eslint and create .eslintrc"
	# $(NPM) run lint

typecheck: ## Run TypeScript type checking
	@echo "$(GREEN)Running type check...$(NC)"
	npx tsc --noEmit
	@echo "$(GREEN)✓ Type check passed$(NC)"

format: ## Format code with Prettier (when configured)
	@echo "$(YELLOW)Note: Prettier not currently configured$(NC)"
	@echo "To add formatting, install prettier and create .prettierrc"
	# $(NPM) run format

check: typecheck test ## Run all checks (typecheck + tests)
	@echo "$(GREEN)✓ All checks passed$(NC)"

## Cleaning
clean: clean-dist clean-test clean-functions ## Clean all generated files
	@echo "$(GREEN)✓ All cleaned$(NC)"

clean-dist: ## Clean build output
	@echo "$(YELLOW)Cleaning build output...$(NC)"
	rm -rf $(DIST_DIR)
	rm -f tsconfig.tsbuildinfo
	@echo "$(GREEN)✓ Build output cleaned$(NC)"

clean-test: ## Clean test artifacts
	@echo "$(YELLOW)Cleaning test artifacts...$(NC)"
	rm -rf $(COVERAGE_DIR)
	rm -rf test-*-functions/
	rm -rf test-*-integration/
	rm -rf .nyc_output
	@echo "$(GREEN)✓ Test artifacts cleaned$(NC)"

clean-functions: ## Clean generated function files
	@echo "$(YELLOW)Cleaning function files...$(NC)"
	rm -rf $(FUNCTIONS_DIR)
	rm -rf $(FUNCTION_CODE_DIR)
	@echo "$(GREEN)✓ Function files cleaned$(NC)"

clean-deps: ## Clean node_modules
	@echo "$(RED)Removing node_modules...$(NC)"
	rm -rf node_modules
	rm -f package-lock.json
	@echo "$(GREEN)✓ Dependencies cleaned$(NC)"

clean-all: clean clean-deps ## Clean everything including dependencies
	@echo "$(GREEN)✓ Everything cleaned$(NC)"

## Utilities
version: ## Show version information
	@echo "$(GREEN)DIY Tools MCP Server$(NC)"
	@echo -n "Version: "
	@$(NODE) -p "require('./package.json').version"
	@echo -n "Node: "
	@$(NODE) --version
	@echo -n "NPM: "
	@$(NPM) --version
	@echo -n "TypeScript: "
	@npx tsc --version

deps-check: ## Check for outdated dependencies
	@echo "$(GREEN)Checking for outdated dependencies...$(NC)"
	$(NPM) outdated || true

deps-update: ## Update dependencies to latest versions
	@echo "$(YELLOW)Updating dependencies...$(NC)"
	$(NPM) update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

## Publishing
pre-publish: clean-all setup test build ## Prepare for publishing
	@echo "$(GREEN)✓ Ready for publishing$(NC)"

publish-dry: pre-publish ## Dry run of npm publish
	@echo "$(YELLOW)Dry run of npm publish...$(NC)"
	$(NPM) publish --dry-run

publish: ## Publish to npm registry
	@echo "$(RED)Publishing to npm registry...$(NC)"
	@echo "$(YELLOW)Make sure you are logged in: npm login$(NC)"
	$(NPM) publish

## Docker (future use)
docker-build: ## Build Docker image (placeholder)
	@echo "$(YELLOW)Docker support not yet implemented$(NC)"
	# docker build -t diy-tools-mcp .

docker-run: ## Run Docker container (placeholder)
	@echo "$(YELLOW)Docker support not yet implemented$(NC)"
	# docker run -it --rm diy-tools-mcp

## Development utilities
watch-logs: ## Watch server logs (when running)
	@echo "$(GREEN)Watching logs...$(NC)"
	@echo "$(YELLOW)Note: Start the server first with 'make dev'$(NC)"
	tail -f logs/*.log 2>/dev/null || echo "No log files found"

create-function: ## Interactive function creation helper
	@echo "$(GREEN)Function Creation Helper$(NC)"
	@echo "Use the add_tool command when the server is running"
	@echo "Example: see README.md for add_tool examples"

validate-config: ## Validate claude_desktop_config.json
	@echo "$(GREEN)Validating MCP configuration...$(NC)"
	@$(NODE) -e "try { require('./claude_desktop_config.json'); console.log('✓ Config is valid JSON'); } catch(e) { console.error('✗ Invalid JSON:', e.message); process.exit(1); }"

## Monitoring
status: ## Check if server is running
	@echo "$(GREEN)Checking server status...$(NC)"
	@ps aux | grep -v grep | grep "diy-tools-mcp" > /dev/null && echo "$(GREEN)✓ Server is running$(NC)" || echo "$(YELLOW)✗ Server is not running$(NC)"

logs: ## Show recent logs
	@echo "$(GREEN)Recent activity:$(NC)"
	@ls -la $(FUNCTIONS_DIR) 2>/dev/null | tail -5 || echo "No functions registered yet"
	@echo ""
	@echo "$(GREEN)Registered functions:$(NC)"
	@ls $(FUNCTIONS_DIR)/*.json 2>/dev/null | xargs -I {} basename {} .json || echo "None"

## Environment
env-check: ## Check environment requirements
	@echo "$(GREEN)Checking environment...$(NC)"
	@command -v node >/dev/null 2>&1 && echo "✓ Node.js: $$(node --version)" || echo "✗ Node.js not found"
	@command -v npm >/dev/null 2>&1 && echo "✓ NPM: $$(npm --version)" || echo "✗ NPM not found"
	@command -v python3 >/dev/null 2>&1 && echo "✓ Python: $$(python3 --version)" || echo "✗ Python not found"
	@command -v bash >/dev/null 2>&1 && echo "✓ Bash: $$(bash --version | head -1)" || echo "✗ Bash not found"
	@test -f package.json && echo "✓ package.json found" || echo "✗ package.json not found"
	@test -f tsconfig.json && echo "✓ tsconfig.json found" || echo "✗ tsconfig.json not found"

# Special targets
.SILENT: help version status logs env-check