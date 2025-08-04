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

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Design Patterns](#design-patterns)
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
- **json-schema-faker**: Dynamic mock data generation
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

### 2. Multi-Endpoint Setup

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
import { configure, activateNockForRequest, restoreNock } from 'nocchino'
import axios from 'axios'

describe('User API Tests', () => {
  afterEach(() => {
    restoreNock() // Clean up after each test
  })

  test('should get users with v1 API', async () => {
    // Activate Nock for specific request
    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: {
        'X-Api-Version': 'v1',
        'Content-Type': 'application/json',
      },
    })

    // Make actual request
    const response = await axios.get('https://api.example.com/v1/users', {
      headers: { 'X-Api-Version': 'v1' },
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('users')
  })
})
```

## ⚙️ Configuration

### Configuration Options

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

### OpenAPI Specification Structure

Your OpenAPI files should follow the standard OpenAPI 3.0.3 format:

```yaml
openapi: 3.0.3
info:
  title: Users API v1
  version: 1.0.0
paths:
  /users:
    get:
      summary: List all users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        status:
          type: string
          enum: [active, inactive, pending]
      required:
        - id
        - email
        - firstName
        - lastName
        - status
```

## 📚 Usage Examples

### Version-based Testing

```typescript
import { activateNockForRequest } from 'nocchino'
import axios from 'axios'

describe('API Version Testing', () => {
  test('v1 API should return basic user data', async () => {
    activateNockForRequest({
      url: 'https://api.example.com/v1/users/123',
      method: 'GET',
      headers: { 'X-Api-Version': 'v1' },
    })

    const response = await axios.get('https://api.example.com/v1/users/123', {
      headers: { 'X-Api-Version': 'v1' },
    })

    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('email')
    expect(response.data).toHaveProperty('firstName')
    expect(response.data).toHaveProperty('lastName')
    expect(response.data).toHaveProperty('status')
  })

  test('v2 API should return enhanced user data', async () => {
    activateNockForRequest({
      url: 'https://api.example.com/v2/users/123',
      method: 'GET',
      headers: { 'X-Api-Version': 'v2' },
    })

    const response = await axios.get('https://api.example.com/v2/users/123', {
      headers: { 'X-Api-Version': 'v2' },
    })

    // v2 includes additional fields
    expect(response.data).toHaveProperty('role')
    expect(response.data).toHaveProperty('emailVerified')
    expect(response.data).toHaveProperty('twoFactorEnabled')
  })
})
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
describe('Environment Testing', () => {
  test('staging environment should use v1 API', async () => {
    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: { 'X-Environment': 'staging' },
    })

    const response = await axios.get('https://api.example.com/v1/users', {
      headers: { 'X-Environment': 'staging' },
    })

    expect(response.status).toBe(200)
  })

  test('production environment should use v2 API', async () => {
    activateNockForRequest({
      url: 'https://api.example.com/v2/users',
      method: 'GET',
      headers: { 'X-Environment': 'production' },
    })

    const response = await axios.get('https://api.example.com/v2/users', {
      headers: { 'X-Environment': 'production' },
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('filters') // v2 feature
  })
})
```

### Error Scenario Testing

```typescript
describe('Error Handling', () => {
  test('should handle 404 errors', async () => {
    // You can customize the OpenAPI spec to include error responses
    activateNockForRequest({
      url: 'https://api.example.com/v1/users/nonexistent',
      method: 'GET',
      headers: { 'X-Api-Version': 'v1' },
    })

    try {
      await axios.get('https://api.example.com/v1/users/nonexistent', {
        headers: { 'X-Api-Version': 'v1' },
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        expect(error.response.status).toBe(404)
        expect(error.response.data).toHaveProperty('error')
        expect(error.response.data).toHaveProperty('code')
      }
    }
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

Configure the Nocchino repository with mapping rules and settings.

**Parameters:**

- `config` (NocchinoConfig): Configuration object
  - `endpoints` (NocchinoEndpoint[]): Array of endpoint configurations
  - `specMap` (Object): Header-based mapping configuration

#### `activateNockForRequest(requestDetails: RequestDetails): void`

Activate Nock intercepts for a specific request.

**Parameters:**

- `requestDetails` (RequestDetails): Request information
  - `url` (string): Request URL
  - `method` (string): HTTP method
  - `headers` (Object): Request headers

#### `restoreNock(): void`

Clean up all Nock intercepts and restore to clean state.

#### `getState(): RepositoryState`

Get current repository state information.

**Returns:**

- `RepositoryState`: Current state including active intercepts, base URL, etc.

### Advanced Usage

```typescript
import { repository } from 'nocchino'

// Direct access to repository instance for advanced usage
const state = repository.getState()
// Access state properties as needed
```

### Type Definitions

```typescript
import {
  NocchinoConfig,
  NocchinoEndpoint,
  RequestDetails,
  RepositoryState,
  OpenAPISpec,
  HTTPMethod,
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

**Folder Structure:**

```
specs/
├── api-v1/
│   ├── users-api.yml
│   ├── products-api.yml
│   └── orders-api.yml
├── api-v2/
│   ├── users-api-v2.yml
│   └── products-api-v2.yml
└── shared/
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

### 1. Factory Pattern

Used for creating mock responses based on OpenAPI schemas.

### 2. Strategy Pattern

Different mapping strategies for routing requests to appropriate OpenAPI specifications.

### 3. Singleton Pattern

Single repository instance manages all Nock state and configuration.

### 4. Template Method Pattern

Standardized flow for request processing: map → load → setup → intercept.

## 🎯 Best Practices

### 1. OpenAPI Specification Management

```yaml
# Good: Comprehensive schema definitions
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
          minLength: 1
        lastName:
          type: string
          minLength: 1
        status:
          type: string
          enum: [active, inactive, pending]
      required:
        - id
        - email
        - firstName
        - lastName
        - status
```

### 2. Test Organization

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

### 3. Error Handling

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

beforeAll(() => {
  configure(config)
})
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/user-service.test.ts
```

### Test Structure

```
tests/
├── user-service.test.ts      # User API tests
├── product-service.test.ts   # Product API tests
└── integration.test.ts       # Integration tests
```

### Coverage Report

Nocchino includes comprehensive test coverage for:

- Dynamic Nock repository functionality
- OpenAPI specification loading and parsing
- Request mapping and routing
- Mock response generation
- Error handling and edge cases

## 🔄 Refactoring Opportunities

### 1. Plugin Architecture

Consider implementing a plugin system for custom response generators:

```typescript
// Future enhancement
interface MockGenerator {
  generate(schema: OpenAPISchema): any
}

const customGenerator: MockGenerator = {
  generate: (schema: OpenAPISchema) => {
    // Custom generation logic
    return customUserData
  },
}

repository.registerGenerator('custom-user-generator', customGenerator)
```

### 2. Caching Layer

Add caching for frequently used OpenAPI specifications:

```typescript
// Future enhancement
class SpecCache {
  private cache = new Map<string, OpenAPISpec>()

  get(specPath: string): OpenAPISpec | null {
    return this.cache.get(specPath) || null
  }
}
```

### 3. Middleware Support

Add middleware support for request/response transformation:

```typescript
// Future enhancement
repository.use('beforeRequest', (request: RequestDetails) => {
  // Transform request
  return request
})

repository.use('afterResponse', (response: any) => {
  // Transform response
  return response
})
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Development mode (watch for changes)
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Nock](https://github.com/nock/nock) - HTTP request mocking
- [OpenAPI](https://swagger.io/specification/) - API specification standard
- [json-schema-faker](https://github.com/json-schema-faker/json-schema-faker) - Mock data generation
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/nocchino/issues)
- **Documentation**: [Wiki](https://github.com/your-username/nocchino/wiki)
- **Email**: marco.zingoni@gmail.com

---

**Made with ❤️ for the Node.js testing community**
