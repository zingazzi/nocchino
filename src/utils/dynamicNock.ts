import fs from 'fs'
import path from 'path'

import yaml from 'js-yaml'
import jsf from 'json-schema-faker'
import nock from 'nock'
import type { Scope } from 'nock'

import type {
  OpenAPISpec,
  NocchinoConfig,
  RequestDetails,
  MockResponseOptions,
  RepositoryState,
  HTTPMethod,
  OpenAPIOperation,
  OpenAPIResponse,
  OpenAPIPathItem,
  OpenAPISchema,
} from '../types'

/**
 * Dynamic Nock Repository for OpenAPI-based mocking
 *
 * This module provides a centralized solution for mocking API calls based on OpenAPI specifications.
 * It dynamically loads OpenAPI YAML files and generates Nock intercepts based on the specifications.
 *
 * Design Patterns Used:
 * - Factory Pattern: For creating mock responses
 * - Strategy Pattern: For different mapping strategies
 * - Singleton Pattern: For managing Nock state
 * - Template Method Pattern: For the request processing flow
 */
export class DynamicNockRepository {
  private specMap: Map<string, Record<string, string>>

  private defaultSpec: string | null

  private baseUrl: string | null

  private activeIntercepts: Scope[]

  constructor() {
    this.specMap = new Map()
    this.defaultSpec = null
    this.baseUrl = null
    this.activeIntercepts = []

    // Configure jsf for better fake data generation
    jsf.extend('faker', () => require('@faker-js/faker'))
    jsf.option({
      alwaysFakeOptionals: true,
      maxItems: 5,
      maxLength: 10,
    })
  }

