import { JSONSchema7 } from 'json-schema';

export interface FunctionSpecification {
  name: string;
  description: string;
  language: SupportedLanguage;
  code?: string;              // Now optional - for inline code
  codePath?: string;          // New field - path to code file
  entryPoint?: string;        // Optional entry point function name (defaults to 'main')
  parameters: JSONSchema7;
  returns?: string;
  dependencies?: string[];
  timeout?: number; // in milliseconds
}

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'bash' | 'ruby' | 'node';

// Type guards for function types
export function isFileBasedFunction(spec: FunctionSpecification): boolean {
  return !!spec.codePath && !spec.code;
}

export function isInlineFunction(spec: FunctionSpecification): boolean {
  return !!spec.code && !spec.codePath;
}

export interface StoredFunction extends FunctionSpecification {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// Type for function arguments - can be any JSON-serializable value
export type FunctionArgs = Record<string, unknown>;

export interface LanguageExecutor {
  validate(code: string, entryPoint?: string): Promise<ValidationResult>;
  execute(code: string, args: FunctionArgs, entryPoint?: string): Promise<ExecutionResult>;
  executeFile?(filepath: string, args: FunctionArgs, entryPoint?: string): Promise<ExecutionResult>;
  getFileExtension(): string;
}

export class ToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ValidationError extends ToolError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class ExecutionError extends ToolError {
  constructor(message: string) {
    super(message, 'EXECUTION_ERROR');
  }
}

export class RegistrationError extends ToolError {
  constructor(message: string) {
    super(message, 'REGISTRATION_ERROR');
  }
}