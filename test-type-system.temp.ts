// Temporary test file to verify the extended type system
// This file tests the new FunctionSpecification interface with both inline and file-based functions
// Also tests the type guard functions isFileBasedFunction and isInlineFunction

import { FunctionSpecification, isFileBasedFunction, isInlineFunction } from './src/types/index.js';
import { JSONSchema7 } from 'json-schema';

// Test inline function (backward compatibility)
const inlineFunction: FunctionSpecification = {
  name: 'add',
  description: 'Add two numbers',
  language: 'javascript',
  code: 'function add(a, b) { return a + b; }',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  } as JSONSchema7
};

// Test file-based function
const fileBasedFunction: FunctionSpecification = {
  name: 'multiply',
  description: 'Multiply two numbers',
  language: 'javascript',
  codePath: './functions/multiply.js',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  } as JSONSchema7
};

// Test type guards
console.log('Testing inline function:');
console.log('  isInlineFunction:', isInlineFunction(inlineFunction)); // Should be true
console.log('  isFileBasedFunction:', isFileBasedFunction(inlineFunction)); // Should be false

console.log('\nTesting file-based function:');
console.log('  isInlineFunction:', isInlineFunction(fileBasedFunction)); // Should be false
console.log('  isFileBasedFunction:', isFileBasedFunction(fileBasedFunction)); // Should be true

// Test invalid function (both code and codePath)
const invalidFunction: FunctionSpecification = {
  name: 'invalid',
  description: 'Invalid function with both code and codePath',
  language: 'javascript',
  code: 'function invalid() {}',
  codePath: './functions/invalid.js',
  parameters: {} as JSONSchema7
};

console.log('\nTesting invalid function (both code and codePath):');
console.log('  isInlineFunction:', isInlineFunction(invalidFunction)); // Should be false
console.log('  isFileBasedFunction:', isFileBasedFunction(invalidFunction)); // Should be false

// Test function with neither code nor codePath
const emptyFunction: FunctionSpecification = {
  name: 'empty',
  description: 'Function with neither code nor codePath',
  language: 'javascript',
  parameters: {} as JSONSchema7
};

console.log('\nTesting empty function (neither code nor codePath):');
console.log('  isInlineFunction:', isInlineFunction(emptyFunction)); // Should be false
console.log('  isFileBasedFunction:', isFileBasedFunction(emptyFunction)); // Should be false

console.log('\n✅ Type system test complete');