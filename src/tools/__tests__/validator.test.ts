import { describe, it, expect, beforeEach } from '@jest/globals';
import { FunctionValidator } from '../validator.js';
import { FunctionSpecification, ValidationError } from '../../types/index.js';
import { JSONSchema7 } from 'json-schema';

describe('FunctionValidator', () => {
  let validator: FunctionValidator;

  beforeEach(() => {
    validator = new FunctionValidator();
  });

  describe('code/codePath validation', () => {
    it('should accept functions with only code (inline)', async () => {
      const spec: FunctionSpecification = {
        name: 'testFunction',
        description: 'A test function',
        language: 'javascript',
        code: 'function test() { return 42; }',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should accept functions with only codePath (file-based)', async () => {
      const spec: FunctionSpecification = {
        name: 'testFunction',
        description: 'A test function',
        language: 'javascript',
        codePath: './functions/test.js',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should reject functions with both code and codePath', async () => {
      const spec: FunctionSpecification = {
        name: 'testFunction',
        description: 'A test function',
        language: 'javascript',
        code: 'function test() { return 42; }',
        codePath: './functions/test.js',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).rejects.toThrow(
        'Function cannot have both code and codePath - use exactly one'
      );
    });

    it('should reject functions with neither code nor codePath', async () => {
      const spec: FunctionSpecification = {
        name: 'testFunction',
        description: 'A test function',
        language: 'javascript',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).rejects.toThrow(
        'Function must have either code (inline) or codePath (file-based)'
      );
    });
  });

  describe('file extension validation', () => {
    it('should validate .py extension for Python files', async () => {
      const spec: FunctionSpecification = {
        name: 'pythonFunction',
        description: 'A Python function',
        language: 'python',
        codePath: './functions/test.py',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should validate .js extension for JavaScript files', async () => {
      const spec: FunctionSpecification = {
        name: 'jsFunction',
        description: 'A JavaScript function',
        language: 'javascript',
        codePath: './functions/test.js',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should validate .ts extension for TypeScript files', async () => {
      const spec: FunctionSpecification = {
        name: 'tsFunction',
        description: 'A TypeScript function',
        language: 'typescript',
        codePath: './functions/test.ts',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should validate .sh extension for Bash files', async () => {
      const spec: FunctionSpecification = {
        name: 'bashFunction',
        description: 'A Bash function',
        language: 'bash',
        codePath: './functions/test.sh',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should validate .rb extension for Ruby files', async () => {
      const spec: FunctionSpecification = {
        name: 'rubyFunction',
        description: 'A Ruby function',
        language: 'ruby',
        codePath: './functions/test.rb',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should validate .js extension for Node.js files', async () => {
      const spec: FunctionSpecification = {
        name: 'nodeFunction',
        description: 'A Node.js function',
        language: 'node',
        codePath: './functions/test.js',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).resolves.not.toThrow();
    });

    it('should reject incorrect file extension', async () => {
      const spec: FunctionSpecification = {
        name: 'pythonFunction',
        description: 'A Python function',
        language: 'python',
        codePath: './functions/test.js', // Wrong extension for Python
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(spec)).rejects.toThrow(
        'File path must have one of .py extensions for python language'
      );
    });
  });

  describe('code syntax validation', () => {
    it('should only validate syntax for inline functions', async () => {
      // File-based function should not have its code validated
      const fileSpec: FunctionSpecification = {
        name: 'fileFunction',
        description: 'A file-based function',
        language: 'javascript',
        codePath: './functions/test.js',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      // Should not throw even though there's no code to validate
      await expect(validator.validate(fileSpec)).resolves.not.toThrow();
    });

    it('should validate syntax for inline JavaScript functions', async () => {
      const validSpec: FunctionSpecification = {
        name: 'validJs',
        description: 'Valid JavaScript',
        language: 'javascript',
        code: 'function test() { return 42; }',
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(validSpec)).resolves.not.toThrow();

      const invalidSpec: FunctionSpecification = {
        name: 'invalidJs',
        description: 'Invalid JavaScript',
        language: 'javascript',
        code: 'function test() { return 42', // Missing closing brace
        parameters: {
          type: 'object',
          properties: {}
        } as JSONSchema7
      };

      await expect(validator.validate(invalidSpec)).rejects.toThrow(
        'Code validation failed'
      );
    });
  });
});