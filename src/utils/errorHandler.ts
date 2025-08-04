/**
 * Comprehensive Error Handling System for Nocchino
 *
 * This module provides structured error handling with:
 * - Typed error codes
 * - Context information
 * - Error categorization
 * - Debug information
 * - Error recovery strategies
 */

import type { RequestDetails, NocchinoEndpoint, OpenAPISpec } from '../types';

// Error Codes Enum
export enum ErrorCode {
  // Configuration Errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_ENDPOINTS = 'MISSING_ENDPOINTS',
  INVALID_ENDPOINT_CONFIG = 'INVALID_ENDPOINT_CONFIG',

  // Specification Errors
  SPEC_NOT_FOUND = 'SPEC_NOT_FOUND',
  INVALID_SPEC_FORMAT = 'INVALID_SPEC_FORMAT',
  SPEC_LOAD_FAILED = 'SPEC_LOAD_FAILED',
  SPEC_PARSE_FAILED = 'SPEC_PARSE_FAILED',

  // Request/Response Errors
  ENDPOINT_MISMATCH = 'ENDPOINT_MISMATCH',
  PATH_NOT_FOUND = 'PATH_NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  MOCK_GENERATION_FAILED = 'MOCK_GENERATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Nock Errors
  NOCK_SETUP_FAILED = 'NOCK_SETUP_FAILED',
  NOCK_INTERCEPT_FAILED = 'NOCK_INTERCEPT_FAILED',
  NOCK_RESTORE_FAILED = 'NOCK_RESTORE_FAILED',

  // System Errors
  MEMORY_ERROR = 'MEMORY_ERROR',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error Context Interface
export interface ErrorContext {
  requestDetails?: RequestDetails;
  endpoint?: NocchinoEndpoint;
  spec?: OpenAPISpec;
  filePath?: string;
  method?: string;
  url?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalInfo?: Record<string, unknown>;
}

// Enhanced NocchinoError Interface
export interface NocchinoError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  context: ErrorContext;
  recoverable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// Error Categories
export enum ErrorCategory {
  CONFIGURATION = 'CONFIGURATION',
  SPECIFICATION = 'SPECIFICATION',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  SYSTEM = 'SYSTEM'
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: NocchinoError[] = [];
  private maxLogSize = 1000;
  private debugMode = false;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create a structured Nocchino error
   */
  public createError(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true
  ): NocchinoError {
    const error = new Error(message) as NocchinoError;
    error.code = code;
    error.severity = severity;
    error.context = {
      timestamp: new Date(),
      ...context
    };
    error.recoverable = recoverable;
    error.name = 'NocchinoError';

    this.logError(error);
    return error;
  }

  /**
   * Log an error for debugging and monitoring
   */
  private logError(error: NocchinoError): void {
    this.errorLog.push(error);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in debug mode
    if (this.debugMode) {
      console.error(`[Nocchino Error] ${error.code}: ${error.message}`, {
        severity: error.severity,
        context: error.context,
        recoverable: error.recoverable
      });
    }
  }

