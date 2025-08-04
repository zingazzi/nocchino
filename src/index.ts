/**
 * Nocchino - Dynamic OpenAPI-based Nock Repository
 *
 * Main entry point for the Nocchino library.
 * Exports all public APIs and types for external use.
 */

// Export main functionality
export {
  configure,
  activateNockForRequest,
  restoreNock,
  getState,
  repository,
  DynamicNockRepository,
} from './utils/dynamicNock';

// Export error handling
export {
  ErrorHandler,
  ErrorCode,
  ErrorSeverity,
  ErrorCategory,
  errorHandler,
  createSpecNotFoundError,
  createEndpointMismatchError,
  createMockGenerationError,
  createValidationError,
} from './utils/errorHandler';

// Export types
export type {
  OpenAPISpec,
  OpenAPIInfo,
  OpenAPIContact,
  OpenAPIServer,
  OpenAPIPathItem,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIMediaType,
  OpenAPIResponse,
  OpenAPIComponents,
  OpenAPISchema,
  NocchinoConfig,
  SpecMap,
  RequestDetails,
  MockResponseOptions,
  RepositoryState,
  NocchinoError,
  HTTPMethod,
  HTTPStatusCode,
} from './types';

// Export error handling types
export type {
  ErrorContext,
} from './utils/errorHandler';

// Export version information
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Dynamic OpenAPI-based Nock Repository for Node.js Testing';
