/**
 * Nocchino - Dynamic OpenAPI-based Nock Repository for Node.js Testing
 * 
 * A comprehensive testing library that provides dynamic HTTP request mocking
 * based on OpenAPI specifications with advanced caching, error handling,
 * and debugging capabilities.
 * 
 * @version 1.1.0
 * @license MIT
 */

// Re-export everything from the main source
export * from './src';

// Export version information
export const VERSION = '1.1.0';
export const DESCRIPTION = 'Dynamic OpenAPI-based Nock Repository for Node.js Testing';

// Export main entry points for easy access
export {
  // Core functionality
  initialize,
  activateNockForRequest,
  deactivateNockForRequest,
  getState,
  configure,
  
  // Repository factory
  NockRepositoryFactory,
  RepositoryConfigBuilder,
  
  // Error handling
  ErrorHandler,
  ErrorCode,
  ErrorSeverity,
  ErrorCategory,
  errorHandler,
  createSpecNotFoundError,
  createEndpointMismatchError,
  createMockGenerationError,
  createValidationError,
  
  // Debugging
  NocchinoDebugger,
  DebugLevel,
  DebugCategory,
  nocchinoDebugger,
  debugRequest,
  debugSpecification,
  debugEndpoint,
  debugError,
  debugPerformance,
  
  // Cache system
  EnhancedMemoryCacheStrategy,
  TieredCacheStrategy,
  RedisLikeCacheStrategy,
  CacheManager,
  cacheManager,
  
  // Strategy patterns
  JsonSchemaFakerStrategy,
  EmptyObjectStrategy,
  CustomDataStrategy,
  MemoryCacheStrategy,
  NoCacheStrategy,
  RetryStrategy,
  FallbackStrategy,
  LogAndContinueStrategy,
  AbortStrategy,
  
  // Event management
  EventManager,
  NockEventListener,
  
  // Types
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
  CacheEvent,
  CacheStatistics,
  CacheEntry,
} from './src';

// Default export for convenience
import { initialize, configure, getState } from './src';

const Nocchino = {
  initialize,
  configure,
  getState,
  VERSION,
  DESCRIPTION,
};

export default Nocchino; 