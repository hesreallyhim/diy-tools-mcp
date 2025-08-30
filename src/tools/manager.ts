import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  FunctionSpecification,
  StoredFunction,
  RegistrationError,
  ExecutionResult,
  FunctionArgs,
} from '../types/index.js';
import { CodeValidationError } from '../utils/errors.js';
import { JSONSchema7 } from 'json-schema';
import { FunctionStorage } from '../storage/functions.js';
import { FunctionValidator } from './validator.js';
import { FunctionExecutor } from './executor.js';
import { SecurityValidator } from '../utils/security.js';
import { TIMEOUTS } from '../constants.js';
import {
  logger,
  logToolRegistration,
  logFunctionExecution,
  createCorrelationId,
} from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

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
        logger.error(`Failed to register tool ${func.name}:`, error);
      }
    }
  }

  async addTool(spec: FunctionSpecification): Promise<StoredFunction> {
    try {
      // Validate mutual exclusivity
      if (spec.code && spec.codePath) {
        throw new RegistrationError('Cannot specify both code and codePath');
      }

      if (!spec.code && !spec.codePath) {
        throw new RegistrationError('Must specify either code or codePath');
      }

      // Validate file path if provided using enhanced security validation
      if (spec.codePath) {
        await SecurityValidator.validateFilePath(spec.codePath, spec.language);
      }

      // Validate the function specification
      await this.validator.validate(spec);

      // Check if tool already exists
      if (this.registeredTools.has(spec.name)) {
        throw new RegistrationError(`Tool with name "${spec.name}" already exists`);
      }

      // Save to storage (handles file copying)
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
        method: 'tools/listChanged',
      });
    } catch (error) {
      // Ignore notification errors (e.g., when server is not connected)
      logger.error('Failed to send tools/listChanged notification:', error);
    }

    return true;
  }

  async executeTool(
    name: string,
    args: FunctionArgs,
    correlationId?: string
  ): Promise<ExecutionResult> {
    const tool = this.registeredTools.get(name);
    if (!tool) {
      const error = `Tool "${name}" not found`;
      logger.warn(error, { tool: name, correlationId });
      throw new NotFoundError(error, name);
    }

    const startTime = Date.now();
    logger.debug(`Executing tool: ${name}`, { tool: name, correlationId });

    try {
      const result = await this.executor.execute(tool, args);
      const duration = Date.now() - startTime;

      logFunctionExecution(name, duration, !result.isError, undefined, correlationId);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logFunctionExecution(name, duration, false, error as Error, correlationId);
      throw error;
    }
  }

  getTools(): Array<{ name: string; description: string; inputSchema: JSONSchema7 }> {
    const tools = Array.from(this.registeredTools.values()).map((func) => ({
      name: func.name,
      description: func.description,
      inputSchema: func.parameters,
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
            pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
          },
          description: {
            type: 'string',
            description: 'A description of what the tool does',
          },
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'typescript', 'bash', 'ruby', 'node'],
            description: 'The programming language the function is written in',
          },
          code: {
            type: 'string',
            description:
              'The function code (inline). Must define a function named "main". Mutually exclusive with codePath',
          },
          codePath: {
            type: 'string',
            description: 'Path to file containing the function code. Mutually exclusive with code',
          },
          parameters: {
            type: 'object',
            description: 'JSON Schema defining the input parameters for the function',
            properties: {
              type: { type: 'string', const: 'object' },
              properties: { type: 'object' },
              required: { type: 'array', items: { type: 'string' } },
            },
            required: ['type', 'properties'],
          },
          returns: {
            type: 'string',
            description: 'Optional description of what the function returns',
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of dependencies (e.g., Python packages)',
          },
          timeout: {
            type: 'number',
            description: `Optional timeout in milliseconds (max ${TIMEOUTS.MAX_EXECUTION}ms = ${TIMEOUTS.MAX_EXECUTION / 1000 / 60} minutes)`,
            minimum: TIMEOUTS.MIN_EXECUTION,
            maximum: TIMEOUTS.MAX_EXECUTION,
          },
        },
        required: ['name', 'description', 'language', 'parameters'],
        oneOf: [{ required: ['code'] }, { required: ['codePath'] }],
      },
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
            description: 'The name of the tool to remove',
          },
        },
        required: ['name'],
      },
    });

    // Add list_tools function
    tools.push({
      name: 'list_tools',
      description: 'List all available custom tools',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    // Add view_source tool
    tools.push({
      name: 'view_source',
      description: 'View the source code of a registered custom tool',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the tool to view',
          },
          verbose: {
            type: 'boolean',
            description: 'Include full metadata in addition to source code',
            default: false,
          },
        },
        required: ['name'],
      },
    });

    return tools;
  }

  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args = {} } = request.params;
    const correlationId = createCorrelationId();

    switch (name) {
      case 'add_tool': {
        const spec = args as unknown as FunctionSpecification;
        logger.debug(`Adding tool: ${spec.name}`, {
          correlationId: correlationId,
          language: spec.language,
        });

        try {
          const result = await this.addTool(spec);
          logToolRegistration(result.name, result.language, !!result.codePath, correlationId);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  tool: {
                    name: result.name,
                    description: result.description,
                    language: result.language,
                    id: result.id,
                  },
                }),
              },
            ],
          };
        } catch (error) {
          logger.error(`Failed to add tool: ${spec.name}`, {
            correlationId: correlationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Code validation errors should be returned as tool errors
          if (error instanceof CodeValidationError) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: error.message,
                },
              ],
              isError: true,
            };
          }

          // All other errors (RegistrationError, ValidationError, etc.) are MCP protocol errors
          throw error;
        }
      }

      case 'remove_tool': {
        const { name: toolName } = args as { name: string };
        const success = await this.removeTool(toolName);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success,
                message: success
                  ? `Tool "${toolName}" removed successfully`
                  : `Tool "${toolName}" not found`,
              }),
            },
          ],
        };
      }

      case 'list_tools': {
        const tools = Array.from(this.registeredTools.values()).map((func) => ({
          name: func.name,
          description: func.description,
          language: func.language,
          id: func.id,
          createdAt: func.createdAt,
        }));
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ tools }),
            },
          ],
        };
      }

      case 'view_source': {
        const { name: toolName, verbose = false } = args as { name: string; verbose?: boolean };
        const tool = this.registeredTools.get(toolName);

        if (!tool) {
          throw new NotFoundError(`Tool "${toolName}" not found`, toolName);
        }

        // Load the source code
        const sourceCode = await this.storage.loadFunctionCode(tool);

        if (verbose) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  tool: {
                    name: tool.name,
                    description: tool.description,
                    language: tool.language,
                    parameters: tool.parameters,
                    returns: tool.returns,
                    dependencies: tool.dependencies,
                    timeout: tool.timeout,
                    isFileBased: !!tool.codePath,
                    codePath: tool.codePath,
                    createdAt: tool.createdAt,
                    updatedAt: tool.updatedAt,
                    sourceCode,
                  },
                }),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  name: tool.name,
                  language: tool.language,
                  sourceCode,
                }),
              },
            ],
          };
        }
      }

      default: {
        // Execute custom tool
        const result = await this.executeTool(name, args, correlationId);

        // If the tool execution failed, return with isError flag
        if (result.isError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: result.error || 'Tool execution failed',
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result.output),
            },
          ],
        };
      }
    }
  }

  private async registerTool(func: StoredFunction, notify: boolean = true): Promise<void> {
    this.registeredTools.set(func.name, func);

    if (notify) {
      // Notify clients about the change
      try {
        this.server.notification({
          method: 'tools/listChanged',
        });
      } catch (error) {
        // Ignore notification errors (e.g., when server is not connected)
        logger.error('Failed to send tools/listChanged notification:', error);
      }
    }
  }
}
