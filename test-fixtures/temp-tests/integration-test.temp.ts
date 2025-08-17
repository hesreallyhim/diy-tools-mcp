#!/usr/bin/env tsx

// This is a temporary test file for integration testing the DIY Tools MCP server
// It uses proper types and error handling

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runTests() {
  console.log('Starting DIY Tools MCP integration test...\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js']
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✓ Connected to server\n');

    // Test 1: List tools
    console.log('TEST 1: List tools');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name));
    console.log();

    // Test 2: Call the existing add_the_secret_number tool
    console.log('TEST 2: Call add_the_secret_number');
    try {
      const result = await client.callTool({
        name: 'add_the_secret_number',
        arguments: {
          input_number: 10
        }
      });
      console.log('Result:', result);
      console.log('✓ Tool executed successfully\n');
    } catch (error) {
      console.error('✗ Failed:', error);
      console.log();
    }

    // Test 3: Add a new Python tool
    console.log('TEST 3: Add a new Python tool');
    try {
      const result = await client.callTool({
        name: 'add_tool',
        arguments: {
          name: 'multiply',
          description: 'Multiply two numbers',
          language: 'python',
          code: 'def main(x, y):\n    return x * y',
          parameters: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['x', 'y']
          }
        }
      });
      console.log('Result:', result);
      console.log('✓ Tool added successfully\n');
    } catch (error) {
      console.error('✗ Failed:', error);
      console.log();
    }

    // Test 4: Execute the new tool
    console.log('TEST 4: Execute multiply tool');
    try {
      const result = await client.callTool({
        name: 'multiply',
        arguments: {
          x: 6,
          y: 7
        }
      });
      console.log('Result:', result);
      console.log('✓ Tool executed successfully\n');
    } catch (error) {
      console.error('✗ Failed:', error);
      console.log();
    }

    // Test 5: List custom tools
    console.log('TEST 5: List custom tools');
    try {
      const result = await client.callTool({
        name: 'list_tools',
        arguments: {}
      });
      console.log('Custom tools:', result);
      console.log('✓ Listed successfully\n');
    } catch (error) {
      console.error('✗ Failed:', error);
      console.log();
    }

    // Test 6: Remove the tool
    console.log('TEST 6: Remove multiply tool');
    try {
      const result = await client.callTool({
        name: 'remove_tool',
        arguments: {
          name: 'multiply'
        }
      });
      console.log('Result:', result);
      console.log('✓ Tool removed successfully\n');
    } catch (error) {
      console.error('✗ Failed:', error);
      console.log();
    }

    console.log('All tests completed!');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

runTests().catch(console.error);