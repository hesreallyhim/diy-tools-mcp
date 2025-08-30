import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ErrorCode,
  McpError,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolManager } from './tools/manager.js';
import { ExampleResourceManager } from './resources/example-resources.js';
import { logger, createCorrelationId } from './utils/logger.js';
import { LoggingTransport } from './utils/transport-logger.js';
import {
  DIYToolsError,
  getUserFriendlyMessage,
  NotFoundError,
  ValidationError,
  SecurityError,
  RegistrationError,
} from './utils/errors.js';

export class DIYToolsServer {
  private server: Server;
  private toolManager: ToolManager;
  private resourceManager: ExampleResourceManager;

  constructor() {
    this.server = new Server(
      {
        name: 'diy-tools-mcp',
        version: '1.2.3',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.toolManager = new ToolManager(this.server);
    this.resourceManager = new ExampleResourceManager();
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
        return result;
      } catch (error) {
        logger.error(`Tool call failed: ${toolName}`, {
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
        });

        if (error instanceof McpError) {
          throw error;
        }

        // Map specific error types to appropriate error codes
        if (error instanceof NotFoundError) {
          throw new McpError(ErrorCode.MethodNotFound, getUserFriendlyMessage(error));
        }

        if (
          error instanceof ValidationError ||
          error instanceof SecurityError ||
          error instanceof RegistrationError
        ) {
          throw new McpError(ErrorCode.InvalidParams, getUserFriendlyMessage(error));
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

    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: this.resourceManager.listResources(),
      };
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.debug(`Resource read requested: ${uri}`);

      const content = await this.resourceManager.readResource(uri);
      if (!content) {
        throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
      }

      return {
        contents: [content],
      };
    });
  }

  async start(): Promise<void> {
    logger.info('Starting DIY Tools MCP server...');

    try {
      // Initialize tool manager (load existing functions)
      await this.toolManager.initialize();
      logger.info('Tool manager initialized successfully');

      // Initialize resource manager (load example resources)
      await this.resourceManager.initialize();
      logger.info('Resource manager initialized successfully');

      // Create and run the transport with logging
      const stdioTransport = new StdioServerTransport();
      const loggingTransport = new LoggingTransport(stdioTransport);
      await this.server.connect(loggingTransport);

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
