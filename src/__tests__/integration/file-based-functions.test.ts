import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { ToolManager } from '../../tools/manager.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { writeFile, mkdir, rm, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { FunctionSpecification } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { tmpdir } from 'os';

describe('File-Based Functions Integration', () => {
  let toolManager: ToolManager;
  let mockServer: Server;
  let originalCwd: string;
  let tempDir: string;
  let testDir: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    tempDir = await mkdtemp(join(tmpdir(), 'diy-tools-integration-'));
    process.chdir(tempDir);
    testDir = join(process.cwd(), 'test-integration-functions');
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directories - use try-catch to avoid failures if already deleted
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore if already deleted
    }
    try {
      await rm(join(process.cwd(), 'functions'), { recursive: true, force: true });
    } catch {
      // Ignore if already deleted
    }
    try {
      await rm(join(process.cwd(), 'function-code'), { recursive: true, force: true });
    } catch {
      // Ignore if already deleted
    }
    process.chdir(originalCwd);
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures
    }
  });

  beforeEach(async () => {
    mockServer = {
      notification: jest.fn(),
    } as unknown as Server;

    toolManager = new ToolManager(mockServer);
    await toolManager.initialize();
  });

  describe('Adding file-based functions', () => {
    it('should add Python function from file', async () => {
      // Create test Python file
      const pythonFile = join(testDir, 'test_func.py');
      await writeFile(
        pythonFile,
        `
def main(x, y):
    """Add two numbers"""
    return x + y
      `
      );

      const spec: FunctionSpecification = {
        name: 'test_add',
        description: 'Test addition',
        language: 'python',
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: ['x', 'y'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_add');
      expect(result.codePath).toBeDefined();
      expect(result.codePath).toContain('function-code');
      expect(result.code).toBeUndefined();
    });

    it('should add JavaScript function from file', async () => {
      const jsFile = join(testDir, 'test_func.js');
      await writeFile(
        jsFile,
        `
function main({ message }) {
  return { echo: message, timestamp: Date.now() };
}
module.exports = { main };
      `
      );

      const spec: FunctionSpecification = {
        name: 'test_echo',
        description: 'Test echo',
        language: 'javascript',
        codePath: jsFile,
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_echo');
      expect(result.codePath).toBeDefined();
    });

    it('should add TypeScript function from file', async () => {
      const tsFile = join(testDir, 'test_func.ts');
      await writeFile(
        tsFile,
        `
export function main({ value }: { value: number }): { doubled: number } {
  return { doubled: value * 2 };
}
      `
      );

      const spec: FunctionSpecification = {
        name: 'test_double',
        description: 'Test doubling',
        language: 'typescript',
        codePath: tsFile,
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
          required: ['value'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_double');
      expect(result.codePath).toBeDefined();
    });

    it('should add Bash function from file', async () => {
      const bashFile = join(testDir, 'test_func.sh');
      await writeFile(
        bashFile,
        `
#!/bin/bash
main() {
  echo '{"hostname": "'$(hostname)'", "user": "'$(whoami)'"}'
}
      `
      );

      const spec: FunctionSpecification = {
        name: 'test_info',
        description: 'Test system info',
        language: 'bash',
        codePath: bashFile,
        parameters: {
          type: 'object',
          properties: {},
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_info');
      expect(result.codePath).toBeDefined();
    });

    it('should add Ruby function from file', async () => {
      const rubyFile = join(testDir, 'test_func.rb');
      await writeFile(
        rubyFile,
        `
def main(name:, greeting: "Hello")
  { message: "#{greeting}, #{name}!" }
end
      `
      );

      const spec: FunctionSpecification = {
        name: 'test_greet',
        description: 'Test greeting',
        language: 'ruby',
        codePath: rubyFile,
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            greeting: { type: 'string' },
          },
          required: ['name'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_greet');
      expect(result.codePath).toBeDefined();
    });
  });

  describe('Executing file-based functions', () => {
    it('should execute Python function from file', async () => {
      const pythonFile = join(testDir, 'exec_test.py');
      await writeFile(
        pythonFile,
        `
def main(a, b):
    return {"sum": a + b, "product": a * b}
      `
      );

      await toolManager.addTool({
        name: 'math_ops',
        description: 'Math operations',
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
      });

      const result = await toolManager.executeTool('math_ops', { a: 5, b: 3 });
      if (result.isError) {
        console.error('Python execution failed:', result.error);
      }
      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({ sum: 8, product: 15 });
    });

    it('should execute JavaScript function from file', async () => {
      const jsFile = join(testDir, 'exec_js.js');
      await writeFile(
        jsFile,
        `
function main({ text }) {
  return { 
    uppercase: text.toUpperCase(),
    length: text.length,
    reversed: text.split('').reverse().join('')
  };
}
module.exports = { main };
      `
      );

      await toolManager.addTool({
        name: 'text_ops',
        description: 'Text operations',
        language: 'javascript',
        codePath: jsFile,
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      });

      const result = await toolManager.executeTool('text_ops', { text: 'hello' });
      if (result.isError) {
        console.error('JavaScript execution failed:', result.error);
      }
      expect(result.isError).toBeUndefined();
      expect(result.output).toEqual({
        uppercase: 'HELLO',
        length: 5,
        reversed: 'olleh',
      });
    });
  });

  describe('View source functionality', () => {
    it('should view source of file-based function', async () => {
      const jsFile = join(testDir, 'view_test.js');
      const sourceCode = `function main({ x }) { return x * 2; }
module.exports = { main };`;
      await writeFile(jsFile, sourceCode);

      await toolManager.addTool({
        name: 'doubler',
        description: 'Doubles input',
        language: 'javascript',
        codePath: jsFile,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
          },
          required: ['x'],
        },
      });

      const response = await toolManager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'doubler' },
        },
      });

      const result = JSON.parse(response.content[0].text);
      expect(result.isError).toBeUndefined();
      expect(result.sourceCode).toBe(sourceCode);
      expect(result.language).toBe('javascript');
    });

    it('should view source with verbose mode', async () => {
      const pythonFile = join(testDir, 'verbose_test.py');
      const sourceCode = `def main(n):
    """Calculate factorial"""
    if n <= 1:
        return 1
    return n * main(n - 1)`;

      await writeFile(pythonFile, sourceCode);

      await toolManager.addTool({
        name: 'factorial',
        description: 'Calculate factorial',
        language: 'python',
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            n: { type: 'integer', minimum: 0 },
          },
          required: ['n'],
        },
        returns: 'The factorial of n',
        timeout: 5000,
      });

      const response = await toolManager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'factorial', verbose: true },
        },
      });

      const result = JSON.parse(response.content[0].text);
      expect(result.isError).toBeUndefined();
      expect(result.tool).toBeDefined();
      expect(result.tool.name).toBe('factorial');
      expect(result.tool.description).toBe('Calculate factorial');
      expect(result.tool.isFileBased).toBe(true);
      expect(result.tool.codePath).toBeDefined();
      expect(result.tool.parameters).toBeDefined();
      expect(result.tool.returns).toBe('The factorial of n');
      expect(result.tool.timeout).toBe(5000);
      expect(result.tool.sourceCode).toBe(sourceCode);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(
        toolManager.handleToolCall({
          params: {
            name: 'view_source',
            arguments: { name: 'non_existent' },
          },
        })
      ).rejects.toThrow('Tool "non_existent" not found');
    });
  });

  describe('Error handling', () => {
    it('should reject both code and codePath', async () => {
      await expect(
        toolManager.addTool({
          name: 'invalid',
          description: 'Invalid',
          language: 'python',
          code: 'def main(): pass',
          codePath: './file.py',
          parameters: { type: 'object', properties: {} },
        })
      ).rejects.toThrow('Cannot specify both code and codePath');
    });

    it('should reject neither code nor codePath', async () => {
      await expect(
        toolManager.addTool({
          name: 'invalid',
          description: 'Invalid',
          language: 'python',
          parameters: { type: 'object', properties: {} },
        } as FunctionSpecification)
      ).rejects.toThrow('Must specify either code or codePath');
    });

    it('should reject non-existent file', async () => {
      await expect(
        toolManager.addTool({
          name: 'invalid',
          description: 'Invalid',
          language: 'python',
          codePath: './non-existent-file-that-does-not-exist.py',
          parameters: { type: 'object', properties: {} },
        })
      ).rejects.toThrow('Cannot read file');
    });

    it('should reject wrong file extension', async () => {
      const wrongFile = join(testDir, 'wrong.txt');
      await writeFile(wrongFile, 'def main(): pass');

      await expect(
        toolManager.addTool({
          name: 'invalid',
          description: 'Invalid',
          language: 'python',
          codePath: wrongFile,
          parameters: { type: 'object', properties: {} },
        })
      ).rejects.toThrow('Invalid file extension');
    });

    it('should reject file without main function', async () => {
      const noMainFile = join(testDir, 'no_main.py');
      await writeFile(
        noMainFile,
        `
def helper():
    return "no main here"
      `
      );

      await expect(
        toolManager.addTool({
          name: 'invalid',
          description: 'Invalid',
          language: 'python',
          codePath: noMainFile,
          parameters: { type: 'object', properties: {} },
        })
      ).rejects.toThrow('must define a main function');
    });
  });

  describe('Backward compatibility', () => {
    it('should still support inline functions', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_func',
        description: 'Inline function',
        language: 'python',
        code: 'def main(x): return x * 2',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
          },
          required: ['x'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.code).toBeDefined();
      expect(result.codePath).toBeUndefined();

      const execResult = await toolManager.executeTool('inline_func', { x: 5 });
      expect(execResult.isError).toBeUndefined();
      expect(execResult.output).toBe(10);
    });

    it('should allow mixing inline and file-based functions', async () => {
      // Add inline function
      await toolManager.addTool({
        name: 'inline_add',
        description: 'Inline addition',
        language: 'python',
        code: 'def main(a, b): return a + b',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      });

      // Add file-based function
      const fileFunc = join(testDir, 'file_multiply.py');
      await writeFile(fileFunc, 'def main(a, b): return a * b');

      await toolManager.addTool({
        name: 'file_multiply',
        description: 'File-based multiplication',
        language: 'python',
        codePath: fileFunc,
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      });

      // Test both work
      const inlineResult = await toolManager.executeTool('inline_add', { a: 3, b: 4 });
      expect(inlineResult.output).toBe(7);
      logger.info('IR:', inlineResult);
      const fileResult = await toolManager.executeTool('file_multiply', { a: 3, b: 4 });
      logger.info('FR:', fileResult);
      if (fileResult.isError) {
        console.error('File multiply execution failed:', fileResult.error);
      }
      expect(fileResult.output).toBe(12);
    });
  });

  describe('Language-specific features', () => {
    it('should support .mjs extension for JavaScript', async () => {
      const mjsFile = join(testDir, 'module.mjs');
      await writeFile(
        mjsFile,
        `
function main({ value }) {
  return { result: value + 1 };
}
export { main };
      `
      );

      const spec: FunctionSpecification = {
        name: 'mjs_func',
        description: 'ES module function',
        language: 'javascript',
        codePath: mjsFile,
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
          required: ['value'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('mjs_func');
      expect(result.codePath).toContain('.mjs');
    });

    it('should support .cjs extension for JavaScript', async () => {
      const cjsFile = join(testDir, 'common.cjs');
      await writeFile(
        cjsFile,
        `
function main({ value }) {
  return { result: value - 1 };
}
module.exports = { main };
      `
      );

      const spec: FunctionSpecification = {
        name: 'cjs_func',
        description: 'CommonJS function',
        language: 'javascript',
        codePath: cjsFile,
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
          required: ['value'],
        },
      };

      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('cjs_func');
      expect(result.codePath).toContain('.cjs');
    });
  });
});
