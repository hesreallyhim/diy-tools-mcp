#!/usr/bin/env tsx

// This is a temporary test file to debug the DIY Tools MCP server
// It directly tests the tool manager without going through MCP protocol

import { ToolManager } from './src/tools/manager.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

async function debugServer() {
  console.log('Testing ToolManager directly...');

  // Create a mock server
  const server = new Server(
    {
      name: 'test-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const toolManager = new ToolManager(server);
  
  try {
    // Initialize (load existing functions)
    await toolManager.initialize();
    console.log('Initialized successfully');

    // List tools
    const tools = toolManager.getTools();
    console.log('Available tools:', tools.map(t => t.name));

    // Try to add a simple Python tool
    console.log('\nTesting add_tool...');
    const result = await toolManager.handleToolCall({
      params: {
        name: 'add_tool',
        arguments: {
          name: 'test_add',
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
          }
        }
      }
    });
    console.log('Add tool result:', result);

    // Test the newly added tool
    console.log('\nTesting the new tool...');
    const testResult = await toolManager.handleToolCall({
      params: {
        name: 'test_add',
        arguments: { a: 5, b: 3 }
      }
    });
    console.log('Test result:', testResult);

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

debugServer().catch(console.error);