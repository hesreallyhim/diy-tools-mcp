import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  FunctionSpecification, 
  StoredFunction, 
  RegistrationError,
  ExecutionResult 
} from '../types/index.js';
import { FunctionStorage } from '../storage/functions.js';
import { FunctionValidator } from './validator.js';
import { FunctionExecutor } from './executor.js';

export class ToolManager {
  private storage: FunctionStorage;
  private validator: FunctionValidator;
  private executor: FunctionExecutor;
  private registeredTools: Map<string, StoredFunction>;

  constructor(private server: Server) {
    this.storage = new FunctionStorage();
    this.validator = new FunctionValidator();
    this.executor = new FunctionExecutor();
    this.registeredTools = new Map();
  }

  async initialize(): Promise<void> {
    // Load all existing functions from storage
    const functions = await this.storage.loadAll();
    
    for (const func of functions) {
      try {
        await this.registerTool(func, false); // Don't notify during initialization
      } catch (error) {
        console.error(`Failed to register tool ${func.name}:`, error);
      }
    }
  }

  async addTool(spec: FunctionSpecification): Promise<StoredFunction> {
    try {
      // Validate the function specification
      await this.validator.validate(spec);

      // Check if tool already exists
      if (this.registeredTools.has(spec.name)) {
        throw new RegistrationError(`Tool with name "${spec.name}" already exists`);
      }

      // Save to storage
      const storedFunction = await this.storage.save(spec);

      // Register the tool
      await this.registerTool(storedFunction, true);

      return storedFunction;
    } catch (error) {
      if (error instanceof Error) {
        throw new RegistrationError(`Failed to add tool: ${error.message}`);
      }
      throw new RegistrationError('Failed to add tool: Unknown error');
    }
  }

  async removeTool(name: string): Promise<boolean> {
    const tool = this.registeredTools.get(name);
    if (!tool) {
      return false;
    }

    // Remove from storage
    await this.storage.delete(name);

    // Unregister the tool
    this.registeredTools.delete(name);

    // Notify clients
    try {
      this.server.notification({
        method: 'tools/listChanged'
      });
    } catch (error) {
      // Ignore notification errors (e.g., when server is not connected)
      console.error('Failed to send tools/listChanged notification:', error);
    }

    return true;
  }

  async executeTool(name: string, args: any): Promise<ExecutionResult> {
    const tool = this.registeredTools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
        executionTime: 0
      };
    }

    return await this.executor.execute(tool, args);
  }

  getTools(): Array<{ name: string; description: string; inputSchema: any }> {
    const tools = Array.from(this.registeredTools.values()).map(func => ({
      name: func.name,
      description: func.description,
      inputSchema: func.parameters
    }));

    // Always include the add_tool function
    tools.push({
      name: 'add_tool',
      description: 'Add a new custom tool/function to the server',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the tool (must be unique)',
            pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
          },
          description: {
            type: 'string',
            description: 'A description of what the tool does'
          },
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'typescript', 'bash', 'ruby', 'node'],
            description: 'The programming language the function is written in'
          },
          code: {
            type: 'string',
            description: 'The function code. Must define a function named "main" that accepts parameters and returns a result'
          },
          parameters: {
            type: 'object',
            description: 'JSON Schema defining the input parameters for the function',
            properties: {
              type: { type: 'string', const: 'object' },
              properties: { type: 'object' },
              required: { type: 'array', items: { type: 'string' } }
            },
            required: ['type', 'properties']
          },
          returns: {
            type: 'string',
            description: 'Optional description of what the function returns'
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of dependencies (e.g., Python packages)'
          },
          timeout: {
            type: 'number',
            description: 'Optional timeout in milliseconds (max 300000ms = 5 minutes)',
            minimum: 1,
            maximum: 300000
          }
        },
        required: ['name', 'description', 'language', 'code', 'parameters']
      }
    });

    // Add remove_tool function
    tools.push({
      name: 'remove_tool',
      description: 'Remove a custom tool/function from the server',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the tool to remove'
          }
        },
        required: ['name']
      }
    });

    // Add list_tools function
    tools.push({
      name: 'list_tools',
      description: 'List all available custom tools',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    });

    return tools;
  }

  async handleToolCall(request: any): Promise<any> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'add_tool': {
        const spec = args as unknown as FunctionSpecification;
        const result = await this.addTool(spec);
        return {
          success: true,
          tool: {
            name: result.name,
            description: result.description,
            language: result.language,
            id: result.id
          }
        };
      }

      case 'remove_tool': {
        const { name: toolName } = args as { name: string };
        const success = await this.removeTool(toolName);
        return {
          success,
          message: success ? `Tool "${toolName}" removed successfully` : `Tool "${toolName}" not found`
        };
      }

      case 'list_tools': {
        const tools = Array.from(this.registeredTools.values()).map(func => ({
          name: func.name,
          description: func.description,
          language: func.language,
          id: func.id,
          createdAt: func.createdAt
        }));
        return { tools };
      }

      default: {
        // Execute custom tool
        const result = await this.executeTool(name, args);
        if (!result.success) {
          throw new Error(result.error || 'Execution failed');
        }
        return result.output;
      }
    }
  }

  private async registerTool(func: StoredFunction, notify: boolean = true): Promise<void> {
    this.registeredTools.set(func.name, func);

    if (notify) {
      // Notify clients about the change
      try {
        this.server.notification({
          method: 'tools/listChanged'
        });
      } catch (error) {
        // Ignore notification errors (e.g., when server is not connected)
        console.error('Failed to send tools/listChanged notification:', error);
      }
    }
  }
}