  /**
   * Enable/disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const error of this.errorLog) {
      const category = this.getErrorCategory(error.code);
      stats[category] = (stats[category] || 0) + 1;
      stats[error.code] = (stats[error.code] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(count: number = 10): NocchinoError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Categorize error by code
   */
  private getErrorCategory(code: ErrorCode): ErrorCategory {
    switch (code) {
      case ErrorCode.INVALID_CONFIG:
      case ErrorCode.MISSING_ENDPOINTS:
      case ErrorCode.INVALID_ENDPOINT_CONFIG:
        return ErrorCategory.CONFIGURATION;

      case ErrorCode.SPEC_NOT_FOUND:
      case ErrorCode.INVALID_SPEC_FORMAT:
      case ErrorCode.SPEC_LOAD_FAILED:
      case ErrorCode.SPEC_PARSE_FAILED:
        return ErrorCategory.SPECIFICATION;

      case ErrorCode.ENDPOINT_MISMATCH:
      case ErrorCode.PATH_NOT_FOUND:
      case ErrorCode.METHOD_NOT_ALLOWED:
        return ErrorCategory.REQUEST;

      case ErrorCode.MOCK_GENERATION_FAILED:
      case ErrorCode.VALIDATION_FAILED:
        return ErrorCategory.RESPONSE;

      case ErrorCode.NOCK_SETUP_FAILED:
      case ErrorCode.NOCK_INTERCEPT_FAILED:
      case ErrorCode.NOCK_RESTORE_FAILED:
      case ErrorCode.MEMORY_ERROR:
      case ErrorCode.PERFORMANCE_ERROR:
      case ErrorCode.UNKNOWN_ERROR:
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  /**
   * Handle errors with recovery strategies
   */
  public handleError(error: NocchinoError): void {
    switch (error.code) {
      case ErrorCode.SPEC_NOT_FOUND:
        this.handleSpecNotFound(error);
        break;

      case ErrorCode.ENDPOINT_MISMATCH:
        this.handleEndpointMismatch(error);
        break;

      case ErrorCode.MOCK_GENERATION_FAILED:
        this.handleMockGenerationFailed(error);
        break;

      case ErrorCode.MEMORY_ERROR:
        this.handleMemoryError(error);
        break;

      default:
        this.handleGenericError(error);
    }
  }

  /**
   * Handle specification not found errors
   */
  private handleSpecNotFound(error: NocchinoError): void {
    if (this.debugMode) {
      console.warn(`[Nocchino Warning] No specification found for request: ${error.context.url}`);
    }
  }

  /**
   * Handle endpoint mismatch errors
   */
  private handleEndpointMismatch(error: NocchinoError): void {
    if (this.debugMode) {
      console.warn(`[Nocchino Warning] Endpoint mismatch for URL: ${error.context.url}`);
    }
  }

  /**
   * Handle mock generation failures
   */
  private handleMockGenerationFailed(_error: NocchinoError): void {
    if (this.debugMode) {
      console.warn(`[Nocchino Warning] Mock generation failed, using fallback response`);
    }
  }

  /**
   * Handle memory errors
   */
  private handleMemoryError(error: NocchinoError): void {
    console.error(`[Nocchino Critical] Memory error detected: ${error.message}`);
    this.clearErrorLog(); // Clear log to free memory
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: NocchinoError): void {
    if (error.severity === ErrorSeverity.CRITICAL) {
      console.error(`[Nocchino Critical] ${error.code}: ${error.message}`);
    } else if (this.debugMode) {
      console.warn(`[Nocchino Warning] ${error.code}: ${error.message}`);
    }
  }

  /**
   * Validate configuration and throw appropriate errors
   */
  public validateConfiguration(endpoints: unknown[]): void {
    if (!Array.isArray(endpoints)) {
      throw this.createError(
        ErrorCode.INVALID_CONFIG,
        'Endpoints must be an array',
        {},
        ErrorSeverity.HIGH,
        false
      );
    }

    if (endpoints.length === 0) {
      throw this.createError(
        ErrorCode.MISSING_ENDPOINTS,
        'At least one endpoint must be configured',
        {},
        ErrorSeverity.HIGH,
        false
      );
    }

    for (const endpoint of endpoints) {
      this.validateEndpoint(endpoint);
    }
  }

  /**
   * Validate individual endpoint configuration
   */
  private validateEndpoint(endpoint: unknown): void {
    if (!endpoint || typeof endpoint !== 'object') {
      throw this.createError(
        ErrorCode.INVALID_ENDPOINT_CONFIG,
        'Endpoint must be an object',
        { additionalInfo: { endpoint } },
        ErrorSeverity.HIGH,
        false,
      );
    }

    const endpointObj = endpoint as Record<string, unknown>;

    if (!endpointObj['baseUrl'] || typeof endpointObj['baseUrl'] !== 'string') {
      throw this.createError(
        ErrorCode.INVALID_ENDPOINT_CONFIG,
        'Endpoint must have a valid baseUrl string',
        { additionalInfo: { endpoint } },
        ErrorSeverity.HIGH,
        false,
      );
    }

    if (!endpointObj['specs'] || !Array.isArray(endpointObj['specs'])) {
      throw this.createError(
        ErrorCode.INVALID_ENDPOINT_CONFIG,
        'Endpoint must have a specs array',
        { additionalInfo: { endpoint } },
        ErrorSeverity.HIGH,
        false,
      );
    }
  }
}

// Convenience functions for common error scenarios
export const createSpecNotFoundError = (
  url: string,
  context: Partial<ErrorContext> = {}
): NocchinoError => {
  const handler = ErrorHandler.getInstance();
  return handler.createError(
    ErrorCode.SPEC_NOT_FOUND,
    `No OpenAPI specification found for URL: ${url}`,
    { url, ...context },
    ErrorSeverity.LOW,
    true
  );
};

export const createEndpointMismatchError = (
  url: string,
  availableEndpoints: string[],
  context: Partial<ErrorContext> = {}
): NocchinoError => {
  const handler = ErrorHandler.getInstance();
  return handler.createError(
    ErrorCode.ENDPOINT_MISMATCH,
    `No matching endpoint found for URL: ${url}. Available endpoints: ${availableEndpoints.join(', ')}`,
    { url, additionalInfo: { availableEndpoints }, ...context },
    ErrorSeverity.MEDIUM,
    true
  );
};

export const createMockGenerationError = (
  message: string,
  context: Partial<ErrorContext> = {}
): NocchinoError => {
  const handler = ErrorHandler.getInstance();
  return handler.createError(
    ErrorCode.MOCK_GENERATION_FAILED,
    `Mock generation failed: ${message}`,
    context,
    ErrorSeverity.MEDIUM,
    true
  );
};

export const createValidationError = (
  message: string,
  context: Partial<ErrorContext> = {}
): NocchinoError => {
  const handler = ErrorHandler.getInstance();
  return handler.createError(
    ErrorCode.VALIDATION_FAILED,
    `Validation failed: ${message}`,
    context,
    ErrorSeverity.MEDIUM,
    true
  );
};

// Export the error handler instance
export const errorHandler = ErrorHandler.getInstance();
