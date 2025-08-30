import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './logger.js';

/**
 * A transport wrapper that logs all incoming and outgoing messages
 */
export class LoggingTransport implements Transport {
  constructor(private readonly innerTransport: Transport) {}

  async start(): Promise<void> {
    // Set up message logging for incoming messages
    this.innerTransport.onmessage = (message: JSONRPCMessage) => {
      logger.debug('Received message', {
        direction: 'incoming',
        message: JSON.stringify(message, null, 2),
        method: 'method' in message ? message.method : undefined,
        id: 'id' in message ? message.id : undefined,
      });

      // Forward to our own handler
      if (this.onmessage) {
        this.onmessage(message);
      }
    };

    // Set up error logging
    this.innerTransport.onerror = (error: Error) => {
      logger.error('Transport error', {
        error: error.message,
        stack: process.env.DEBUG === 'true' ? error.stack : undefined,
      });

      // Forward to our own handler
      if (this.onerror) {
        this.onerror(error);
      }
    };

    // Set up close logging
    this.innerTransport.onclose = () => {
      logger.info('Transport closed');

      // Forward to our own handler
      if (this.onclose) {
        this.onclose();
      }
    };

    return this.innerTransport.start();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    logger.debug('Sending message', {
      direction: 'outgoing',
      message: JSON.stringify(message, null, 2),
      method: 'method' in message ? message.method : undefined,
      id: 'id' in message ? message.id : undefined,
    });

    return this.innerTransport.send(message);
  }

  async close(): Promise<void> {
    logger.info('Closing transport');
    return this.innerTransport.close();
  }

  // These will be set by the SDK
  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
}
