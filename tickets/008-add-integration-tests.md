# Ticket 008: Add Integration Tests

## Overview
Create comprehensive integration tests for the file-based function feature to ensure everything works together correctly.

## Requirements
1. Test both inline and file-based functions
2. Test migration from inline to file-based
3. Test error scenarios
4. Test all supported languages
5. Test the view_source tool

## Test Structure

### Create tests/integration/file-based-functions.test.ts

```typescript
import { DIYToolsServer } from '../../src/server';
import { ToolManager } from '../../src/tools/manager';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('File-Based Functions Integration', () => {
  let server: DIYToolsServer;
  let toolManager: ToolManager;
  const testDir = join(process.cwd(), 'test-functions');
  
  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });
  
  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });
  
  beforeEach(() => {
    server = new DIYToolsServer();
    toolManager = new ToolManager(server);
  });
  
  describe('Adding file-based functions', () => {
    test('should add Python function from file', async () => {
      // Create test Python file
      const pythonFile = join(testDir, 'test_func.py');
      await writeFile(pythonFile, `
def main(x, y):
    return x + y
      `);
      
      const spec = {
        name: 'test_add',
        description: 'Test addition',
        language: 'python' as const,
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          },
          required: ['x', 'y']
        }
      };
      
      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_add');
      expect(result.codePath).toBeDefined();
      expect(result.code).toBeUndefined();
    });
    
    test('should add JavaScript function from file', async () => {
      const jsFile = join(testDir, 'test_func.js');
      await writeFile(jsFile, `
function main({ message }) {
  return { echo: message, timestamp: Date.now() };
}
      `);
      
      const spec = {
        name: 'test_echo',
        description: 'Test echo',
        language: 'javascript' as const,
        codePath: jsFile,
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          required: ['message']
        }
      };
      
      const result = await toolManager.addTool(spec);
      expect(result.name).toBe('test_echo');
    });
  });
  
  describe('Executing file-based functions', () => {
    test('should execute Python function from file', async () => {
      const pythonFile = join(testDir, 'exec_test.py');
      await writeFile(pythonFile, `
def main(a, b):
    return {"sum": a + b, "product": a * b}
      `);
      
      await toolManager.addTool({
        name: 'math_ops',
        description: 'Math operations',
        language: 'python' as const,
        codePath: pythonFile,
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
          }
        }
      });
      
      const result = await toolManager.executeTool('math_ops', { a: 5, b: 3 });
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ sum: 8, product: 15 });
    });
  });
  
  describe('View source functionality', () => {
    test('should view source of file-based function', async () => {
      const jsFile = join(testDir, 'view_test.js');
      const sourceCode = `function main({ x }) { return x * 2; }`;
      await writeFile(jsFile, sourceCode);
      
      await toolManager.addTool({
        name: 'doubler',
        description: 'Doubles input',
        language: 'javascript' as const,
        codePath: jsFile,
        parameters: { type: 'object', properties: { x: { type: 'number' } } }
      });
      
      const result = await toolManager.handleToolCall({
        params: { name: 'view_source', arguments: { name: 'doubler' } }
      });
      
      expect(result.success).toBe(true);
      expect(result.sourceCode).toBe(sourceCode);
      expect(result.language).toBe('javascript');
    });
    
    test('should view source with verbose mode', async () => {
      const result = await toolManager.handleToolCall({
        params: { 
          name: 'view_source', 
          arguments: { name: 'doubler', verbose: true } 
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.tool.name).toBe('doubler');
      expect(result.tool.isFileBased).toBe(true);
      expect(result.tool.codePath).toBeDefined();
      expect(result.tool.parameters).toBeDefined();
    });
  });
  
  describe('Error handling', () => {
    test('should reject both code and codePath', async () => {
      await expect(toolManager.addTool({
        name: 'invalid',
        description: 'Invalid',
        language: 'python' as const,
        code: 'def main(): pass',
        codePath: './file.py',
        parameters: { type: 'object' }
      })).rejects.toThrow('Cannot specify both code and codePath');
    });
    
    test('should reject neither code nor codePath', async () => {
      await expect(toolManager.addTool({
        name: 'invalid',
        description: 'Invalid',
        language: 'python' as const,
        parameters: { type: 'object' }
      })).rejects.toThrow('Must specify either code or codePath');
    });
    
    test('should reject non-existent file', async () => {
      await expect(toolManager.addTool({
        name: 'invalid',
        description: 'Invalid',
        language: 'python' as const,
        codePath: './non-existent.py',
        parameters: { type: 'object' }
      })).rejects.toThrow('File not found');
    });
    
    test('should reject wrong file extension', async () => {
      const wrongFile = join(testDir, 'wrong.txt');
      await writeFile(wrongFile, 'def main(): pass');
      
      await expect(toolManager.addTool({
        name: 'invalid',
        description: 'Invalid',
        language: 'python' as const,
        codePath: wrongFile,
        parameters: { type: 'object' }
      })).rejects.toThrow('Invalid file extension');
    });
  });
  
  describe('Backward compatibility', () => {
    test('should still support inline functions', async () => {
      const spec = {
        name: 'inline_func',
        description: 'Inline function',
        language: 'python' as const,
        code: 'def main(x): return x * 2',
        parameters: {
          type: 'object',
          properties: { x: { type: 'number' } }
        }
      };
      
      const result = await toolManager.addTool(spec);
      expect(result.code).toBeDefined();
      expect(result.codePath).toBeUndefined();
      
      const execResult = await toolManager.executeTool('inline_func', { x: 5 });
      expect(execResult.output).toBe(10);
    });
  });
});
```

### Create tests/integration/security.test.ts

```typescript
describe('Security Tests', () => {
  test('should reject directory traversal', async () => {
    await expect(toolManager.addTool({
      name: 'traversal',
      description: 'Test',
      language: 'python' as const,
      codePath: '../../../etc/passwd',
      parameters: { type: 'object' }
    })).rejects.toThrow();
  });
  
  test('should reject symbolic links', async () => {
    // Create symbolic link
    const targetFile = join(testDir, 'target.py');
    const linkFile = join(testDir, 'link.py');
    
    await writeFile(targetFile, 'def main(): pass');
    await symlink(targetFile, linkFile);
    
    await expect(toolManager.addTool({
      name: 'symlink',
      description: 'Test',
      language: 'python' as const,
      codePath: linkFile,
      parameters: { type: 'object' }
    })).rejects.toThrow('Symbolic links are not allowed');
  });
  
  test('should reject files with dangerous patterns', async () => {
    const dangerousFile = join(testDir, 'dangerous.py');
    await writeFile(dangerousFile, `
def main():
    import os
    os.system('rm -rf /')  # Dangerous!
    eval(input())  # Also dangerous!
    `);
    
    await expect(toolManager.addTool({
      name: 'dangerous',
      description: 'Test',
      language: 'python' as const,
      codePath: dangerousFile,
      parameters: { type: 'object' }
    })).rejects.toThrow('potentially dangerous code pattern');
  });
});
```

## Test Coverage Goals
- Line coverage: > 90%
- Branch coverage: > 85%
- All error paths tested
- All supported languages tested
- Security scenarios covered

## Acceptance Criteria
- [ ] Integration tests for adding file-based functions
- [ ] Integration tests for executing file-based functions
- [ ] Tests for view_source tool
- [ ] Error handling tests
- [ ] Security validation tests
- [ ] Backward compatibility tests
- [ ] All tests pass
- [ ] Coverage goals met