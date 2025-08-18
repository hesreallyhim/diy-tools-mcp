/**
 * Custom error classes for DIY Tools MCP Server
 */

/**
 * Base error class for all DIY Tools errors
 */
export class DIYToolsError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'DIYToolsError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.DEBUG === 'true' ? this.stack : undefined,
    };
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DIYToolsError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when function execution fails
 */
export class ExecutionError extends DIYToolsError {
  constructor(message: string, details?: any) {
    super(message, 'EXECUTION_ERROR', 500, details);
    this.name = 'ExecutionError';
  }
}

/**
 * Error thrown when function execution times out
 */
export class TimeoutError extends DIYToolsError {
  constructor(message: string, timeout: number) {
    super(message, 'TIMEOUT_ERROR', 504, { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends DIYToolsError {
  constructor(message: string, resource?: string) {
    super(message, 'NOT_FOUND', 404, { resource });
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when security validation fails
 */
export class SecurityError extends DIYToolsError {
  constructor(message: string, violation?: string) {
    super(message, 'SECURITY_ERROR', 403, { violation });
    this.name = 'SecurityError';
  }
}

/**
 * Error thrown when registration fails
 */
export class RegistrationError extends DIYToolsError {
  constructor(message: string, toolName?: string) {
    super(message, 'REGISTRATION_ERROR', 400, { toolName });
    this.name = 'RegistrationError';
  }
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends DIYToolsError {
  constructor(message: string, operation?: string) {
    super(message, 'STORAGE_ERROR', 500, { operation });
    this.name = 'StorageError';
  }
}

/**
 * Format error message with context
 */
export function formatErrorMessage(
  operation: string,
  error: Error | unknown,
  context?: any
): string {
  if (error instanceof Error) {
    return `${operation} failed: ${error.message}${
      context ? ` (context: ${JSON.stringify(context)})` : ''
    }`;
  }
  return `${operation} failed: ${String(error)}${
    context ? ` (context: ${JSON.stringify(context)})` : ''
  }`;
}

/**
 * Check if error is a DIY Tools error
 */
export function isDIYToolsError(error: unknown): error is DIYToolsError {
  return error instanceof DIYToolsError;
}

/**
 * Create user-friendly error messages
 */
export function getUserFriendlyMessage(error: Error | DIYToolsError): string {
  if (error instanceof ValidationError) {
    return `Validation failed: ${error.message}. Please check your input and try again.`;
  }
  if (error instanceof TimeoutError) {
    return `Operation timed out after ${error.details?.timeout}ms. Try reducing the complexity or increasing the timeout.`;
  }
  if (error instanceof NotFoundError) {
    return `${error.details?.resource || 'Resource'} not found: ${error.message}`;
  }
  if (error instanceof SecurityError) {
    return `Security violation: ${error.message}. This operation is not allowed.`;
  }
  if (error instanceof ExecutionError) {
    return `Execution failed: ${error.message}. Check the function code and try again.`;
  }
  if (error instanceof RegistrationError) {
    return `Registration failed: ${error.message}. Ensure the function specification is correct.`;
  }
  if (error instanceof StorageError) {
    return `Storage operation failed: ${error.message}. The server may be experiencing issues.`;
  }
  if (error instanceof DIYToolsError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again or contact support.';
}