  /**
   * Configure the repository with mapping rules and default settings
   * @param config - Configuration object
   */
  public configure(config: NocchinoConfig): void {
    if (config.specMap) {
      this.specMap = new Map(Object.entries(config.specMap))
    }
    if (config.defaultSpec) {
      this.defaultSpec = config.defaultSpec
    }
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl
    }
  }

  /**
   * Load and parse an OpenAPI specification file
   * @param specPath - Path to the OpenAPI YAML file
   * @returns Parsed OpenAPI specification
   */
  public loadSpecification(specPath: string): OpenAPISpec {
    try {
      const fullPath = path.resolve(specPath)
      const fileContent = fs.readFileSync(fullPath, 'utf8')
      const spec = yaml.load(fileContent) as OpenAPISpec

      if (!spec.openapi) {
        throw new Error(
          'Invalid OpenAPI specification: missing openapi version'
        )
      }

      return spec
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new Error(
        `Failed to load OpenAPI specification from ${specPath}: ${errorMessage}`
      )
    }
  }

  /**
   * Map a request to the appropriate OpenAPI specification based on headers
   * @param requestDetails - Request details including headers
   * @returns Path to the appropriate OpenAPI specification file
   */
  public mapRequestToSpec(requestDetails: RequestDetails): string {
    const { headers = {} } = requestDetails

    // Check each header mapping
    for (const [headerKey, headerValues] of this.specMap) {
      const headerValue = headers[headerKey]
      if (headerValue && headerValues[headerValue]) {
        return headerValues[headerValue]
      }
    }

    // Fallback to default spec
    if (this.defaultSpec) {
      return this.defaultSpec
    }

    throw new Error('No OpenAPI specification found for request')
  }

  /**
   * Generate mock response based on OpenAPI response schema
   * @param schema - OpenAPI response schema
   * @param options - Additional options for response generation
   * @returns Generated mock response
   */
  public generateMockResponse(
    schema: OpenAPIResponse,
    options: MockResponseOptions = {}
  ): any {
    try {
      // Handle different schema formats
      let responseSchema: OpenAPISchema | undefined = schema

      if (schema.content && schema.content['application/json']) {
        responseSchema = schema.content['application/json'].schema
      }

      if (schema.schema) {
        responseSchema = schema.schema
      }

      if (!responseSchema) {
        return { message: 'No schema available for response generation' }
      }

      // Generate realistic mock data based on schema structure
      const mockData = this.generateRealisticMockData(responseSchema)

      // Apply any custom transformations
      if (options.transform) {
        return options.transform(mockData)
      }

      return mockData
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.warn(
        `Failed to generate mock response for schema: ${errorMessage}`
      )
      return { message: 'Mock response generated with errors' }
    }
  }

  /**
   * Generate realistic mock data based on schema structure
   * @param schema - OpenAPI schema
   * @returns Mock data
   */
  private generateRealisticMockData(schema: OpenAPISchema): any {
    if (!schema || !schema.properties) {
      return {}
    }

    const mockData: any = {}

    for (const [key, property] of Object.entries(schema.properties)) {
      if (property.$ref) {
        // Handle $ref references
        mockData[key] = this.generateMockDataForRef(property.$ref)
      } else if (property.type === 'array' && property.items) {
        // Handle arrays
        mockData[key] = this.generateArrayData(property)
      } else if (property.type === 'object' && property.properties) {
        // Handle nested objects
        mockData[key] = this.generateRealisticMockData(property)
      } else {
        // Handle primitive types
        mockData[key] = this.generatePrimitiveData(property)
      }
    }

    return mockData
  }

  /**
   * Generate mock data for $ref references
   * @param ref - Reference string
   * @returns Mock data
   */
  private generateMockDataForRef(ref: string): any {
    // Handle common schema references
    if (ref === '#/components/schemas/User') {
      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }
    }

    if (ref === '#/components/schemas/Pagination') {
      return {
        page: 1,
        limit: 20,
        totalPages: 5,
        totalItems: 100,
      }
    }

    if (ref === '#/components/schemas/UserProfile') {
      return {
        user: this.generateMockDataForRef('#/components/schemas/User'),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true,
        },
        statistics: {
          loginCount: 42,
          lastLoginAt: '2023-01-01T00:00:00Z',
        },
      }
    }

    if (ref === '#/components/schemas/Error') {
      return {
        error: 'An error occurred',
        code: 'INTERNAL_ERROR',
        details: {},
      }
    }

    if (ref === '#/components/schemas/CreateUserRequest') {
      return {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      }
    }

    if (ref === '#/components/schemas/UpdateUserRequest') {
      return {
        firstName: 'Updated',
        lastName: 'User',
        status: 'active',
      }
    }

    // Default fallback
    return {}
  }

  /**
   * Generate array data
   * @param property - Array property schema
   * @returns Array data
   */
  private generateArrayData(property: OpenAPISchema): any[] {
    const items = property.items
    if (!items) return []

    const count = property.maxItems || 3
    const array: any[] = []

    for (let i = 0; i < count; i++) {
      if (items.$ref) {
        array.push(this.generateMockDataForRef(items.$ref))
      } else if (items.type === 'object' && items.properties) {
        array.push(this.generateRealisticMockData(items))
      } else {
        array.push(this.generatePrimitiveData(items))
      }
    }

    return array
  }

  /**
   * Generate primitive data
   * @param property - Property schema
   * @returns Primitive data
   */
  private generatePrimitiveData(property: OpenAPISchema): any {
    if (property.type === 'string') {
      if (property.format === 'email') {
        return 'user@example.com'
      }
      if (property.format === 'uuid') {
        return '123e4567-e89b-12d3-a456-426614174000'
      }
      if (property.format === 'date-time') {
        return '2023-01-01T00:00:00Z'
      }
      if (property.enum) {
        return property.enum[0]
      }
      return 'sample string'
    }

    if (property.type === 'integer') {
      return property.minimum || 1
    }

    if (property.type === 'number') {
      return property.minimum || 1.0
    }

    if (property.type === 'boolean') {
      return true
    }

    return null
  }

  /**
   * Setup Nock intercepts for all endpoints in an OpenAPI specification
   * @param spec - OpenAPI specification
   * @param baseUrl - Base URL for the API
   */
  public setupNockIntercepts(spec: OpenAPISpec, baseUrl: string): void {
    console.log(`Creating Nock scope for baseUrl: ${baseUrl}`)
    const scope = nock(baseUrl)

    // Setup intercepts for each path
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods: Array<keyof OpenAPIPathItem> = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options',
      ]

      for (const method of methods) {
        const operation = pathItem[method]
        if (operation && 'responses' in operation) {
          console.log(
            `Setting up intercept for ${method.toUpperCase()} ${path}`
          )
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            path,
            operation as OpenAPIOperation
          )
        }
      }
    }

    // Store the scope for cleanup
    this.activeIntercepts.push(scope)
    console.log(`Total active intercepts: ${this.activeIntercepts.length}`)
  }

  /**
   * Setup Nock intercept for a specific endpoint
   * @param scope - Nock scope
   * @param method - HTTP method
   * @param path - API path
   * @param operation - OpenAPI operation
   */
  private setupEndpointIntercept(
    scope: Scope,
    method: HTTPMethod,
    path: string,
    operation: OpenAPIOperation
  ): void {
    const { responses } = operation

    // Find the appropriate response based on method
    let successResponse: OpenAPIResponse | undefined
    let statusCode = 200

    if (method === 'POST') {
      successResponse = responses['201'] || responses['200']
      statusCode = responses['201'] ? 201 : 200
    } else if (method === 'PUT') {
      successResponse = responses['200'] || responses['201']
      statusCode = responses['201'] ? 201 : 200
    } else {
      successResponse = responses['200'] || responses['201'] || responses['204']
      statusCode = responses['201'] ? 201 : responses['204'] ? 204 : 200
    }

    if (!successResponse) {
      console.warn(`No success response found for ${method} ${path}`)
      return
    }

    const mockResponse = this.generateMockResponse(successResponse)

    // Use the correct method name for nock
    const nockMethod = method.toLowerCase() as keyof Scope
    if (typeof scope[nockMethod] === 'function') {
      // Handle path parameters by converting {id} to regex pattern
      const nockPath = path.replace(/\{([^}]+)\}/g, '[^/]+')
      console.log(
        `Creating intercept: ${method} ${path} (${nockPath}) -> ${JSON.stringify(
          mockResponse
        ).substring(0, 100)}...`
      )
      ;(scope[nockMethod] as any)(new RegExp(nockPath)).reply(
        statusCode,
        mockResponse
      )
    } else {
      console.warn(`Method ${method} not supported by nock scope`)
    }
  }

  /**
   * Activate Nock intercepts for a specific request
   * @param requestDetails - Request details
   */
  public activateNockForRequest(requestDetails: RequestDetails): void {
    try {
      const specPath = this.mapRequestToSpec(requestDetails)
      const spec = this.loadSpecification(specPath)

      // Use the first server URL from the spec, or fallback to the request URL
      const baseUrl =
        spec.servers?.[0]?.url ||
        this.baseUrl ||
        this.extractBaseUrl(requestDetails.url)

      console.log(
        `Setting up Nock intercepts for ${requestDetails.method} ${requestDetails.url} using spec: ${specPath}`
      )
      console.log(`Using baseUrl: ${baseUrl}`)
      this.setupNockIntercepts(spec, baseUrl)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Failed to activate Nock for request: ${errorMessage}`)
    }
  }

  /**
   * Extract base URL from a full URL
   * @param url - Full URL
   * @returns Base URL
   */
  private extractBaseUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname
        .split('/')
        .slice(0, -1)
        .join('/')}`
    } catch (error) {
      // Fallback for relative URLs
      const urlParts = url.split('/')
      return `${urlParts[0]}//${urlParts[2]}/${urlParts[3]}`
    }
  }

  /**
   * Restore Nock to clean state
   */
  public restoreNock(): void {
    // Clean up active intercepts
    for (const scope of this.activeIntercepts) {
      scope.persist(false)
    }

    // Clean up all Nock intercepts
    nock.cleanAll()
    this.activeIntercepts = []
  }

  /**
   * Get current repository state
   * @returns Repository state information
   */
  public getState(): RepositoryState {
    return {
      activeIntercepts: this.activeIntercepts.length,
      baseUrl: this.baseUrl,
      defaultSpec: this.defaultSpec,
      specMapSize: this.specMap.size,
    }
  }
}

// Singleton instance
const dynamicNockRepo = new DynamicNockRepository()

// Export convenience functions
export const configure = (config: NocchinoConfig): void =>
  dynamicNockRepo.configure(config)

export const activateNockForRequest = (requestDetails: RequestDetails): void =>
  dynamicNockRepo.activateNockForRequest(requestDetails)

export const restoreNock = (): void => dynamicNockRepo.restoreNock()

export const getState = (): RepositoryState => dynamicNockRepo.getState()

export { dynamicNockRepo as repository }
