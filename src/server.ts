import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ErrorCode,
  McpError,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolManager } from './tools/manager.js';
import { logger, createCorrelationId } from './utils/logger.js';
import { DIYToolsError, getUserFriendlyMessage } from './utils/errors.js';

export class DIYToolsServer {
  private server: Server;
  private toolManager: ToolManager;

  constructor() {
    this.server = new Server(
      {
        name: 'diy-tools-mcp',
        version: '1.2.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolManager = new ToolManager(this.server);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolManager.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const correlationId = createCorrelationId();
      const toolName = request.params.name;

      logger.debug(`Tool call received: ${toolName}`, {
        correlationId,
        tool: toolName,
        hasArgs: !!request.params.arguments,
      });

      try {
        const result = await this.toolManager.handleToolCall(request);
        logger.debug(`Tool call completed: ${toolName}`, { correlationId, success: true });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        logger.error(`Tool call failed: ${toolName}`, {
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
        });

        if (error instanceof McpError) {
          throw error;
        }

        if (error instanceof DIYToolsError) {
          throw new McpError(ErrorCode.InternalError, getUserFriendlyMessage(error));
        }

        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    });
  }

  async start(): Promise<void> {
    logger.info('Starting DIY Tools MCP server...');

    try {
      // Initialize tool manager (load existing functions)
      await this.toolManager.initialize();
      logger.info('Tool manager initialized successfully');

      // Create and run the transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info('DIY Tools MCP server started successfully', {
        version: '1.0.0',
        toolsLoaded: this.toolManager.getTools().length,
      });
    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
      });
      throw error;
    }
  }
}
