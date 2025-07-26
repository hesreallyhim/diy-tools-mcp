import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ErrorCode, 
  McpError,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ToolManager } from './tools/manager.js';

export class DIYToolsServer {
  private server: Server;
  private toolManager: ToolManager;

  constructor() {
    this.server = new Server(
      {
        name: 'diy-tools-mcp',
        version: '1.0.0',
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
        tools: this.toolManager.getTools()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.toolManager.handleToolCall(request);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    });
  }

  async start(): Promise<void> {
    // Initialize tool manager (load existing functions)
    await this.toolManager.initialize();

    // Create and run the transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('DIY Tools MCP server started');
  }
}