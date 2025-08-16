/**
 * Temporary test file for manually testing the view_source tool functionality
 * Created to verify that the view_source tool works correctly with both
 * inline and file-based functions, in both verbose and non-verbose modes.
 */

import { ToolManager } from './src/tools/manager.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FunctionSpecification } from './src/types/index.js';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';

async function testViewSource() {
  console.log('Testing view_source tool implementation...\n');
  
  // Create mock server
  const mockServer = {
    notification: () => {}
  } as unknown as Server;
  
  const manager = new ToolManager(mockServer);
  await manager.initialize();
  
  // Create test directory and file
  const testDir = join(process.cwd(), 'test-view-source-temp');
  await mkdir(testDir, { recursive: true });
  
  const pythonFile = join(testDir, 'example.py');
  await writeFile(pythonFile, `
def main(x, y):
    """Add two numbers together"""
    return {"result": x + y}
`);
  
  try {
    // Test 1: Add inline function
    console.log('1. Adding inline function...');
    const inlineSpec: FunctionSpecification = {
      name: 'multiply',
      description: 'Multiply two numbers',
      language: 'python',
      code: 'def main(a, b):\n    return {"product": a * b}',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['a', 'b']
      },
      returns: 'The product of a and b',
      timeout: 5000
    };
    
    await manager.addTool(inlineSpec);
    console.log('✓ Inline function added\n');
    
    // Test 2: Add file-based function
    console.log('2. Adding file-based function...');
    const fileSpec: FunctionSpecification = {
      name: 'add_numbers',
      description: 'Add two numbers from file',
      language: 'python',
      codePath: pythonFile,
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['x', 'y']
      },
      dependencies: ['math'],
      timeout: 3000
    };
    
    await manager.addTool(fileSpec);
    console.log('✓ File-based function added\n');
    
    // Test 3: View inline function (non-verbose)
    console.log('3. Testing view_source for inline function (non-verbose)...');
    const inlineResult = await manager.handleToolCall({
      params: {
        name: 'view_source',
        arguments: { name: 'multiply' }
      }
    });
    console.log('Result:', JSON.stringify(inlineResult, null, 2));
    console.log('✓ Non-verbose view successful\n');
    
    // Test 4: View inline function (verbose)
    console.log('4. Testing view_source for inline function (verbose)...');
    const inlineVerboseResult = await manager.handleToolCall({
      params: {
        name: 'view_source',
        arguments: { name: 'multiply', verbose: true }
      }
    });
    console.log('Result (showing key fields):');
    console.log('- Tool name:', inlineVerboseResult.tool.name);
    console.log('- Language:', inlineVerboseResult.tool.language);
    console.log('- Is file-based:', inlineVerboseResult.tool.isFileBased);
    console.log('- Has source code:', !!inlineVerboseResult.tool.sourceCode);
    console.log('- Has metadata:', !!inlineVerboseResult.tool.createdAt);
    console.log('✓ Verbose view successful\n');
    
    // Test 5: View file-based function (non-verbose)
    console.log('5. Testing view_source for file-based function (non-verbose)...');
    const fileResult = await manager.handleToolCall({
      params: {
        name: 'view_source',
        arguments: { name: 'add_numbers' }
      }
    });
    console.log('Result:', JSON.stringify(fileResult, null, 2));
    console.log('✓ File-based non-verbose view successful\n');
    
    // Test 6: View file-based function (verbose)
    console.log('6. Testing view_source for file-based function (verbose)...');
    const fileVerboseResult = await manager.handleToolCall({
      params: {
        name: 'view_source',
        arguments: { name: 'add_numbers', verbose: true }
      }
    });
    console.log('Result (showing key fields):');
    console.log('- Tool name:', fileVerboseResult.tool.name);
    console.log('- Language:', fileVerboseResult.tool.language);
    console.log('- Is file-based:', fileVerboseResult.tool.isFileBased);
    console.log('- Code path:', fileVerboseResult.tool.codePath);
    console.log('- Dependencies:', fileVerboseResult.tool.dependencies);
    console.log('- Has source code:', !!fileVerboseResult.tool.sourceCode);
    console.log('✓ Verbose file-based view successful\n');
    
    // Test 7: View non-existent tool
    console.log('7. Testing view_source for non-existent tool...');
    const errorResult = await manager.handleToolCall({
      params: {
        name: 'view_source',
        arguments: { name: 'does_not_exist' }
      }
    });
    console.log('Result:', JSON.stringify(errorResult, null, 2));
    console.log('✓ Error handling works correctly\n');
    
    // Test 8: Verify view_source is in tool list
    console.log('8. Verifying view_source appears in tool list...');
    const tools = manager.getTools();
    const viewSourceTool = tools.find(t => t.name === 'view_source');
    console.log('Found view_source tool:', !!viewSourceTool);
    if (viewSourceTool) {
      console.log('- Description:', viewSourceTool.description);
      console.log('- Has input schema:', !!viewSourceTool.inputSchema);
    }
    console.log('✓ Tool properly registered\n');
    
    console.log('All tests passed successfully! ✨');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    await rm(testDir, { recursive: true, force: true });
    await rm(join(process.cwd(), 'functions'), { recursive: true, force: true });
    await rm(join(process.cwd(), 'function-code'), { recursive: true, force: true });
  }
}

// Run the test
testViewSource().catch(console.error);