import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { ToolManager } from '../tools/manager.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FunctionSpecification } from '../types/index.js';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';

describe('ToolManager', () => {
  let manager: ToolManager;
  let mockServer: Server;
  const testDir = join(process.cwd(), 'test-manager-functions');
  const pythonFile = join(testDir, 'test.py');
  const jsFile = join(testDir, 'test.js');
  const largeFile = join(testDir, 'large.py');

  beforeAll(async () => {
    // Create test directory and files
    await mkdir(testDir, { recursive: true });
    
    // Valid Python file with proper main function
    await writeFile(pythonFile, `
import json
import sys

def main():
    return {"status": "ok"}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = main(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`);

    // Valid JS file
    await writeFile(jsFile, `
function main(args) {
  return { status: "ok" };
}
module.exports = { main };
`);

    // Large file (simulate > 10MB)
    // We can't actually create a 10MB file in tests, so we'll mock this
    await writeFile(largeFile, 'def main(): pass');
  });

  afterAll(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
    await rm(join(process.cwd(), 'functions'), { recursive: true, force: true });
    await rm(join(process.cwd(), 'function-code'), { recursive: true, force: true });
  });

  beforeEach(async () => {
    mockServer = {
      notification: jest.fn()
    } as unknown as Server;
    
    manager = new ToolManager(mockServer);
    await manager.initialize();
  });

  describe('addTool', () => {
    describe('validation', () => {
      it('should reject tool with both code and codePath', async () => {
        const spec: FunctionSpecification = {
          name: 'invalid_both',
          description: 'Invalid tool',
          language: 'python',
          code: 'def main(): pass',
          codePath: pythonFile,
          parameters: { type: 'object', properties: {} }
        };

        await expect(manager.addTool(spec)).rejects.toThrow(
          'Cannot specify both code and codePath'
        );
      });

      it('should reject tool with neither code nor codePath', async () => {
        const spec: FunctionSpecification = {
          name: 'invalid_neither',
          description: 'Invalid tool',
          language: 'python',
          parameters: { type: 'object', properties: {} }
        };

        await expect(manager.addTool(spec)).rejects.toThrow(
          'Must specify either code or codePath'
        );
      });

      it('should reject non-existent file', async () => {
        const spec: FunctionSpecification = {
          name: 'non_existent',
          description: 'Non-existent file',
          language: 'python',
          codePath: './does_not_exist.py',
          parameters: { type: 'object', properties: {} }
        };

        await expect(manager.addTool(spec)).rejects.toThrow(
          'Cannot read file'
        );
      });

      it('should reject file with wrong extension', async () => {
        const spec: FunctionSpecification = {
          name: 'wrong_ext',
          description: 'Wrong extension',
          language: 'python',
          codePath: jsFile, // JS file for Python language
          parameters: { type: 'object', properties: {} }
        };

        await expect(manager.addTool(spec)).rejects.toThrow(
          "Invalid file extension"
        );
      });

      it('should reject duplicate tool names', async () => {
        const spec1: FunctionSpecification = {
          name: 'duplicate_name',
          description: 'First tool',
          language: 'python',
          code: 'def main(): pass',
          parameters: { type: 'object', properties: {} }
        };

        const spec2: FunctionSpecification = {
          name: 'duplicate_name',
          description: 'Second tool',
          language: 'python',
          code: 'def main(): return "different"',
          parameters: { type: 'object', properties: {} }
        };

        await manager.addTool(spec1);
        await expect(manager.addTool(spec2)).rejects.toThrow(
          'already exists'
        );
      });
    });

    describe('successful registration', () => {
      it('should add inline function', async () => {
        const spec: FunctionSpecification = {
          name: 'inline_tool',
          description: 'Inline tool',
          language: 'python',
          code: 'def main(x): return x * 2',
          parameters: {
            type: 'object',
            properties: {
              x: { type: 'number' }
            },
            required: ['x']
          }
        };

        const result = await manager.addTool(spec);
        
        expect(result.name).toBe('inline_tool');
        expect(result.code).toBe(spec.code);
        expect(result.codePath).toBeUndefined();
        expect(result.id).toBeDefined();
      });

      it('should add file-based function', async () => {
        const spec: FunctionSpecification = {
          name: 'file_tool',
          description: 'File-based tool',
          language: 'python',
          codePath: pythonFile,
          parameters: { type: 'object', properties: {} }
        };

        const result = await manager.addTool(spec);
        
        expect(result.name).toBe('file_tool');
        expect(result.code).toBeUndefined();
        expect(result.codePath).toContain('function-code');
        expect(result.id).toBeDefined();
      });

      it('should notify clients on tool addition', async () => {
        const spec: FunctionSpecification = {
          name: 'notify_test',
          description: 'Test notification',
          language: 'python',
          code: 'def main(): pass',
          parameters: { type: 'object', properties: {} }
        };

        await manager.addTool(spec);
        
        expect(mockServer.notification).toHaveBeenCalledWith({
          method: 'tools/listChanged'
        });
      });
    });
  });

  describe('getTools', () => {
    it('should include add_tool with correct schema', () => {
      const tools = manager.getTools();
      const addTool = tools.find(t => t.name === 'add_tool');
      
      expect(addTool).toBeDefined();
      expect(addTool?.inputSchema).toHaveProperty('properties.code');
      expect(addTool?.inputSchema).toHaveProperty('properties.codePath');
      expect(addTool?.inputSchema).toHaveProperty('oneOf');
      
      const schema = addTool!.inputSchema;
      expect(schema.oneOf).toEqual([
        { required: ['code'] },
        { required: ['codePath'] }
      ]);
    });

    it('should include registered custom tools', async () => {
      const spec: FunctionSpecification = {
        name: 'custom_tool',
        description: 'Custom tool',
        language: 'python',
        code: 'def main(): return "custom"',
        parameters: { type: 'object', properties: {} }
      };

      await manager.addTool(spec);
      
      const tools = manager.getTools();
      const customTool = tools.find(t => t.name === 'custom_tool');
      
      expect(customTool).toBeDefined();
      expect(customTool?.description).toBe('Custom tool');
    });
  });

  describe('executeTool', () => {
    it('should execute registered inline tool', async () => {
      const spec: FunctionSpecification = {
        name: 'exec_inline',
        description: 'Execute inline',
        language: 'python',
        code: `
def main(x):
    return {"doubled": x * 2}
`,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' }
          },
          required: ['x']
        }
      };

      await manager.addTool(spec);
      const result = await manager.executeTool('exec_inline', { x: 5 });
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ doubled: 10 });
    });

    // Skipped: Python execution fails in test environment due to ES module issues
    // The file-based functionality works correctly in production
    it('should execute registered file-based tool', async () => {
      const spec: FunctionSpecification = {
        name: 'exec_file',
        description: 'Execute file',
        language: 'python',
        codePath: pythonFile,
        parameters: { type: 'object', properties: {} }
      };

      await manager.addTool(spec);
      const result = await manager.executeTool('exec_file', {});
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ status: 'ok' });
    });

    it('should return error for non-existent tool', async () => {
      const result = await manager.executeTool('does_not_exist', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('removeTool', () => {
    it('should remove tool and clean up files', async () => {
      const spec: FunctionSpecification = {
        name: 'remove_test',
        description: 'Tool to remove',
        language: 'python',
        codePath: pythonFile,
        parameters: { type: 'object', properties: {} }
      };

      await manager.addTool(spec);
      const removed = await manager.removeTool('remove_test');
      
      expect(removed).toBe(true);
      
      // Verify tool is gone
      const result = await manager.executeTool('remove_test', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return false for non-existent tool', async () => {
      const removed = await manager.removeTool('does_not_exist');
      expect(removed).toBe(false);
    });
  });

  describe('view_source', () => {
    it('should be included in getTools', () => {
      const tools = manager.getTools();
      const viewSourceTool = tools.find(t => t.name === 'view_source');
      
      expect(viewSourceTool).toBeDefined();
      expect(viewSourceTool?.description).toContain('View the source code');
      expect(viewSourceTool?.inputSchema.properties).toHaveProperty('name');
      expect(viewSourceTool?.inputSchema.properties).toHaveProperty('verbose');
      expect(viewSourceTool?.inputSchema.required).toEqual(['name']);
    });

    it('should view inline function source (non-verbose)', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_view_test',
        description: 'Test viewing inline source',
        language: 'python',
        code: 'def main(x):\n    return x * 2',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' }
          },
          required: ['x']
        }
      };

      await manager.addTool(spec);
      const result = await manager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'inline_view_test' }
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.name).toBe('inline_view_test');
      expect(result.language).toBe('python');
      expect(result.sourceCode).toBe('def main(x):\n    return x * 2');
      expect(result.tool).toBeUndefined(); // Non-verbose shouldn't have full tool object
    });

    it('should view inline function source (verbose)', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_verbose_test',
        description: 'Test viewing inline source with verbose',
        language: 'javascript',
        code: 'function main(x) { return x + 1; }',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' }
          },
          required: ['x']
        },
        returns: 'The incremented value',
        dependencies: ['lodash'],
        timeout: 3000
      };

      await manager.addTool(spec);
      const result = await manager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'inline_verbose_test', verbose: true }
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.tool).toBeDefined();
      expect(result.tool.name).toBe('inline_verbose_test');
      expect(result.tool.description).toBe('Test viewing inline source with verbose');
      expect(result.tool.language).toBe('javascript');
      expect(result.tool.parameters).toEqual(spec.parameters);
      expect(result.tool.returns).toBe('The incremented value');
      expect(result.tool.dependencies).toEqual(['lodash']);
      expect(result.tool.timeout).toBe(3000);
      expect(result.tool.isFileBased).toBe(false);
      expect(result.tool.sourceCode).toBe('function main(x) { return x + 1; }');
      expect(result.tool.createdAt).toBeDefined();
      expect(result.tool.updatedAt).toBeDefined();
    });

    it('should view file-based function source', async () => {
      const spec: FunctionSpecification = {
        name: 'file_view_test',
        description: 'Test viewing file-based source',
        language: 'python',
        codePath: pythonFile,
        parameters: { type: 'object', properties: {} }
      };

      await manager.addTool(spec);
      const result = await manager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'file_view_test' }
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.name).toBe('file_view_test');
      expect(result.language).toBe('python');
      expect(result.sourceCode).toContain('def main()');
      expect(result.sourceCode).toContain('return {"status": "ok"}');
    });

    it('should view file-based function source (verbose)', async () => {
      const spec: FunctionSpecification = {
        name: 'file_verbose_test',
        description: 'Test viewing file source with verbose',
        language: 'javascript',
        codePath: jsFile,
        parameters: { type: 'object', properties: {} }
      };

      await manager.addTool(spec);
      const result = await manager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'file_verbose_test', verbose: true }
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.tool).toBeDefined();
      expect(result.tool.isFileBased).toBe(true);
      expect(result.tool.codePath).toContain('function-code');
      expect(result.tool.sourceCode).toContain('function main(args)');
    });

    it('should return error for non-existent tool', async () => {
      const result = await manager.handleToolCall({
        params: {
          name: 'view_source',
          arguments: { name: 'does_not_exist' }
        }
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool "does_not_exist" not found');
    });
  });
});