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

export type HTTPStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 500

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

// Generic mock response generator
export interface MockResponseGenerator<TResponse = unknown> {
  generate(options?: MockResponseOptions): TResponse
}

export interface MockResponseOptions {
  transform?: (data: unknown) => unknown
  requestBody?: unknown
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
