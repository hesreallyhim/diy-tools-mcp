#!/usr/bin/env tsx

/**
 * Demo script for DIY Tools MCP Server
 *
 * This script demonstrates how to use the DIY Tools MCP server to:
 * 1. Add custom tools in different languages
 * 2. Execute those tools
 * 3. List and manage tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from './src/utils/logger.js';

async function demo() {
  logger.info('=== DIY Tools MCP Server Demo ===\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  const client = new Client(
    {
      name: 'demo-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    logger.info('✓ Connected to DIY Tools MCP server\n');

    // Demo 1: Python Tool - Temperature Converter
    logger.info('📍 Demo 1: Adding a Python temperature converter');
    await client.callTool({
      name: 'add_tool',
      arguments: {
        name: 'convert_temperature',
        description: 'Convert temperature between Celsius and Fahrenheit',
        language: 'python',
        code: `def main(value, from_unit, to_unit):
    if from_unit == "C" and to_unit == "F":
        return (value * 9/5) + 32
    elif from_unit == "F" and to_unit == "C":
        return (value - 32) * 5/9
    else:
        return value`,
        parameters: {
          type: 'object',
          properties: {
            value: { type: 'number', description: 'Temperature value' },
            from_unit: { type: 'string', enum: ['C', 'F'], description: 'Source unit' },
            to_unit: { type: 'string', enum: ['C', 'F'], description: 'Target unit' },
          },
          required: ['value', 'from_unit', 'to_unit'],
        },
      },
    });
    logger.info('✓ Temperature converter added\n');

    // Use the temperature converter
    const tempResult = await client.callTool({
      name: 'convert_temperature',
      arguments: { value: 100, from_unit: 'C', to_unit: 'F' },
    });
    logger.info('🌡️  100°C = ', JSON.parse((tempResult as any).content[0].text), '°F\n');

    // Demo 2: JavaScript Tool - URL Parser
    logger.info('📍 Demo 2: Adding a JavaScript URL parser');
    await client.callTool({
      name: 'add_tool',
      arguments: {
        name: 'parse_url',
        description: 'Parse a URL into its components',
        language: 'javascript',
        code: `function main({ url }) {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 'default',
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash
    };
  } catch (e) {
    return { error: 'Invalid URL' };
  }
}`,
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to parse' },
          },
          required: ['url'],
        },
      },
    });
    logger.info('✓ URL parser added\n');

    // Use the URL parser
    const urlResult = await client.callTool({
      name: 'parse_url',
      arguments: { url: 'https://example.com:8080/path?query=test#section' },
    });
    logger.info('🔗 Parsed URL:', JSON.parse((urlResult as any).content[0].text), '\n');

    // Demo 3: Bash Tool - System Info
    logger.info('📍 Demo 3: Adding a Bash system info tool');
    await client.callTool({
      name: 'add_tool',
      arguments: {
        name: 'system_info',
        description: 'Get system information',
        language: 'bash',
        code: `main() {
  echo "{"
  echo "  \\"hostname\\": \\"$(hostname)\\","
  echo "  \\"os\\": \\"$(uname -s)\\","
  echo "  \\"kernel\\": \\"$(uname -r)\\","
  echo "  \\"uptime\\": \\"$(uptime | awk -F',' '{print $1}')\\""
  echo "}"
}`,
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    });
    logger.info('✓ System info tool added\n');

    // Use the system info tool
    const sysResult = await client.callTool({
      name: 'system_info',
      arguments: {},
    });
    logger.info('💻 System Info:', JSON.parse((sysResult as any).content[0].text), '\n');

    // Demo 4: List all custom tools
    logger.info('📍 Demo 4: Listing all custom tools');
    const toolsList = await client.callTool({
      name: 'list_tools',
      arguments: {},
    });
    const tools = JSON.parse((toolsList as any).content[0].text).tools;
    logger.info(`Found ${tools.length} custom tools:`);
    tools.forEach((tool: any) => {
      logger.info(`  - ${tool.name} (${tool.language}): ${tool.description}`);
    });
    logger.info('');

    // Demo 5: Error handling
    logger.info('📍 Demo 5: Demonstrating error handling');
    try {
      await client.callTool({
        name: 'convert_temperature',
        arguments: { value: 'not a number', from_unit: 'C', to_unit: 'F' },
      });
    } catch (error: any) {
      logger.info('✓ Properly caught type error:', error.message);
    }
    logger.info('');

    logger.info('🎉 Demo completed successfully!');
    logger.info('\nℹ️  Tools are persisted and will be available on server restart.');
    logger.info('ℹ️  Use "remove_tool" to remove any tool you no longer need.');
  } catch (error) {
    logger.error('Demo error:', error);
  } finally {
    await client.close();
  }
}

demo().catch(logger.error);
