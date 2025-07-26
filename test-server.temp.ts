#!/usr/bin/env tsx

// This is a temporary test file to verify the DIY Tools MCP server functionality
// It tests the add_tool function by creating a simple Python function

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testServer() {
  console.log('Starting DIY Tools MCP server test...');

  // Start the server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

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
    console.log('Connected to server');

    // List initial tools
    const initialTools = await client.listTools();
    console.log('Initial tools:', initialTools.tools.map(t => t.name));

    // Add a new Python tool
    const addResult = await client.callTool('add_tool', {
      name: 'multiply_numbers',
      description: 'Multiply two numbers together',
      language: 'python',
      code: `def main(a, b):
    return a * b`,
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' }
        },
        required: ['a', 'b']
      },
      returns: 'The product of the two numbers'
    });
    console.log('Add tool result:', addResult);

    // List tools after adding
    const updatedTools = await client.listTools();
    console.log('Updated tools:', updatedTools.tools.map(t => t.name));

    // Test the new tool
    const multiplyResult = await client.callTool('multiply_numbers', {
      a: 5,
      b: 7
    });
    console.log('Multiply result:', multiplyResult);

    // Add a JavaScript tool
    const addJsResult = await client.callTool('add_tool', {
      name: 'greet_user',
      description: 'Generate a greeting message',
      language: 'javascript',
      code: `function main({ name, language = 'English' }) {
  const greetings = {
    English: 'Hello',
    Spanish: 'Hola',
    French: 'Bonjour'
  };
  const greeting = greetings[language] || greetings.English;
  return \`\${greeting}, \${name}!\`;
}`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
          language: { 
            type: 'string', 
            enum: ['English', 'Spanish', 'French'],
            description: 'Language for greeting',
            default: 'English'
          }
        },
        required: ['name']
      }
    });
    console.log('Add JS tool result:', addJsResult);

    // Test the JS tool
    const greetResult = await client.callTool('greet_user', {
      name: 'Alice',
      language: 'Spanish'
    });
    console.log('Greet result:', greetResult);

    // List all custom tools
    const listResult = await client.callTool('list_tools', {});
    console.log('All custom tools:', listResult);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testServer().catch(console.error);