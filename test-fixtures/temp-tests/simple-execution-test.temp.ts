#!/usr/bin/env tsx

// This is a temporary test file to debug execution issues
// It directly tests function execution without MCP protocol

import { FunctionExecutor } from './src/tools/executor.js';
import { StoredFunction } from './src/types/index.js';

async function testExecution() {
  console.log('Testing function execution directly...\n');

  const executor = new FunctionExecutor();

  // Test 1: Simple Python function
  console.log('TEST 1: Python function');
  const pythonFunc: StoredFunction = {
    id: 'test1',
    name: 'add_numbers',
    description: 'Add two numbers',
    language: 'python',
    code: 'def main(a, b):\n    return a + b',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number' },
        b: { type: 'number' }
      },
      required: ['a', 'b']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const result = await executor.execute(pythonFunc, { a: 5, b: 3 });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 2: JavaScript function
  console.log('\nTEST 2: JavaScript function');
  const jsFunc: StoredFunction = {
    id: 'test2',
    name: 'reverse_string',
    description: 'Reverse a string',
    language: 'javascript',
    code: 'function main({ text }) {\n  return text.split("").reverse().join("");\n}',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const result = await executor.execute(jsFunc, { text: 'hello' });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 3: Test the existing add_the_secret_number function
  console.log('\nTEST 3: add_the_secret_number function');
  const secretFunc: StoredFunction = {
    id: 'test3',
    name: 'add_the_secret_number',
    description: 'Add 42 to a number',
    language: 'python',
    code: 'def main(input_number):\n    return input_number + 42',
    parameters: {
      type: 'object',
      properties: {
        input_number: { type: 'number' }
      },
      required: ['input_number']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const result = await executor.execute(secretFunc, { input_number: 10 });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 4: Function with timeout
  console.log('\nTEST 4: Function with timeout');
  const timeoutFunc: StoredFunction = {
    id: 'test4',
    name: 'slow_function',
    description: 'A slow function',
    language: 'python',
    code: 'def main():\n    import time\n    time.sleep(2)\n    return "done"',
    parameters: {
      type: 'object',
      properties: {}
    },
    timeout: 1000, // 1 second
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const result = await executor.execute(timeoutFunc, {});
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testExecution().catch(console.error);