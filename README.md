# Nocchino 🎯

**Dynamic OpenAPI-based Nock Repository for Node.js Testing**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nock](https://img.shields.io/badge/Nock-13.5.4+-orange.svg)](https://github.com/nock/nock)

Nocchino is a powerful and flexible mocking solution for Node.js applications that leverages OpenAPI specifications to dynamically generate mock responses. It eliminates the need for manual Nock intercepts in test files, providing a centralized, maintainable, and scalable testing environment.

## 🚀 Features

- **Dynamic OpenAPI Integration**: Automatically generates mock responses based on OpenAPI specifications
- **Version-based Routing**: Support for multiple API versions through header-based mapping
- **Environment-aware**: Different mock configurations for staging, production, and other environments
- **Comprehensive Testing**: Full test coverage with Jest integration
- **Type Safety**: Built-in TypeScript support with full type definitions
- **Flexible Configuration**: Easy setup with customizable mapping strategies

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

### 1. Basic Setup

```typescript
import { configure, activateNockForRequest, restoreNock } from 'nocchino'

// Configure Nocchino
configure({
  baseUrl: 'https://api.example.com',
  defaultSpec: 'specs/api-v1/users-api.yml',
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/users-api.yml',
      v2: 'specs/api-v2/users-api-v2.yml',
    },
  },
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
import { NocchinoConfig } from 'nocchino'

const config: NocchinoConfig = {
  // Base URL for the API
  baseUrl: 'https://api.example.com',

  // Default OpenAPI specification file
  defaultSpec: 'specs/api-v1/users-api.yml',

  // Header-based mapping for different API versions/environments
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/users-api.yml',
      v2: 'specs/api-v2/users-api-v2.yml',
    },
    'X-Environment': {
      staging: 'specs/api-v1/users-api.yml',
      production: 'specs/api-v2/users-api-v2.yml',
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

#### `configure(config: NocchinoConfig): void`

Configure the Nocchino repository with mapping rules and settings.

**Parameters:**

- `config` (NocchinoConfig): Configuration object
  - `baseUrl` (string): Base URL for the API
  - `defaultSpec` (string): Default OpenAPI specification file path
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
  RequestDetails,
  RepositoryState,
  OpenAPISpec,
  HTTPMethod,
  HTTPStatusCode,
} from 'nocchino'

// Use these types for better type safety
const config: NocchinoConfig = {
  baseUrl: 'https://api.example.com',
  defaultSpec: 'specs/api-v1/users-api.yml',
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

The `defaultSpec` is now mandatory and points to a folder containing multiple OpenAPI specifications:

```typescript
import { configure } from 'nocchino'

configure({
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/resources-api.yml',
      v2: 'specs/api-v2/resources-api-v2.yml',
    },
  },
  defaultSpec: 'specs', // Points to a folder containing all OpenAPI specs
  baseUrl: 'https://api.example.com',
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

**Features:**

- **Automatic Loading**: All `.yml`, `.yaml`, and `.json` files in the folder are automatically loaded
- **Smart Matching**: The system finds the best matching specification for each request
- **Multiple APIs**: Support for multiple API versions and domains in a single folder
- **Flexible Organization**: Organize specs by version, domain, or any structure you prefer

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
// Good: Organized test structure
describe('User API', () => {
  describe('v1 API', () => {
    beforeEach(() => {
      configure({
        defaultSpec: 'specs/api-v1/users-api.yml',
      })
    })

    afterEach(() => {
      restoreNock()
    })

    test('should create user', async () => {
      // Test implementation
    })
  })

  describe('v2 API', () => {
    beforeEach(() => {
      configure({
        defaultSpec: 'specs/api-v2/users-api-v2.yml',
      })
    })

    afterEach(() => {
      restoreNock()
    })

    test('should create user with enhanced features', async () => {
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
// Good: Centralized configuration
const config: NocchinoConfig = {
  baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  defaultSpec: 'specs/api-v1/users-api.yml',
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/users-api.yml',
      v2: 'specs/api-v2/users-api-v2.yml',
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
