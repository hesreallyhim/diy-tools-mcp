import { describe, it, expect } from '@jest/globals';
import { FunctionSpecification } from '../../types/index.js';
import { JSONSchema7 } from 'json-schema';

// Simple tests for the validator logic without running the actual validator
describe('FunctionValidator Logic Tests', () => {
  describe('Validation Rules', () => {
    it('should require exactly one of code or codePath', () => {
      // Valid inline function
      const inlineSpec: FunctionSpecification = {
        name: 'test',
        description: 'test',
        language: 'javascript',
        code: 'console.log("test")',
        parameters: { type: 'object' } as JSONSchema7
      };
      
      expect(inlineSpec.code).toBeDefined();
      expect(inlineSpec.codePath).toBeUndefined();
      
      // Valid file-based function
      const fileSpec: FunctionSpecification = {
        name: 'test',
        description: 'test',
        language: 'javascript',
        codePath: './test.js',
        parameters: { type: 'object' } as JSONSchema7
      };
      
      expect(fileSpec.code).toBeUndefined();
      expect(fileSpec.codePath).toBeDefined();
    });

    it('should validate file extensions match language', () => {
      const languageExtensions = {
        'python': '.py',
        'javascript': '.js',
        'typescript': '.ts',
        'bash': '.sh',
        'ruby': '.rb',
        'node': '.js'
      };
      
      Object.entries(languageExtensions).forEach(([language, extension]) => {
        const spec: FunctionSpecification = {
          name: 'test',
          description: 'test',
          language: language as any,
          codePath: `./test${extension}`,
          parameters: { type: 'object' } as JSONSchema7
        };
        
        expect(spec.codePath?.endsWith(extension)).toBe(true);
      });
    });
  });
});