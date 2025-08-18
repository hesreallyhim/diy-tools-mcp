import { describe, it, expect } from '@jest/globals';
import { isFileBasedFunction, isInlineFunction, FunctionSpecification } from '../index.js';

describe('Type Guards', () => {
  describe('isFileBasedFunction', () => {
    it('should return true for function with codePath only', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'python',
        codePath: '/path/to/file.py',
        parameters: { type: 'object', properties: {} },
      };

      expect(isFileBasedFunction(spec)).toBe(true);
      expect(isInlineFunction(spec)).toBe(false);
    });

    it('should return false for function with code only', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'python',
        code: 'def main(): pass',
        parameters: { type: 'object', properties: {} },
      };

      expect(isFileBasedFunction(spec)).toBe(false);
      expect(isInlineFunction(spec)).toBe(true);
    });

    it('should return false for function with both code and codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'python',
        code: 'def main(): pass',
        codePath: '/path/to/file.py',
        parameters: { type: 'object', properties: {} },
      };

      expect(isFileBasedFunction(spec)).toBe(false);
      expect(isInlineFunction(spec)).toBe(false);
    });

    it('should return false for function with neither code nor codePath', () => {
      const spec: FunctionSpecification = {
        name: 'test',
        description: 'test function',
        language: 'python',
        parameters: { type: 'object', properties: {} },
      };

      expect(isFileBasedFunction(spec)).toBe(false);
      expect(isInlineFunction(spec)).toBe(false);
    });
  });
});
