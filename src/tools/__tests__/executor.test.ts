import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FunctionExecutor } from '../executor.js';
import { FunctionStorage } from '../../storage/functions.js';
import { FunctionSpecification } from '../../types/index.js';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';

describe('FunctionExecutor', () => {
  let executor: FunctionExecutor;
  let storage: FunctionStorage;
  const testDir = join(process.cwd(), 'test-executor-functions');
  const pythonFile = join(testDir, 'add.py');
  const jsFile = join(testDir, 'multiply.js');

  beforeAll(async () => {
    // Create test directory and files
    await mkdir(testDir, { recursive: true });

    // Python test file
    await writeFile(
      pythonFile,
      `
import json
import sys

def main(a, b):
    return {"sum": a + b, "product": a * b}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = main(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`
    );

    // JavaScript test file
    await writeFile(
      jsFile,
      `
function main(args) {
  const { x, y } = args;
  return {
    result: x * y,
    squared: x * x
  };
}

module.exports = { main };
`
    );
  });

  afterAll(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
    await rm(join(process.cwd(), 'functions'), { recursive: true, force: true });
    await rm(join(process.cwd(), 'function-code'), { recursive: true, force: true });
  });

  beforeEach(() => {
    executor = new FunctionExecutor();
    storage = new FunctionStorage();
  });

  describe('execute', () => {
    it('should execute inline Python function', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_python_exec',
        description: 'Test inline Python execution',
        language: 'python',
        code: `
def main(name, greeting="Hello"):
    return {"message": f"{greeting}, {name}!"}
`,
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            greeting: { type: 'string' },
          },
          required: ['name'],
        },
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, { name: 'World' });

      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ message: 'Hello, World!' });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute file-based Python function', async () => {
      const spec: FunctionSpecification = {
        name: 'file_python_exec',
        description: 'Test file-based Python execution',
        language: 'python',
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, { a: 5, b: 3 });

      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ sum: 8, product: 15 });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute inline JavaScript function', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_js_exec',
        description: 'Test inline JS execution',
        language: 'javascript',
        code: `
function main(args) {
  return { reversed: args.text.split('').reverse().join('') };
}
`,
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, { text: 'hello' });

      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ reversed: 'olleh' });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle execution errors gracefully', async () => {
      const spec: FunctionSpecification = {
        name: 'error_function',
        description: 'Function that errors',
        language: 'python',
        code: `
def main():
    raise ValueError("Test error")
`,
        parameters: { type: 'object', properties: {} },
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, {});

      expect(result.isError).toBe(true);
      expect(result.error).toContain('Test error');
    });

    it('should respect timeout settings', async () => {
      const spec: FunctionSpecification = {
        name: 'timeout_function',
        description: 'Function that times out',
        language: 'python',
        code: `
import time
def main():
    time.sleep(2)
    return "Should not reach"
`,
        parameters: { type: 'object', properties: {} },
        timeout: 500, // 500ms timeout
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, {});

      expect(result.isError).toBe(true);
      expect(result.error).toContain('timed out');
      // Allow 1ms tolerance for timing precision
      expect(result.executionTime).toBeGreaterThanOrEqual(499);
      expect(result.executionTime).toBeLessThan(2000);
    });

    it('should validate arguments against schema', async () => {
      const spec: FunctionSpecification = {
        name: 'schema_validation',
        description: 'Test schema validation',
        language: 'python',
        code: `def main(x): return x`,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
          },
          required: ['x'],
        },
      };

      const stored = await storage.save(spec);

      // Missing required parameter
      const result1 = await executor.execute(stored, {});
      expect(result1.isError).toBe(true);
      expect(result1.error).toContain('required');

      // Wrong type
      const result2 = await executor.execute(stored, { x: 'not a number' });
      expect(result2.isError).toBe(true);
      expect(result2.error).toContain('must be number');
    });
  });

  describe('executeWithTimeout', () => {
    // Skipped: Python file execution fails in test environment
    // The optimized execution path works correctly in production
    it('should use optimized file execution when available', async () => {
      const spec: FunctionSpecification = {
        name: 'optimized_exec',
        description: 'Test optimized execution',
        language: 'python',
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      };

      const stored = await storage.save(spec);
      const result = await executor.execute(stored, { a: 10, b: 20 });

      // The optimized path should still produce correct results
      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ sum: 30, product: 200 });
    });
  });
});
