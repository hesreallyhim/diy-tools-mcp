import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { FunctionExecutor } from '../../tools/executor.js';
import { FunctionStorage } from '../../storage/functions.js';
import { FunctionSpecification } from '../../types/index.js';
import { rmdir } from 'fs/promises';
import { join } from 'path';

describe('Configurable Entry Points', () => {
  let executor: FunctionExecutor;
  let storage: FunctionStorage;

  const FUNCTIONS_DIR = join(process.cwd(), 'functions');
  const FUNCTION_CODE_DIR = join(process.cwd(), 'function-code');

  beforeEach(() => {
    executor = new FunctionExecutor();
    storage = new FunctionStorage();
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await rmdir(FUNCTIONS_DIR, { recursive: true });
      await rmdir(FUNCTION_CODE_DIR, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Python Functions', () => {
    it('should execute function with custom entry point', async () => {
      const spec: FunctionSpecification = {
        name: 'custom_calc',
        description: 'Calculate with custom entry point',
        language: 'python',
        code: `
def calculate_sum(a, b):
    return a + b

def calculate_product(a, b):
    return a * b
`,
        entryPoint: 'calculate_sum',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { a: 5, b: 3 });

      expect(result.isError).toBeUndefined();
      expect(result.output).toBe(8);
    });

    it('should execute different entry points from same code', async () => {
      const code = `
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
`;

      // Test add function
      const addSpec: FunctionSpecification = {
        name: 'add_func',
        description: 'Add two numbers',
        language: 'python',
        code,
        entryPoint: 'add',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
        },
      };

      const addFunc = await storage.save(addSpec);
      const addResult = await executor.execute(addFunc, { a: 10, b: 5 });
      expect(addResult.isError).toBeUndefined();
      expect(addResult.output).toBe(15);

      // Test multiply function
      const multiplySpec: FunctionSpecification = {
        name: 'multiply_func',
        description: 'Multiply two numbers',
        language: 'python',
        code,
        entryPoint: 'multiply',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
        },
      };

      const multiplyFunc = await storage.save(multiplySpec);
      const multiplyResult = await executor.execute(multiplyFunc, { a: 10, b: 5 });
      expect(multiplyResult.isError).toBeUndefined();
      expect(multiplyResult.output).toBe(50);
    });

    it('should use main as default entry point when not specified', async () => {
      const spec: FunctionSpecification = {
        name: 'default_entry',
        description: 'Test default entry point',
        language: 'python',
        code: `
def main(value):
    return value * 2

def other_function(value):
    return value * 3
`,
        // No entryPoint specified - should default to 'main'
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { value: 21 });

      expect(result.isError).toBeUndefined();
      expect(result.output).toBe(42);
    });

    it('should fail when specified entry point does not exist', async () => {
      const spec: FunctionSpecification = {
        name: 'missing_entry',
        description: 'Test missing entry point',
        language: 'python',
        code: `
def calculate(value):
    return value * 2
`,
        entryPoint: 'nonexistent',
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { value: 10 });

      expect(result.isError).toBe(true);
      expect(result.error).toContain("Function 'nonexistent' not found");
    });
  });

  describe('JavaScript Functions', () => {
    it('should execute function with custom entry point', async () => {
      const spec: FunctionSpecification = {
        name: 'js_custom',
        description: 'JavaScript with custom entry point',
        language: 'javascript',
        code: `
function processData(args) {
    return { processed: args.input.toUpperCase() };
}

function validateData(args) {
    return { valid: args.input.length > 0 };
}
`,
        entryPoint: 'processData',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { input: 'hello' });

      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ processed: 'HELLO' });
    });

    it('should handle CommonJS exports with custom entry point', async () => {
      const spec: FunctionSpecification = {
        name: 'js_commonjs',
        description: 'CommonJS with custom entry point',
        language: 'javascript',
        code: `
module.exports.calculate = function(args) {
    return args.a + args.b;
};

module.exports.validate = function(args) {
    return args.a > 0 && args.b > 0;
};
`,
        entryPoint: 'calculate',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { a: 7, b: 3 });

      expect(result.isError).toBeUndefined();
      expect(result.output).toBe(10);
    });
  });

  describe('Bash Functions', () => {
    it('should execute bash function with custom entry point', async () => {
      const spec: FunctionSpecification = {
        name: 'bash_custom',
        description: 'Bash with custom entry point',
        language: 'bash',
        code: `
process_file() {
    local args="$1"
    echo '{"status": "processed"}'
}

validate_file() {
    local args="$1"
    echo '{"status": "validated"}'
}
`,
        entryPoint: 'process_file',
        parameters: {
          type: 'object',
          properties: {},
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, {});

      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ status: 'processed' });
    });
  });

  describe('Ruby Functions', () => {
    it('should execute ruby function with custom entry point', async () => {
      const spec: FunctionSpecification = {
        name: 'ruby_custom',
        description: 'Ruby with custom entry point',
        language: 'ruby',
        code: `
def calculate_tax(income:, rate:)
  income * rate
end

def calculate_net(income:, tax:)
  income - tax
end
`,
        entryPoint: 'calculate_tax',
        parameters: {
          type: 'object',
          properties: {
            income: { type: 'number' },
            rate: { type: 'number' },
          },
        },
      };

      const func = await storage.save(spec);
      const result = await executor.execute(func, { income: 1000, rate: 0.2 });

      expect(result.isError).toBeUndefined();
      expect(result.output).toBe(200);
    });
  });
});
