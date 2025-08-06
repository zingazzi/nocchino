# Nocchino 🎯

**Multi-Endpoint OpenAPI-based Nock Repository for Node.js Testing**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nock](https://img.shields.io/badge/Nock-13.5.4+-orange.svg)](https://github.com/nock/nock)

Nocchino is a powerful and flexible multi-endpoint mocking solution for Node.js applications that leverages OpenAPI specifications to create mock responses. It eliminates the need for manual Nock intercepts in test files, providing a centralized, maintainable, and scalable testing environment for multiple APIs.

## 🚀 Features

- **Multi-Endpoint Support**: Test against multiple APIs simultaneously
- **OpenAPI-Based Mocking**: Uses actual OpenAPI specifications only (no preset schemas)
- **Smart Path Matching**: Automatic endpoint and specification matching
- **Version Prefix Handling**: Supports `/v1/`, `/v2/` prefixes in URLs
- **Type Safety**: Built-in TypeScript support with full type definitions
- **Flexible Configuration**: Easy setup with customizable endpoint mapping
- **Advanced Error Handling**: Structured error management with recovery strategies
- **Comprehensive Debugging**: Multi-level logging, performance monitoring, and request tracking
- **Enterprise Cache System**: Multi-strategy caching with LRU, tiered, and Redis-like implementations
- **Design Patterns**: Observer, Strategy, and Dependency Injection patterns for extensibility
- **Performance Monitoring**: Real-time statistics and event-driven monitoring
- **Factory & Builder Patterns**: Easy configuration with predefined and custom setups

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Type Definitions](#type-definitions)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

```bash
# Clone the repository
git clone https://github.com/zingazzi/nocchino.git
cd nocchino

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify installation
npm test
```

### Dependencies

- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.3.0 or higher
- **Nock**: HTTP request mocking
- **js-yaml**: OpenAPI YAML parsing
- **Axios**: HTTP client for testing
- **Lodash**: Utility functions

## 🚀 Quick Start

### 1. Basic Setup (Single Endpoint)

```typescript
import { configure, activateNockForRequest, restoreNock } from 'nocchino'

// Configure Nocchino for a single endpoint
configure({
  endpoints: [
    {
      baseUrl: 'https://api.example.com',
      specs: ['specs/api-v1', 'specs/api-v2/users-api-v2.yml'],
    },
  ],
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1',
      v2: 'specs/api-v2',
    },
  },
})
```

### 2. Multi-Endpoint Setup with Factory Pattern

```typescript
import { NockRepositoryFactory, activateNockForRequest, restoreNock } from 'nocchino'

// Use factory pattern for easy configuration
const basicRepo = NockRepositoryFactory.createBasic()
const perfRepo = NockRepositoryFactory.createPerformanceOptimized()
const debugRepo = NockRepositoryFactory.createDebugOptimized()

// Or use builder pattern for custom configuration
const customRepo = new RepositoryConfigBuilder()
  .withCachingStrategy(new EnhancedMemoryCacheStrategy(1000))
  .withDebugging(true)
  .withPerformanceMonitoring(true)
  .buildRepository()
```

### 3. Advanced Setup with Cache System

```typescript
import {
  NockRepositoryFactory,
  EnhancedMemoryCacheStrategy,
  TieredCacheStrategy,
  activateNockForRequest,
  restoreNock
} from 'nocchino'

// Production setup with Redis-like cache
const prodRepo = NockRepositoryFactory.createForProduction()

// High-performance setup with tiered cache
const perfRepo = NockRepositoryFactory.createPerformanceOptimized()

// Custom setup with enhanced memory cache
const customRepo = NockRepositoryFactory.createWithCustomStrategies({
  cachingStrategy: new EnhancedMemoryCacheStrategy(2000, true)
})
```

### 2. Create OpenAPI Specifications

Place your OpenAPI YAML files in the `specs/` directory:

```
specs/
├── api-v1/
│   ├── users-api.yml
│   └── products-api.yml
└── api-v2/
    └── users-api-v2.yml
```

### 3. Write Tests

```typescript
import { initialize, activateNockForRequest, restoreNock } from 'nocchino'

// Configure multiple endpoints for different APIs
const endpoints = [
  {
    baseUrl: 'https://api.example.com',
    specs: [
      'specs/api-v1', // Folder containing OpenAPI specs
      'specs/api-v2/users-api-v2.yml', // Single file
    ],
  },
  {
    baseUrl: 'https://api.example2.com',
    specs: [
      'specs/api-v2', // Another folder
      'specs/api-v1/products-api.yml', // Another single file
    ],
  },
]

// Initialize with multiple endpoints
initialize(endpoints)
```

### 3. Testing Different Endpoints

```typescript
import { activateNockForRequest, restoreNock } from 'nocchino'
import axios from 'axios'

describe('Multi-Endpoint Testing', () => {
  beforeEach(() => {
    // Configure multiple endpoints
    const endpoints = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1', 'specs/api-v2'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['specs/api-v2', 'specs/api-v1/products-api.yml'],
      },
    ]
    initialize(endpoints)
  })

  afterEach(() => {
    restoreNock()
  })

  test('should handle requests to different endpoints', async () => {
    // Request to first endpoint
    activateNockForRequest({
      url: 'https://api.example.com/v1/users/123',
      method: 'GET',
    })

    // Request to second endpoint
    activateNockForRequest({
      url: 'https://api.example2.com/v2/products/456',
      method: 'POST',
      body: { name: 'Test Product' },
    })

    // Both requests will be handled by their respective OpenAPI specs
    const userResponse = await axios.get('https://api.example.com/v1/users/123')
    const productResponse = await axios.post('https://api.example2.com/v2/products/456', {
      name: 'Test Product',
    })

    expect(userResponse.status).toBe(200)
    expect(productResponse.status).toBe(201)
  })
})
```

## ⚙️ Configuration

### Basic Configuration

```typescript
import { NocchinoConfig, NocchinoEndpoint } from 'nocchino'

const config: NocchinoConfig = {
  // Multiple endpoints with their respective OpenAPI specifications
  endpoints: [
    {
      baseUrl: 'https://api.example.com',
      specs: [
        'specs/api-v1', // Folder containing multiple OpenAPI specs
        'specs/api-v2/users-api-v2.yml', // Single file
      ],
    },
    {
      baseUrl: 'https://api.example2.com',
      specs: [
        'specs/api-v2', // Another folder
        'specs/api-v1/products-api.yml', // Another single file
      ],
    },
  ],

  // Header-based mapping for different API versions/environments
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1',
      v2: 'specs/api-v2',
    },
    'X-Environment': {
      staging: 'specs/api-v1',
      production: 'specs/api-v2',
    },
  },
}

configure(config)
```

### Advanced Configuration

```typescript
import { initialize } from 'nocchino'

// More complex multi-endpoint setup
const endpoints = [
  {
    baseUrl: 'https://api.example.com',
    specs: [
      'specs/api-v1',
      'specs/api-v2',
      'specs/shared/common-schemas.yml',
    ],
  },
  {
    baseUrl: 'https://api.example2.com',
    specs: [
      'specs/api-v2',
      'specs/api-v1/products-api.yml',
    ],
  },
  {
    baseUrl: 'https://api.example3.com',
    specs: [
      'specs/api-v3',
      'specs/shared/common-schemas.yml',
    ],
  },
]

initialize(endpoints)
```

## 📚 Usage Examples

### Multi-Endpoint Testing with Cache System

```typescript
import { NockRepositoryFactory, activateNockForRequest, restoreNock } from 'nocchino'
import axios from 'axios'

describe('Multi-Endpoint Testing with Cache', () => {
  beforeEach(() => {
    // Use factory pattern for easy setup
    const repo = NockRepositoryFactory.createPerformanceOptimized()

    // Configure multiple endpoints
    const endpoints = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1', 'specs/api-v2'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['specs/api-v2', 'specs/api-v1/products-api.yml'],
      },
    ]
    repo.initialize(endpoints)
  })

  afterEach(() => {
    restoreNock()
  })

  describe('User API (api.example.com)', () => {
    test('should create user with v1 API', async () => {
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'POST',
      })
      // Test implementation
    })

    test('should create user with v2 API', async () => {
      activateNockForRequest({
        url: 'https://api.example.com/v2/users',
        method: 'POST',
      })
      // Test implementation
    })
  })

  describe('Product API (api.example2.com)', () => {
    test('should create product', async () => {
      activateNockForRequest({
        url: 'https://api.example2.com/v2/products',
        method: 'POST',
      })
      // Test implementation
    })
  })
})
```

### Cache System Usage

```typescript
import {
  EnhancedMemoryCacheStrategy,
  TieredCacheStrategy,
  CacheManager,
  cacheManager
} from 'nocchino'

// Enhanced memory cache with event monitoring
const cache = new EnhancedMemoryCacheStrategy(1000, true)

// Add event listener for monitoring
cache.addEventListener((event) => {
  console.log(`Cache ${event.type}: ${event.key}`)
})

// Set cache entries with TTL
cache.set('user:123', { id: 123, name: 'John' }, 300000) // 5 minutes

// Get cache statistics
const stats = cache.getStatistics()
console.log(`Hit rate: ${stats.hitRate}%`)

// Tiered cache for high-performance scenarios
const tieredCache = new TieredCacheStrategy(100, 1000)
tieredCache.set('session:user:123', sessionData, 60000)

// Cache manager for strategy management
cacheManager.registerStrategy('custom', new EnhancedMemoryCacheStrategy(500))
cacheManager.setDefaultStrategy('memory')
```

### Multi-Endpoint Testing

```typescript
import { initialize, activateNockForRequest, restoreNock } from 'nocchino'
import axios from 'axios'

describe('Multi-Endpoint Testing', () => {
  beforeEach(() => {
    // Configure multiple endpoints
    const endpoints = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1', 'specs/api-v2'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['specs/api-v2', 'specs/api-v1/products-api.yml'],
      },
    ]
    initialize(endpoints)
  })

  afterEach(() => {
    restoreNock()
  })

  test('should handle requests to different endpoints', async () => {
    // Request to first endpoint
    activateNockForRequest({
      url: 'https://api.example.com/v1/users/123',
      method: 'GET',
    })

    // Request to second endpoint
    activateNockForRequest({
      url: 'https://api.example2.com/v2/products/456',
      method: 'POST',
      body: { name: 'Test Product' },
    })

    // Both requests will be handled by their respective OpenAPI specs
    const userResponse = await axios.get('https://api.example.com/v1/users/123')
    const productResponse = await axios.post('https://api.example2.com/v2/products/456', {
      name: 'Test Product',
    })

    expect(userResponse.status).toBe(200)
    expect(productResponse.status).toBe(201)
  })
})
```

### Environment-based Testing

```typescript
import { configure, activateNockForRequest, restoreNock } from 'nocchino'

describe('Environment-based Testing', () => {
  test('should use staging environment', async () => {
    configure({
      endpoints: [
        {
          baseUrl: 'https://api.example.com',
          specs: ['specs/api-v1', 'specs/api-v2'],
        },
      ],
      specMap: {
        'X-Environment': {
          staging: 'specs/api-v1',
          production: 'specs/api-v2',
        },
      },
    })

    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: { 'X-Environment': 'staging' },
    })

    // Test implementation
  })
})
```

## 🔧 API Reference

### Core Functions

#### `initialize(endpoints: NocchinoEndpoint[]): void`

Initialize the Nocchino repository with multiple endpoints and their specifications.

**Parameters:**

- `endpoints` (NocchinoEndpoint[]): Array of endpoint configurations
  - `baseUrl` (string): Base URL for the endpoint
  - `specs` (string[]): Array of folder paths or file paths containing OpenAPI specifications

#### `configure(config: NocchinoConfig): void`

Configure Nocchino with a single configuration object.

**Parameters:**

- `config` (NocchinoConfig): Configuration object
  - `endpoints` (NocchinoEndpoint[]): Array of endpoint configurations
  - `specMap` (Object): Header-based mapping configuration

#### `activateNockForRequest(requestDetails: RequestDetails): void`

Activate Nock intercepts for a specific request.

**Parameters:**

- `requestDetails` (RequestDetails): Request details object
  - `url` (string): Full request URL
  - `method` (string): HTTP method
  - `headers` (Object, optional): Request headers
  - `body` (any, optional): Request body

#### `restoreNock(): void`

Clean up all active Nock intercepts.

#### `getState(): RepositoryState`

Get the current state of the repository.

**Returns:**

- `RepositoryState`: Current repository state

## 🛠 Error Handling & Debugging

Nocchino provides comprehensive error handling and debugging capabilities to help you troubleshoot and monitor your API mocking setup.

### Error Handling System

The error handling system provides structured error management with recovery strategies:

```typescript
import {
  ErrorHandler,
  ErrorCode,
  ErrorSeverity,
  errorHandler,
  createSpecNotFoundError,
  createEndpointMismatchError,
} from 'nocchino'

// Enable debug mode for detailed error logging
errorHandler.setDebugMode(true)

// Handle specific error types
try {
  activateNockForRequest({
    url: 'https://api.example.com/v1/users',
    method: 'GET',
  })
} catch (error) {
  if (error.code === ErrorCode.SPEC_NOT_FOUND) {
    console.warn('No specification found for request')
  } else if (error.code === ErrorCode.ENDPOINT_MISMATCH) {
    console.warn('No matching endpoint found')
  }
}

// Get error statistics
const stats = errorHandler.getErrorStats()
console.log('Error statistics:', stats)

// Get recent errors
const recentErrors = errorHandler.getRecentErrors(10)
console.log('Recent errors:', recentErrors)
```

### Debugging System

The debugging system provides multi-level logging, performance monitoring, and request tracking:

```typescript
import {
  NocchinoDebugger,
  DebugLevel,
  DebugCategory,
  nocchinoDebugger,
  debugRequest,
  debugSpecification,
  debugEndpoint,
  debugError,
  debugPerformance,
} from 'nocchino'

// Configure debugger
nocchinoDebugger.configure({
  level: DebugLevel.DEBUG,
  categories: [DebugCategory.REQUEST, DebugCategory.ERROR],
  enablePerformanceMonitoring: true,
  enableMemoryMonitoring: true,
  enableRequestTracking: true,
})

// Start a debug session
nocchinoDebugger.startSession()

// Debug request details
debugRequest({
  url: 'https://api.example.com/v1/users',
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
})

// Debug specification loading
debugSpecification({
  title: 'Users API',
  version: '1.0.0',
  paths: 5,
})

// Debug endpoint configuration
debugEndpoint({
  baseUrl: 'https://api.example.com',
  specs: ['specs/api-v1', 'specs/api-v2'],
})

// Debug errors
debugError(new Error('Test error'), { context: 'test' })

// Debug performance
debugPerformance('test operation', { duration: 150 })

// Get performance metrics
const metrics = nocchinoDebugger.getPerformanceMetrics()
console.log('Performance metrics:', metrics)

// Generate debug report
const report = nocchinoDebugger.generateReport()
console.log('Debug report:', report)

// End debug session
nocchinoDebugger.endSession()
```

### Debug Levels

- **NONE**: No logging
- **ERROR**: Only error messages
- **WARN**: Warning and error messages
- **INFO**: Info, warning, and error messages
- **DEBUG**: Debug, info, warning, and error messages
- **TRACE**: All messages including trace

### Debug Categories

- **CONFIGURATION**: Configuration-related logs
- **SPECIFICATION**: OpenAPI specification logs
- **REQUEST**: Request tracking logs
- **RESPONSE**: Response handling logs
- **PERFORMANCE**: Performance monitoring logs
- **MEMORY**: Memory usage logs
- **NOCK**: Nock setup and intercept logs
- **ERROR**: Error handling logs
- **SYSTEM**: System-level logs

## 📝 Type Definitions

### Core Types

```typescript
import {
  NocchinoConfig,
  NocchinoEndpoint,
  RequestDetails,
  RepositoryState,
  HTTPStatusCode,
} from 'nocchino'

// Use these types for better type safety
const endpoints: NocchinoEndpoint[] = [
  {
    baseUrl: 'https://api.example.com',
    specs: ['specs/api-v1', 'specs/api-v2'],
  },
  {
    baseUrl: 'https://api.example2.com',
    specs: ['specs/api-v2'],
  },
]

const config: NocchinoConfig = {
  endpoints,
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1',
      v2: 'specs/api-v2',
    },
  },
}

const requestDetails: RequestDetails = {
  url: 'https://api.example.com/v1/users',
  method: 'GET',
  headers: { 'X-Api-Version': 'v1' },
}
```

## Generic Types Support

Nocchino now supports generic types for type-safe API requests and responses. This provides better TypeScript integration and compile-time type checking.

### Generic RequestDetails

The `RequestDetails` interface now supports generic types for request body and response:

```typescript
interface RequestDetails<TBody = unknown, TResponse = unknown> {
  url: string
  method: string
  headers?: Record<string, string>
  body?: TBody
  expectedResponse?: TResponse
}
```

### Generic API Client

Use the `GenericAPIClient` class for type-safe API requests:

```typescript
import { GenericAPIClient } from 'nocchino'

// Define your types
interface CreateResourceRequest {
  name: string
  description: string
  type: string
  metadata?: Record<string, unknown>
}

interface Resource {
  id: string
  name: string
  description: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

// Create a type-safe API client
const resourceClient = new GenericAPIClient<CreateResourceRequest, Resource>(
  'https://api.example.com'
)

// Type-safe GET request
const resourceResponse = await resourceClient.get<Resource>(
  '/v1/resources/123',
  {
    'X-Api-Version': 'v1',
  }
)

// Type-safe POST request
const createResourceResponse = await resourceClient.post<
  CreateResourceRequest,
  Resource
>(
  '/v1/resources',
  {
    name: 'Example Resource',
    description: 'A generic resource',
    type: 'example',
    metadata: { category: 'demo' },
  },
  {
    'X-Api-Version': 'v1',
  }
)
```

### Specialized API Clients

Create specialized API clients that extend the generic client:

```typescript
export class ResourceAPIClient extends GenericAPIClient<
  CreateResourceRequest,
  Resource
> {
  constructor(baseUrl: string) {
    super(baseUrl, {
      'Content-Type': 'application/json',
      'X-Api-Version': 'v1',
    })
  }

  public async createResource(
    resourceData: CreateResourceRequest
  ): Promise<APIResponse<Resource>> {
    return this.post('/v1/resources', resourceData)
  }

  public async getResourceById(
    resourceId: string
  ): Promise<APIResponse<Resource>> {
    return this.get<Resource>(`/v1/resources/${resourceId}`)
  }
}
```

### Generic Functions

All Nocchino functions now support generic types:

```typescript
import { activateNockForRequest } from 'nocchino'

// Type-safe request activation
const requestDetails: RequestDetails<CreateResourceRequest, Resource> = {
  url: 'https://api.example.com/v1/resources',
  method: 'POST',
  headers: { 'X-Api-Version': 'v1' },
  body: {
    name: 'Example Resource',
    description: 'A generic resource',
    type: 'example',
  },
}

activateNockForRequest(requestDetails)
```

### Configuration

The `endpoints` array is now mandatory and supports multiple endpoints with their respective OpenAPI specifications:

```typescript
import { configure } from 'nocchino'

configure({
  endpoints: [
    {
      baseUrl: 'https://api.example.com',
      specs: ['specs/api-v1', 'specs/api-v2'],
    },
    {
      baseUrl: 'https://api.example2.com',
      specs: ['specs/api-v2', 'specs/api-v1/products-api.yml'],
    },
  ],
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1',
      v2: 'specs/api-v2',
    },
  },
})
```

### HTTP Status Codes

Nocchino includes comprehensive HTTP status code support with all 61 standard codes:

```typescript
// 1xx Informational
100 // Continue
101 // Switching Protocols
102 // Processing
103 // Early Hints

// 2xx Success
200 // OK
201 // Created
202 // Accepted
// ... and many more

// 3xx Redirection
300 // Multiple Choices
301 // Moved Permanently
// ... and many more

// 4xx Client Errors
400 // Bad Request
401 // Unauthorized
// ... and many more

// 5xx Server Errors
500 // Internal Server Error
501 // Not Implemented
// ... and many more
```

## 🏗️ Project Structure

### Folder Organization

```
specs/
├── api-v1/                    # For https://api.example.com
│   ├── users-api.yml
│   └── products-api.yml
├── api-v2/                    # For https://api.example2.com
│   ├── users-api-v2.yml
│   └── products-api-v2.yml
└── shared/                    # Shared across endpoints
    └── common-schemas.yml
```

**Multi-Endpoint Structure:**

```
specs/
├── api-v1/                    # For https://api.example.com
│   ├── users-api.yml
│   └── products-api.yml
├── api-v2/                    # For https://api.example2.com
│   ├── users-api-v2.yml
│   └── products-api-v2.yml
└── shared/                    # Shared across endpoints
    └── common-schemas.yml
```

**Features:**

- **Automatic Loading**: All `.yml`, `.yaml`, and `.json` files in folders are automatically loaded
- **Smart Matching**: The system finds the best matching specification for each request
- **Multiple Endpoints**: Support for multiple API endpoints in the same test suite
- **Flexible Organization**: Organize specs by version, domain, or any structure you prefer
- **Multi-Domain Testing**: Test against different APIs simultaneously (e.g., `api.example.com` and `api.example2.com`)

See `examples/generic-client-example.ts` for a complete demonstration.

## 🏗️ Design Patterns

Nocchino implements several design patterns for maintainability and extensibility:

### 1. Observer Pattern

Event-driven architecture for loose coupling and extensibility:
- **EventManager**: Centralized event management
- **NockEventListener**: Interface for event listeners
- **Event Types**: Request start/complete, error, spec loaded, endpoint configured

### 2. Strategy Pattern

Pluggable behaviors for different use cases:
- **Mock Generation Strategies**: JsonSchemaFaker, EmptyObject, CustomData
- **Caching Strategies**: EnhancedMemory, Tiered, Redis-like, NoCache
- **Error Recovery Strategies**: Retry, Fallback, LogAndContinue, Abort

### 3. Dependency Injection

Flexible configuration and easy testing:
- **Factory Pattern**: Predefined repository configurations
- **Builder Pattern**: Fluent API for complex configurations
- **Repository Configurations**: Basic, Performance, Debug, Testing, Production

### 4. Cache System

Enterprise-grade caching with multiple strategies:
- **Enhanced Memory Cache**: LRU eviction, statistics, events
- **Tiered Cache**: L1 (fast) + L2 (large) caching
- **Redis-like Cache**: Random eviction policy
- **Cache Manager**: Centralized strategy management

### 5. Factory Pattern

Used for creating mock responses and repository configurations.

### 6. Singleton Pattern

Single repository instance manages all Nock state and configuration.

### 7. Template Method Pattern

Standardized flow for request processing: map → load → setup → intercept.

## 🎯 Best Practices

### Test Organization

```typescript
// Good: Organized test structure with multiple endpoints
describe('Multi-Endpoint API Testing', () => {
  beforeEach(() => {
    const endpoints = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1', 'specs/api-v2'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['specs/api-v2'],
      },
    ]
    initialize(endpoints)
  })

  afterEach(() => {
    restoreNock()
  })

  describe('User API (api.example.com)', () => {
    test('should create user with v1 API', async () => {
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'POST',
      })
      // Test implementation
    })

    test('should create user with v2 API', async () => {
      activateNockForRequest({
        url: 'https://api.example.com/v2/users',
        method: 'POST',
      })
      // Test implementation
    })
  })

  describe('Product API (api.example2.com)', () => {
    test('should create product', async () => {
      activateNockForRequest({
        url: 'https://api.example2.com/v2/products',
        method: 'POST',
      })
      // Test implementation
    })
  })
})
```

### Configuration Management

```typescript
// Good: Proper error handling
test('should handle API errors gracefully', async () => {
  try {
    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: { 'X-Api-Version': 'v1' },
    })

    const response = await axios.get('https://api.example.com/v1/users', {
      headers: { 'X-Api-Version': 'v1' },
    })

    expect(response.status).toBe(200)
  } catch (error) {
    console.error(
      'Test failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  }
})
```

### 4. Configuration Management

```typescript
// Good: Centralized configuration with multiple endpoints
const config: NocchinoConfig = {
  endpoints: [
    {
      baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
      specs: ['specs/api-v1', 'specs/api-v2'],
    },
    {
      baseUrl: process.env.API2_BASE_URL || 'https://api.example2.com',
      specs: ['specs/api-v2', 'specs/api-v1/products-api.yml'],
    },
  ],
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1',
      v2: 'specs/api-v2',
    },
  },
}

configure(config)
```

### Error Handling

```typescript
// Good: Proper error handling
try {
  activateNockForRequest({
    url: 'https://api.example.com/v1/users',
    method: 'GET',
  })
} catch (error) {
  console.warn('No matching specification found for request')
  // Handle gracefully
}
```

## 🚀 Development

### Available Scripts

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run example
npm run example

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Technical Highlights

### HTTP Status Code Support

Nocchino includes comprehensive HTTP status code support with all 61 standard codes:

```typescript
// 1xx Informational
100 // Continue
101 // Switching Protocols
102 // Processing
103 // Early Hints

// 2xx Success
200 // OK
201 // Created
202 // Accepted
// ... and many more

// 3xx Redirection
300 // Multiple Choices
301 // Moved Permanently
// ... and many more

// 4xx Client Errors
400 // Bad Request
401 // Unauthorized
// ... and many more

// 5xx Server Errors
500 // Internal Server Error
501 // Not Implemented
// ... and many more
```

### No Preset Schemas

Nocchino operates with **zero preset schemas** and **zero generic mock data generation**:

- **No hardcoded data**: No preset user profiles, entity patterns, or generic responses
- **Clean fallback**: Returns empty objects `{}` when no schema is available
- **Predictable behavior**: Only uses actual OpenAPI specifications
- **No magic**: No automatic data generation based on field names or schema patterns

This ensures a clean, predictable mocking experience without any unexpected hardcoded data.

## 🎯 Key Features Summary

- ✅ **Multi-Endpoint Support**: Test against multiple APIs simultaneously
- ✅ **OpenAPI-Based Mocking**: Uses actual OpenAPI specifications only
- ✅ **No Preset Schemas**: Clean, predictable mocking without hardcoded data
- ✅ **Smart Path Matching**: Automatic endpoint and specification matching
- ✅ **Version Prefix Handling**: Supports `/v1/`, `/v2/` prefixes in URLs
- ✅ **Comprehensive HTTP Status Codes**: All 61 standard HTTP status codes
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✅ **Flexible Configuration**: Easy setup with customizable endpoint mapping
- ✅ **Enterprise Cache System**: Multi-strategy caching with LRU, tiered, and Redis-like implementations
- ✅ **Design Patterns**: Observer, Strategy, and Dependency Injection patterns for extensibility
- ✅ **Performance Monitoring**: Real-time statistics and event-driven monitoring
- ✅ **Factory & Builder Patterns**: Easy configuration with predefined and custom setups
- ✅ **Clean Architecture**: Well-structured, maintainable codebase

---

**Nocchino provides a robust, multi-endpoint solution for OpenAPI-based HTTP mocking with enterprise-grade caching, advanced design patterns, and comprehensive monitoring capabilities. The architecture supports complex testing scenarios while maintaining simplicity, performance, and backward compatibility.**

## 🚀 New in Version 1.1.0

### Enterprise Cache System
- **Enhanced Memory Cache**: LRU eviction, statistics, and event monitoring
- **Tiered Cache**: Multi-level caching for high-performance scenarios
- **Redis-like Cache**: Random eviction policy for production environments
- **Cache Manager**: Centralized strategy management and monitoring

### Design Pattern Improvements
- **Observer Pattern**: Event-driven architecture for loose coupling
- **Strategy Pattern**: Pluggable behaviors for different use cases
- **Dependency Injection**: Flexible configuration and easy testing
- **Factory & Builder Patterns**: Easy setup with predefined configurations

### Performance Enhancements
- **Real-time Statistics**: Hit rates, evictions, response times
- **Event Monitoring**: Cache events, performance metrics
- **Memory Management**: Automatic cleanup and LRU eviction
- **Performance Optimization**: Tiered caching for optimal performance
