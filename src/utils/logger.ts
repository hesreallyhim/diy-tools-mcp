import winston from 'winston';
import { randomUUID } from 'crypto';

// Get configuration from environment variables
const logLevel = process.env.LOG_LEVEL || 'info';
const debugMode = process.env.DEBUG === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let output = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }
    return output;
  })
);

// Create the logger instance
export const logger = winston.createLogger({
  level: debugMode ? 'debug' : logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'diy-tools-mcp' },
  transports: [
    new winston.transports.Console({
      format: isProduction ? winston.format.json() : consoleFormat,
    }),
  ],
});

// Add file transport in production
if (isProduction) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Create a correlation ID for request tracing
 */
export function createCorrelationId(): string {
  return randomUUID();
}

/**
 * Log function execution with timing and result
 */
export function logFunctionExecution(
  functionName: string,
  duration: number,
  success: boolean,
  error?: Error,
  correlationId?: string
): void {
  const logData = {
    function: functionName,
    duration: `${duration}ms`,
    success,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  if (success) {
    logger.info(`Function executed: ${functionName}`, logData);
  } else {
    logger.error(`Function failed: ${functionName}`, {
      ...logData,
      error: error?.message,
      stack: debugMode ? error?.stack : undefined,
    });
  }
}

/**
 * Log tool registration
 */
export function logToolRegistration(
  toolName: string,
  language: string,
  isFileBased: boolean,
  correlationId?: string
): void {
  logger.info(`Tool registered: ${toolName}`, {
    tool: toolName,
    language,
    isFileBased,
    correlationId,
  });
}

/**
 * Log security violation attempts
 */
export function logSecurityViolation(
  violation: string,
  details: any,
  correlationId?: string
): void {
  logger.warn(`Security violation: ${violation}`, {
    violation,
    details,
    correlationId,
  });
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data: any): any {
  if (!data) return data;

  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'credential',
  ];

  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    }
    return sanitized;
  }

  return data;
}

// Log startup message
logger.info('DIY Tools MCP Server logger initialized', {
  logLevel: logger.level,
  debugMode,
  isProduction,
});