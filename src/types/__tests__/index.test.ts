import { describe, it, expect } from '@jest/globals';
import { FunctionSpecification, isFileBasedFunction, isInlineFunction } from '../index.js';
import { JSONSchema7 } from 'json-schema';

describe('Type Guards', () => {
  describe('isInlineFunction', () => {
    it('should return true for functions with only code', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        code: 'console.log("test")',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isInlineFunction(spec)).toBe(true);
      expect(isFileBasedFunction(spec)).toBe(false);
    });

    it('should return false for functions with only codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        codePath: './test.js',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isInlineFunction(spec)).toBe(false);
    });

    it('should return false for functions with both code and codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        code: 'console.log("test")',
        codePath: './test.js',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isInlineFunction(spec)).toBe(false);
    });

    it('should return false for functions with neither code nor codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isInlineFunction(spec)).toBe(false);
    });
  });

  describe('isFileBasedFunction', () => {
    it('should return true for functions with only codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        codePath: './test.js',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isFileBasedFunction(spec)).toBe(true);
      expect(isInlineFunction(spec)).toBe(false);
    });

    it('should return false for functions with only code', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        code: 'console.log("test")',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isFileBasedFunction(spec)).toBe(false);
    });

    it('should return false for functions with both code and codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        code: 'console.log("test")',
        codePath: './test.js',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isFileBasedFunction(spec)).toBe(false);
    });

    it('should return false for functions with neither code nor codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'javascript',
        parameters: { type: 'object' } as JSONSchema7,
      };

      expect(isFileBasedFunction(spec)).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should allow creating inline functions with code property', () => {
      const spec: FunctionSpecification = {
        name: 'backwardCompatible',
        description: 'test backward compatibility',
        language: 'python',
        code: 'def test(): pass',
        parameters: { type: 'object' } as JSONSchema7,
        returns: 'void',
        dependencies: ['numpy'],
        timeout: 5000,
      };

      expect(spec.code).toBe('def test(): pass');
      expect(spec.codePath).toBeUndefined();
      expect(isInlineFunction(spec)).toBe(true);
    });

    it('should allow creating file-based functions with codePath property', () => {
      const spec: FunctionSpecification = {
        name: 'fileFunction',
        description: 'test file-based function',
        language: 'typescript',
        codePath: './functions/test.ts',
        parameters: { type: 'object' } as JSONSchema7,
        returns: 'string',
        timeout: 10000,
      };

      expect(spec.codePath).toBe('./functions/test.ts');
      expect(spec.code).toBeUndefined();
      expect(isFileBasedFunction(spec)).toBe(true);
    });
  });
});
