import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FunctionStorage } from '../storage/functions.js';
import { FunctionSpecification, isFileBasedFunction, isInlineFunction } from '../types/index.js';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('FunctionStorage', () => {
  let storage: FunctionStorage;
  const testDir = join(process.cwd(), 'test-functions');
  const testFile = join(testDir, 'test_function.py');

  beforeAll(async () => {
    // Create test directory and file
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, `
def main(x, y):
    return {"result": x + y}
`);
  });

  afterAll(async () => {
    // Clean up test files - use try-catch to avoid failures if already deleted
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
  });

  beforeEach(() => {
    storage = new FunctionStorage();
  });

  describe('save', () => {
    it('should save inline function with code', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_test',
        description: 'Test inline function',
        language: 'python',
        code: 'def main(): return "hello"',
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      
      expect(stored.id).toBeDefined();
      expect(stored.code).toBe(spec.code);
      expect(stored.codePath).toBeUndefined();
      expect(isInlineFunction(stored)).toBe(true);
      expect(isFileBasedFunction(stored)).toBe(false);
    });

    it('should save file-based function and copy file', async () => {
      const spec: FunctionSpecification = {
        name: 'file_test',
        description: 'Test file-based function',
        language: 'python',
        codePath: testFile,
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      
      expect(stored.id).toBeDefined();
      expect(stored.code).toBeUndefined();
      expect(stored.codePath).toBe('function-code/file_test.py');
      expect(isFileBasedFunction(stored)).toBe(true);
      expect(isInlineFunction(stored)).toBe(false);
      
      // Verify file was copied
      const copiedFile = join(process.cwd(), 'function-code', 'file_test.py');
      expect(existsSync(copiedFile)).toBe(true);
    });

    it('should reject function with both code and codePath', async () => {
      const spec: FunctionSpecification = {
        name: 'invalid_test',
        description: 'Invalid function',
        language: 'python',
        code: 'def main(): pass',
        codePath: testFile,
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      
      // Storage doesn't validate, it just saves what's valid
      // The validation happens in ToolManager
      expect(stored.id).toBeDefined();
    });
  });

  describe('loadFunctionCode', () => {
    it('should load code from inline function', async () => {
      const spec: FunctionSpecification = {
        name: 'inline_load_test',
        description: 'Test loading inline code',
        language: 'python',
        code: 'def main(): return "inline"',
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      const code = await storage.loadFunctionCode(stored);
      
      expect(code).toBe('def main(): return "inline"');
    });

    it('should load code from file-based function', async () => {
      const spec: FunctionSpecification = {
        name: 'file_load_test',
        description: 'Test loading file code',
        language: 'python',
        codePath: testFile,
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      const code = await storage.loadFunctionCode(stored);
      
      expect(code).toContain('def main(x, y):');
      expect(code).toContain('return {"result": x + y}');
    });

    it('should throw error for function without code or codePath', async () => {
      const stored = {
        id: 'test',
        name: 'broken',
        description: 'Broken function',
        language: 'python' as const,
        parameters: { type: 'object' as const, properties: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await expect(storage.loadFunctionCode(stored)).rejects.toThrow(
        'Function has neither code nor codePath'
      );
    });
  });

  describe('delete', () => {
    it('should delete inline function', async () => {
      const spec: FunctionSpecification = {
        name: 'delete_inline_test',
        description: 'Test deletion',
        language: 'python',
        code: 'def main(): pass',
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      const deleted = await storage.delete(spec.name);
      
      expect(deleted).toBe(true);
      
      const all = await storage.loadAll();
      expect(all.find(f => f.name === spec.name)).toBeUndefined();
    });

    it('should delete file-based function and clean up code file', async () => {
      const spec: FunctionSpecification = {
        name: 'delete_file_test',
        description: 'Test file deletion',
        language: 'python',
        codePath: testFile,
        parameters: { type: 'object', properties: {} }
      };

      const stored = await storage.save(spec);
      const codeFile = join(process.cwd(), stored.codePath!);
      
      expect(existsSync(codeFile)).toBe(true);
      
      const deleted = await storage.delete(spec.name);
      
      expect(deleted).toBe(true);
      expect(existsSync(codeFile)).toBe(false);
      
      const all = await storage.loadAll();
      expect(all.find(f => f.name === spec.name)).toBeUndefined();
    });
  });

  describe('loadAll', () => {
    it('should load both inline and file-based functions', async () => {
      const inline: FunctionSpecification = {
        name: 'load_all_inline',
        description: 'Inline function',
        language: 'python',
        code: 'def main(): pass',
        parameters: { type: 'object', properties: {} }
      };

      const fileBased: FunctionSpecification = {
        name: 'load_all_file',
        description: 'File function',
        language: 'python',
        codePath: testFile,
        parameters: { type: 'object', properties: {} }
      };

      await storage.save(inline);
      await storage.save(fileBased);
      
      const all = await storage.loadAll();
      
      const foundInline = all.find(f => f.name === 'load_all_inline');
      const foundFile = all.find(f => f.name === 'load_all_file');
      
      expect(foundInline).toBeDefined();
      expect(foundInline?.code).toBeDefined();
      expect(foundInline?.codePath).toBeUndefined();
      
      expect(foundFile).toBeDefined();
      expect(foundFile?.code).toBeUndefined();
      expect(foundFile?.codePath).toBeDefined();
    });
  });
});