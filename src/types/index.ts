/**
 * TypeScript type definitions for Nocchino
 *
 * This module contains all the type definitions used throughout the project
 * to ensure type safety and better developer experience.
 */

// Basic OpenAPI Types (defined first to avoid circular references)
export interface OpenAPIContact {
  name?: string
  email?: string
  url?: string
}

export interface OpenAPIInfo {
  title: string
  description?: string
  version: string
  contact?: OpenAPIContact
}

export interface OpenAPIServer {
  url: string
  description?: string
}

export interface OpenAPISchema {
  type?: string
  format?: string
  description?: string
  enum?: unknown[]
  default?: unknown
  example?: unknown
  examples?: Record<string, unknown>
  nullable?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  deprecated?: boolean
  title?: string
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  properties?: Record<string, OpenAPISchema>
  items?: OpenAPISchema
  allOf?: OpenAPISchema[]
  anyOf?: OpenAPISchema[]
  oneOf?: OpenAPISchema[]
  not?: OpenAPISchema
  additionalProperties?: boolean | OpenAPISchema
  $ref?: string
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema?: OpenAPISchema
}

export interface OpenAPIRequestBody {
  required?: boolean
  content: Record<string, OpenAPIMediaType>
}

export interface OpenAPIResponse {
  description: string
  content?: Record<string, OpenAPIMediaType>
  status?: number
  schema?: OpenAPISchema
}

export interface OpenAPIOperation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses: Record<string, OpenAPIResponse>
}

export interface OpenAPIPathItem {
  get?: OpenAPIOperation
  post?: OpenAPIOperation
  put?: OpenAPIOperation
  patch?: OpenAPIOperation
  delete?: OpenAPIOperation
  head?: OpenAPIOperation
  options?: OpenAPIOperation
  parameters?: OpenAPIParameter[]
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>
  responses?: Record<string, OpenAPIResponse>
  parameters?: Record<string, OpenAPIParameter>
  requestBodies?: Record<string, OpenAPIRequestBody>
}

// Main OpenAPI Specification
export interface OpenAPISpec {
  openapi: string
  info: OpenAPIInfo
  servers?: OpenAPIServer[]
  paths: Record<string, OpenAPIPathItem>
  components?: OpenAPIComponents
}

// HTTP Types
export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export type HTTPStatusCode =
  // 1xx Informational
  | 100 // Continue
  | 101 // Switching Protocols
  | 102 // Processing
  | 103 // Early Hints

    // 2xx Success
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 203 // Non-Authoritative Information
  | 204 // No Content
  | 205 // Reset Content
  | 206 // Partial Content
  | 207 // Multi-Status
  | 208 // Already Reported
  | 226 // IM Used

    // 3xx Redirection
  | 300 // Multiple Choices
  | 301 // Moved Permanently
  | 302 // Found
  | 303 // See Other
  | 304 // Not Modified
  | 305 // Use Proxy
  | 306 // Switch Proxy
  | 307 // Temporary Redirect
  | 308 // Permanent Redirect

    // 4xx Client Errors
  | 400 // Bad Request
  | 401 // Unauthorized
  | 402 // Payment Required
  | 403 // Forbidden
  | 404 // Not Found
  | 405 // Method Not Allowed
  | 406 // Not Acceptable
  | 407 // Proxy Authentication Required
  | 408 // Request Timeout
  | 409 // Conflict
  | 410 // Gone
  | 411 // Length Required
  | 412 // Precondition Failed
  | 413 // Payload Too Large
  | 414 // URI Too Long
  | 415 // Unsupported Media Type
  | 416 // Range Not Satisfiable
  | 417 // Expectation Failed
  | 418 // I'm a teapot
  | 421 // Misdirected Request
  | 422 // Unprocessable Entity
  | 423 // Locked
  | 424 // Failed Dependency
  | 425 // Too Early
  | 426 // Upgrade Required
  | 428 // Precondition Required
  | 429 // Too Many Requests
  | 431 // Request Header Fields Too Large
  | 451 // Unavailable For Legal Reasons

  // 5xx Server Errors
  | 500 // Internal Server Error
  | 501 // Not Implemented
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout
  | 505 // HTTP Version Not Supported
  | 506 // Variant Also Negotiates
  | 507 // Insufficient Storage
  | 508 // Loop Detected
  | 510 // Not Extended
  | 511 // Network Authentication Required

// Nocchino Configuration Types
export interface NocchinoEndpoint {
  baseUrl: string
  specs: string[] // Array of folder paths or file paths
}

export interface NocchinoConfig {
  endpoints: NocchinoEndpoint[]
  specMap?: Record<string, Record<string, string>>
}

export interface SpecMap {
  [headerKey: string]: {
    [headerValue: string]: string
  }
}

// Generic request types
export interface RequestDetails<TBody = unknown, TResponse = unknown> {
  url: string
  method: string
  headers?: Record<string, string>
  body?: TBody
  expectedResponse?: TResponse
}

// Generic API request interface
export interface APIRequest<TBody = unknown> {
  url: string
  method: HTTPMethod
  headers?: Record<string, string>
  body?: TBody
  params?: Record<string, string>
}

// Generic API response interface
export interface APIResponse<TData = unknown> {
  data: TData
  status: HTTPStatusCode
  headers?: Record<string, string>
  message?: string
}

// Generic request handler
export interface RequestHandler<TRequest = unknown, TResponse = unknown> {
  handle(request: TRequest): Promise<TResponse>
}

export interface MockResponseOptions {
  transform?: (data: unknown) => unknown
  requestBody?: unknown
}

// Generic mock response generator
export interface MockResponseGenerator<TResponse = unknown> {
  generate(options?: MockResponseOptions): TResponse
}

export interface RepositoryState {
  activeIntercepts: number
  endpoints: NocchinoEndpoint[]
  specMapSize: number
}

export interface NocchinoError extends Error {
  code?: string
  details?: Record<string, unknown>
}

// Nock Types
export interface NockScope {
  persist(flag?: boolean): NockScope
  [key: string]: unknown
}

// JSON Schema Faker Options
export interface JSFOptions {
  alwaysFakeOptionals?: boolean
  useExamples?: boolean
  maxItems?: number
  maxLength?: number
}
