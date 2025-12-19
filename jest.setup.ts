import { afterAll } from '@jest/globals';
import { logger } from './src/utils/logger.js';

// Ensure transports flush and close so worker processes can exit cleanly.
afterAll(() => {
  logger.close();
});
