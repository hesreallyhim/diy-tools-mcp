#!/usr/bin/env node

import { DIYToolsServer } from './server.js';

async function main() {
  try {
    const server = new DIYToolsServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});