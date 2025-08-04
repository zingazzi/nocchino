# Nocchino 🎯

**Multi-Endpoint OpenAPI-based Nock Repository for Node.js Testing**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nock](https://img.shields.io/badge/Nock-13.5.4+-orange.svg)](https://github.com/nock/nock)

Nocchino is a powerful and flexible multi-endpoint mocking solution for Node.js applications that leverages OpenAPI specifications to create mock responses. It eliminates the need for manual Nock intercepts in test files, providing a centralized, maintainable, and scalable testing environment for multiple APIs.

## 🚀 Features

- **Multi-Endpoint Support**: Test against multiple APIs simultaneously
- **OpenAPI-Based Mocking**: Uses actual OpenAPI specifications only (no preset schemas or generic mock data)
- **Smart Path Matching**: Automatic endpoint and specification matching
- **Version Prefix Handling**: Supports `/v1/`, `/v2/` prefixes in URLs
- **Type Safety**: Built-in TypeScript support with full type definitions
- **Flexible Configuration**: Easy setup with customizable endpoint mapping
- **Comprehensive HTTP Status Codes**: Complete coverage of all 61 standard HTTP status codes with full type safety

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
import { NocchinoConfig } from 'nocchino'

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

### Environment-Based Testing

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

**Features:**

- **Automatic Loading**: All `.yml`, `.yaml`, and `.json` files in folders are automatically loaded
- **Smart Matching**: The system finds the best matching specification for each request
- **Multiple Endpoints**: Support for multiple API endpoints in the same test suite
- **Flexible Organization**: Organize specs by version, domain, or any structure you prefer
- **Multi-Domain Testing**: Test against different APIs simultaneously (e.g., `api.example.com` and `api.example2.com`)

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
- ✅ **Clean Architecture**: Well-structured, maintainable codebase

---

**Nocchino provides a robust, multi-endpoint solution for OpenAPI-based HTTP mocking with no preset schemas and comprehensive HTTP status code support. The architecture supports complex testing scenarios while maintaining simplicity and backward compatibility.**
