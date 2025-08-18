#!/usr/bin/env node

import { DIYToolsServer } from './server.js';
import { cleanupTempFiles } from './utils/cleanup.js';

async function main() {
  try {
    const server = new DIYToolsServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown with cleanup
async function shutdown(signal: string) {
  console.error(`Shutting down (${signal})...`);
  try {
    await cleanupTempFiles();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Clean up temp files on unexpected exit
process.on('beforeExit', async () => {
  try {
    await cleanupTempFiles();
  } catch (error) {
    // Ignore errors during cleanup
  }
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
