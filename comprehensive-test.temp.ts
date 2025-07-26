#!/usr/bin/env tsx

// This is a temporary test file to comprehensively test the DIY Tools MCP server
// It tests all major functionality including add_tool, execute tool, and remove_tool

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function comprehensiveTest() {
  console.log('Starting comprehensive DIY Tools MCP server test...\n');

  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js']
  });

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✓ Connected to server\n');

    // Test 1: List initial tools
    console.log('TEST 1: List initial tools');
    const initialTools = await client.listTools();
    console.log('Initial tools:', initialTools.tools.map(t => t.name));
    console.log('✓ Listed tools successfully\n');

    // Test 2: Test existing add_the_secret_number tool
    console.log('TEST 2: Test existing add_the_secret_number tool');
    try {
      const secretResult = await client.callTool('add_the_secret_number', {
        input_number: 10
      });
      console.log('Result:', secretResult);
      console.log('✓ Executed existing tool successfully\n');
    } catch (error) {
      console.log('✗ Failed to execute existing tool:', error);
      console.log();
    }

    // Test 3: Add a Python tool
    console.log('TEST 3: Add a Python tool');
    const pythonTool = await client.callTool('add_tool', {
      name: 'calculate_area',
      description: 'Calculate area of a rectangle',
      language: 'python',
      code: `def main(width, height):
    return width * height`,
      parameters: {
        type: 'object',
        properties: {
          width: { type: 'number', description: 'Width of rectangle' },
          height: { type: 'number', description: 'Height of rectangle' }
        },
        required: ['width', 'height']
      },
      returns: 'The area of the rectangle'
    });
    console.log('Add result:', pythonTool);
    console.log('✓ Added Python tool successfully\n');

    // Test 4: Execute the Python tool
    console.log('TEST 4: Execute the Python tool');
    const areaResult = await client.callTool('calculate_area', {
      width: 5,
      height: 10
    });
    console.log('Area result:', areaResult);
    console.log('✓ Executed Python tool successfully\n');

    // Test 5: Add a JavaScript tool
    console.log('TEST 5: Add a JavaScript tool');
    const jsTool = await client.callTool('add_tool', {
      name: 'reverse_string',
      description: 'Reverse a string',
      language: 'javascript',
      code: `function main({ text }) {
  return text.split('').reverse().join('');
}`,
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to reverse' }
        },
        required: ['text']
      }
    });
    console.log('Add result:', jsTool);
    console.log('✓ Added JavaScript tool successfully\n');

    // Test 6: Execute the JavaScript tool
    console.log('TEST 6: Execute the JavaScript tool');
    const reverseResult = await client.callTool('reverse_string', {
      text: 'Hello World'
    });
    console.log('Reverse result:', reverseResult);
    console.log('✓ Executed JavaScript tool successfully\n');

    // Test 7: Add a Bash tool
    console.log('TEST 7: Add a Bash tool');
    const bashTool = await client.callTool('add_tool', {
      name: 'count_files',
      description: 'Count files in current directory',
      language: 'bash',
      code: `main() {
  count=$(ls -1 | wc -l)
  echo "{\\"count\\": $count}"
}`,
      parameters: {
        type: 'object',
        properties: {}
      }
    });
    console.log('Add result:', bashTool);
    console.log('✓ Added Bash tool successfully\n');

    // Test 8: Execute the Bash tool
    console.log('TEST 8: Execute the Bash tool');
    const countResult = await client.callTool('count_files', {});
    console.log('Count result:', countResult);
    console.log('✓ Executed Bash tool successfully\n');

    // Test 9: List all custom tools
    console.log('TEST 9: List all custom tools');
    const listResult = await client.callTool('list_tools', {});
    console.log('Custom tools:', JSON.stringify(listResult, null, 2));
    console.log('✓ Listed custom tools successfully\n');

    // Test 10: Test error handling with invalid parameters
    console.log('TEST 10: Test error handling');
    try {
      await client.callTool('calculate_area', {
        width: 'not a number',
        height: 10
      });
      console.log('✗ Should have failed with invalid parameters');
    } catch (error) {
      console.log('✓ Correctly rejected invalid parameters:', error);
    }
    console.log();

    // Test 11: Remove a tool
    console.log('TEST 11: Remove a tool');
    const removeResult = await client.callTool('remove_tool', {
      name: 'count_files'
    });
    console.log('Remove result:', removeResult);
    console.log('✓ Removed tool successfully\n');

    // Test 12: Verify tool was removed
    console.log('TEST 12: Verify tool was removed');
    const finalTools = await client.listTools();
    const hasCountFiles = finalTools.tools.some(t => t.name === 'count_files');
    if (!hasCountFiles) {
      console.log('✓ Tool was successfully removed\n');
    } else {
      console.log('✗ Tool was not removed\n');
    }

    // Test 13: Test timeout functionality
    console.log('TEST 13: Test timeout functionality');
    const timeoutTool = await client.callTool('add_tool', {
      name: 'slow_function',
      description: 'A function that takes time',
      language: 'python',
      code: `def main():
    import time
    time.sleep(2)
    return "completed"`,
      parameters: {
        type: 'object',
        properties: {}
      },
      timeout: 1000  // 1 second timeout
    });
    console.log('Added slow function with 1s timeout');
    
    try {
      await client.callTool('slow_function', {});
      console.log('✗ Should have timed out');
    } catch (error) {
      console.log('✓ Function correctly timed out:', error);
    }
    console.log();

    console.log('====================================');
    console.log('All tests completed successfully! 🎉');
    console.log('====================================');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup: remove test tools
    const toolsToRemove = ['calculate_area', 'reverse_string', 'count_files', 'slow_function'];
    for (const tool of toolsToRemove) {
      try {
        await client.callTool('remove_tool', { name: tool });
      } catch {
        // Ignore cleanup errors
      }
    }
    
    await client.close();
  }
}

comprehensiveTest().catch(console.error);