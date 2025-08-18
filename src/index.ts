#!/usr/bin/env node

import { DIYToolsServer } from './server.js';
import { cleanupTempFiles } from './utils/cleanup.js';
import { logger } from './utils/logger.js'; // Pre-commit hook test

async function main() {
  try {
    const server = new DIYToolsServer();
    await server.start();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
    });
    process.exit(1);
  }
}

// Handle graceful shutdown with cleanup
async function shutdown(signal: string) {
  logger.info(`Shutting down server (${signal})...`);
  try {
    await cleanupTempFiles();
    logger.info('Cleanup completed successfully');
  } catch (error) {
    logger.error('Error during cleanup', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
    logger.debug('Cleanup error on beforeExit', { error });
  }
});

main().catch((error) => {
  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
  });
  process.exit(1);
});
