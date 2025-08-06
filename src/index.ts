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

// Export new architecture components
export {
  EventManager,
  eventManager,
} from './utils/eventManager';

export {
  JsonSchemaFakerStrategy,
  EmptyObjectStrategy,
  CustomDataStrategy,
  MemoryCacheStrategy,
  NoCacheStrategy,
  RetryStrategy,
  FallbackStrategy,
  LogAndContinueStrategy,
  AbortStrategy,
} from './utils/strategies';

export {
  NockRepositoryFactory,
  RepositoryConfigBuilder,
} from './utils/factory';

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

// Export debugging
export {
  NocchinoDebugger,
  DebugLevel,
  DebugCategory,
  nocchinoDebugger,
  debugRequest,
  debugSpecification,
  debugEndpoint,
  debugError,
  debugPerformance,
} from './utils/debugger';

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
  // New architecture types
  NockEventListener,
  MockGenerationStrategy,
  CachingStrategy,
  ErrorRecoveryStrategy,
  INockRepository,
  IEventManager,
  IMockGenerationStrategy,
  ICachingStrategy,
  IErrorRecoveryStrategy,
  RepositoryConfig,
  MockResponse,
} from './types';

// Export error handling types
export type {
  ErrorContext,
} from './utils/errorHandler';

// Export debugging types
export type {
  PerformanceMetrics,
  DebugSession,
  DebugLog,
  DebugConfig,
  RequestTracker,
} from './utils/debugger';

// Export version information
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Dynamic OpenAPI-based Nock Repository for Node.js Testing';
