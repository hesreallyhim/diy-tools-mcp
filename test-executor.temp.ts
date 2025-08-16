// Temporary test file for testing updated executor functionality
// Context: Testing ticket 003 - Modify Executors to Work with File Paths
// This tests both inline and file-based function execution

import { FunctionExecutor } from './src/tools/executor.js';
import { FunctionStorage } from './src/storage/functions.js';
import { FunctionSpecification } from './src/types/index.js';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

async function testExecutor() {
  console.log('Testing Executor Updates...\n');
  
  const executor = new FunctionExecutor();
  const storage = new FunctionStorage();
  
  // Create test Python file
  const testPyFile = join(process.cwd(), 'test_add.py');
  await writeFile(testPyFile, `
import json
import sys

def main(a, b):
    return {"sum": a + b, "product": a * b}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = main(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`);

  // Create test JS file
  const testJsFile = join(process.cwd(), 'test_multiply.js');
  await writeFile(testJsFile, `
function main(args) {
  const { x, y } = args;
  return {
    result: x * y,
    message: \`\${x} × \${y} = \${x * y}\`
  };
}

module.exports = { main };
`);

  try {
    // Test 1: Inline Python function
    console.log('Test 1: Execute inline Python function...');
    const inlinePython: FunctionSpecification = {
      name: 'inline_python_test',
      description: 'Test inline Python execution',
      language: 'python',
      code: `
def main(name):
    return {"greeting": f"Hello, {name}!"}
`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      }
    };
    
    const storedInlinePy = await storage.save(inlinePython);
    const resultInlinePy = await executor.execute(storedInlinePy, { name: 'World' });
    console.log('✓ Inline Python result:', resultInlinePy);
    
    // Test 2: File-based Python function
    console.log('\nTest 2: Execute file-based Python function...');
    const filePython: FunctionSpecification = {
      name: 'file_python_test',
      description: 'Test file-based Python execution',
      language: 'python',
      codePath: testPyFile,
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['a', 'b']
      }
    };
    
    const storedFilePy = await storage.save(filePython);
    const resultFilePy = await executor.execute(storedFilePy, { a: 5, b: 3 });
    console.log('✓ File-based Python result:', resultFilePy);
    
    // Test 3: Inline JavaScript function
    console.log('\nTest 3: Execute inline JavaScript function...');
    const inlineJs: FunctionSpecification = {
      name: 'inline_js_test',
      description: 'Test inline JS execution',
      language: 'javascript',
      code: `
function main(args) {
  return { reversed: args.text.split('').reverse().join('') };
}
`,
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' }
        },
        required: ['text']
      }
    };
    
    const storedInlineJs = await storage.save(inlineJs);
    const resultInlineJs = await executor.execute(storedInlineJs, { text: 'hello' });
    console.log('✓ Inline JS result:', resultInlineJs);
    
    // Test 4: File-based JavaScript function
    console.log('\nTest 4: Execute file-based JavaScript function...');
    const fileJs: FunctionSpecification = {
      name: 'file_js_test',
      description: 'Test file-based JS execution',
      language: 'javascript',
      codePath: testJsFile,
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['x', 'y']
      }
    };
    
    const storedFileJs = await storage.save(fileJs);
    const resultFileJs = await executor.execute(storedFileJs, { x: 7, y: 8 });
    console.log('✓ File-based JS result:', resultFileJs);
    
    // Test 5: Timeout handling
    console.log('\nTest 5: Testing timeout handling...');
    const slowFunction: FunctionSpecification = {
      name: 'slow_function',
      description: 'Function that times out',
      language: 'python',
      code: `
import time
def main():
    time.sleep(2)
    return "Should not reach here"
`,
      parameters: { type: 'object', properties: {} },
      timeout: 1000 // 1 second timeout
    };
    
    const storedSlow = await storage.save(slowFunction);
    const resultSlow = await executor.execute(storedSlow, {});
    console.log('✓ Timeout result:', resultSlow);
    
    // Clean up
    await rm(testPyFile, { force: true });
    await rm(testJsFile, { force: true });
    await storage.delete('inline_python_test');
    await storage.delete('file_python_test');
    await storage.delete('inline_js_test');
    await storage.delete('file_js_test');
    await storage.delete('slow_function');
    
    console.log('\n✅ All executor tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Clean up on error
    await rm(testPyFile, { force: true });
    await rm(testJsFile, { force: true });
  }
}

// Run the tests
testExecutor().catch(console.error);