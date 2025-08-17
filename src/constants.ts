/**
 * Timeout constants for function execution
 */
export const TIMEOUTS = {
  /** Default timeout for function execution (30 seconds) */
  DEFAULT_EXECUTION: 30000,
  
  /** Maximum allowed timeout (5 minutes) */
  MAX_EXECUTION: 300000,
  
  /** Minimum allowed timeout (1 second) */
  MIN_EXECUTION: 1000,
  
  /** Timeout for validation operations (10 seconds) */
  VALIDATION: 10000,
} as const;

/**
 * File size limits
 */
export const FILE_LIMITS = {
  /** Maximum file size for code files (1MB) */
  MAX_CODE_SIZE: 1024 * 1024,
  
  /** Maximum output size before truncation (100KB) */
  MAX_OUTPUT_SIZE: 100 * 1024,
} as const;

/**
 * Process limits
 */
export const PROCESS_LIMITS = {
  /** Maximum concurrent function executions */
  MAX_CONCURRENT: 10,
  
  /** Process cleanup delay in milliseconds */
  CLEANUP_DELAY: 100,
} as const;