import fs from 'fs'
import path from 'path'

import yaml from 'js-yaml'
import jsf from 'json-schema-faker'
import nock, { type Scope } from 'nock'

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
 * Dynamic Nock Repository for OpenAPI-based HTTP request interception
 * Supports loading multiple OpenAPI specifications from a folder
 * and Generic Types
 */
export class DynamicNockRepository {
  private specMap: Map<string, Record<string, string>>

  private defaultSpecFolder: string

  private baseUrl: string | null

  private activeIntercepts: Scope[]

  private loadedSpecs: Map<string, OpenAPISpec>

  constructor() {
    this.specMap = new Map()
    this.defaultSpecFolder = ''
    this.baseUrl = null
    this.activeIntercepts = []
    this.loadedSpecs = new Map()

    // Configure jsf for better fake data generation
    // eslint-disable-next-line global-require
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
    this.defaultSpecFolder = config.defaultSpec
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl
    }

    // Load all OpenAPI specifications from the default folder
    this.loadAllSpecifications()
  }

  /**
   * Load all OpenAPI specifications from the default folder
   */
  private loadAllSpecifications(): void {
    try {
      const folderPath = path.resolve(this.defaultSpecFolder)

      if (!fs.existsSync(folderPath)) {
        // eslint-disable-next-line no-console
        console.warn(`Default spec folder does not exist: ${folderPath}`)
        return
      }

      const openApiFiles = this.findOpenApiFiles(folderPath)

      for (const filePath of openApiFiles) {
        try {
          const spec = this.loadSpecification(filePath)
          const relativePath = path.relative(folderPath, filePath)
          const specKey = relativePath.replace(/\.(yml|yaml|json)$/, '')
          this.loadedSpecs.set(specKey, spec)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            `Failed to load specification from ${filePath}: ${error}`
          )
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load specifications from folder: ${error}`)
    }
  }

  /**
   * Recursively find all OpenAPI files in a directory
   * @param dirPath - Directory path to search
   * @returns Array of file paths
   */
  private findOpenApiFiles(dirPath: string): string[] {
    const openApiFiles: string[] = []

    const processDirectory = (currentPath: string): void => {
      const items = fs.readdirSync(currentPath)

      for (const item of items) {
        const fullPath = path.join(currentPath, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          processDirectory(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase()
          if (ext === '.yml' || ext === '.yaml' || ext === '.json') {
            openApiFiles.push(fullPath)
          }
        }
      }
    }

    processDirectory(dirPath)
    return openApiFiles
  }

  /**
   * Load a single OpenAPI specification from file
   * @param specPath - Path to the OpenAPI specification file
   * @returns OpenAPI specification object
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
  public mapRequestToSpec<TBody = unknown, TResponse = unknown>(
    requestDetails: RequestDetails<TBody, TResponse>
  ): string {
    const { headers = {} } = requestDetails

    // Check each header mapping
    for (const [headerKey, headerValues] of this.specMap) {
      const headerValue = headers[headerKey]
      if (headerValue && headerValues[headerValue]) {
        return headerValues[headerValue]
      }
    }

    // Use the default spec folder - we'll find the best matching spec
    return this.defaultSpecFolder
  }

  /**
   * Find the best matching specification for a request
   * @param requestDetails - Request details
   * @returns The best matching OpenAPI specification
   */
  private findBestMatchingSpec<TBody = unknown, TResponse = unknown>(
    requestDetails: RequestDetails<TBody, TResponse>
  ): OpenAPISpec | null {
    const { url, method } = requestDetails
    const requestUrl = new URL(url)
    const requestPath = requestUrl.pathname

    let bestMatch: OpenAPISpec | null = null
    let bestScore = 0

    for (const [, spec] of this.loadedSpecs) {
      // Get the base URL from the spec
      const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com'
      const baseUrlObj = new URL(baseUrl)

      // Calculate the relative path for this spec
      let relativePath = requestPath
      if (baseUrlObj.pathname !== '/') {
        relativePath = requestPath.replace(baseUrlObj.pathname, '') || '/'
      }

      const score = this.calculateSpecMatchScore(spec, relativePath, method)
      if (score > bestScore) {
        bestScore = score
        bestMatch = spec
      }
    }

    return bestMatch
  }

  /**
   * Calculate how well a specification matches a request
   * @param spec - OpenAPI specification
   * @param requestPath - Request path
   * @param method - HTTP method
   * @returns Match score (higher is better)
   */
  private calculateSpecMatchScore(
    spec: OpenAPISpec,
    requestPath: string,
    method: string
  ): number {
    let score = 0
    const paths = spec.paths || {}

    for (const [pathTemplate, pathItem] of Object.entries(paths)) {
      const operation = pathItem[method.toLowerCase() as keyof OpenAPIPathItem]
      if (operation) {
        // Convert OpenAPI path template to regex
        const pathPattern = pathTemplate.replace(/\{([^}]+)\}/g, '[^/]+')
        const regex = new RegExp(`^${pathPattern}$`)

        if (regex.test(requestPath)) {
          // Exact path match gets highest score
          score += 100
          // Longer paths get higher score (more specific)
          score += pathTemplate.split('/').length * 10
        }
      }
    }

    return score
  }

  /**
   * Generate mock response based on OpenAPI response schema
   * @param schema - OpenAPI response schema
   * @param options - Additional options for response generation
   * @returns Generated mock response
   */
  public generateMockResponse<TResponse = unknown>(
    schema: OpenAPIResponse,
    options: MockResponseOptions = {}
  ): TResponse {
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
        return {
          message: 'No schema available for response generation',
        } as TResponse
      }

      // Handle $ref references directly
      if (responseSchema.$ref) {
        return this.generateMockDataForRef(
          responseSchema.$ref,
          options.requestBody
        ) as TResponse
      }

      // Generate realistic mock data based on schema structure
      const mockData = this.generateRealisticMockData(
        responseSchema,
        options.requestBody
      )

      // Apply any custom transformations
      if (options.transform) {
        return options.transform(mockData) as TResponse
      }

      return mockData as TResponse
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to generate mock response for schema: ${errorMessage}`
      )
      return { message: 'Mock response generated with errors' } as TResponse
    }
  }

  /**
   * Generate realistic mock data based on schema structure
   * @param schema - OpenAPI schema
   * @param requestBody - Optional request body for dynamic data
   * @returns Mock data
   */
  private generateRealisticMockData(
    schema: OpenAPISchema,
    requestBody?: any
  ): any {
    if (!schema || !schema.properties) {
      return {}
    }

    const mockData: any = {}

    for (const [key, property] of Object.entries(schema.properties)) {
      if (property.$ref) {
        // Handle $ref references - extract schema name for better data generation
        const schemaName = property.$ref.split('/').pop() || 'Unknown'

        // Special handling for UserProfile schemas
        if (
          key === 'user' &&
          (schemaName === 'User' || schemaName === 'UserV2')
        ) {
          mockData[key] = this.generateGenericMockData(schemaName, requestBody)
        } else {
          mockData[key] = this.generateGenericMockData(schemaName, requestBody)
        }
      } else if (property.type === 'array' && property.items) {
        // Handle arrays
        mockData[key] = this.generateArrayData(property)
      } else if (property.type === 'object' && property.properties) {
        // Handle nested objects
        mockData[key] = this.generateRealisticMockData(property, requestBody)
      } else {
        // Handle primitive types with more realistic data
        mockData[key] = this.generatePrimitiveData(property, key)
      }
    }

    return mockData
  }

  /**
   * Generate mock data for a specific schema reference
   * @param ref - Schema reference (e.g., '#/components/schemas/User')
   * @param requestBody - Optional request body for dynamic data
   * @returns Mock data for the schema
   */
  private generateMockDataForRef(ref: string, requestBody?: any): any {
    // Extract schema name from reference
    const schemaName = ref.split('/').pop() || 'Unknown'

    // Generate generic mock data based on schema name patterns
    const mockData = this.generateGenericMockData(schemaName, requestBody)

    return mockData
  }

  /**
   * Generate generic mock data based on schema name patterns
   * @param schemaName - Name of the schema
   * @param requestBody - Optional request body for dynamic data
   * @returns Generic mock data
   */
  private generateGenericMockData(schemaName: string, requestBody?: any): any {
    // Common patterns for different types of schemas
    const patterns = {
      // Entity schemas (items, resources, objects)
      entity: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: requestBody?.name || 'Sample Item',
        description: requestBody?.description || 'A sample item for testing',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },

      // List/Collection schemas
      list: {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 5,
          totalItems: 100,
        },
        total: 100,
      },

      // Pagination schemas
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 5,
        totalItems: 100,
        hasNext: true,
        hasPrevious: false,
      },

      // Request schemas
      request: {
        name: requestBody?.name || 'Sample Request',
        description: requestBody?.description || 'A sample request',
        type: requestBody?.type || 'default',
        metadata: requestBody?.metadata || { category: 'test' },
      },

      // Response schemas
      response: {
        data: requestBody || {},
        status: 'success',
        message: 'Operation completed successfully',
        timestamp: '2023-01-01T00:00:00Z',
      },

      // Error schemas
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        details: {},
        timestamp: '2023-01-01T00:00:00Z',
      },

      // Profile schemas
      profile: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: requestBody?.name || 'Sample Profile',
        email: requestBody?.email || 'profile@example.com',
        preferences: {
          notifications: true,
          theme: 'light',
          language: 'en',
        },
        metadata: requestBody?.metadata || {},
      },

      // Filter schemas
      filter: {
        applied: [],
        available: [],
        total: 0,
      },

      // Metadata schemas
      metadata: {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00Z',
        source: 'api',
        category: 'test',
      },
    }

    // Determine the type based on schema name patterns
    const nameLower = schemaName.toLowerCase()

    if (
      nameLower.includes('list') ||
      nameLower.includes('collection') ||
      nameLower.includes('array')
    ) {
      return patterns.list
    }

    if (nameLower.includes('pagination') || nameLower.includes('page')) {
      return patterns.pagination
    }

    if (
      nameLower.includes('request') ||
      nameLower.includes('create') ||
      nameLower.includes('update')
    ) {
      return patterns.request
    }

    if (nameLower.includes('response') || nameLower.includes('result')) {
      return patterns.response
    }

    if (nameLower.includes('error') || nameLower.includes('exception')) {
      return patterns.error
    }

    // For UserProfile schemas, generate profile-specific data
    if (nameLower.includes('userprofile')) {
      const isV2 = nameLower.includes('v2')
      const userSchemaName = isV2 ? 'UserV2' : 'User'

      return {
        user: this.generateGenericMockData(userSchemaName, requestBody),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true,
        },
        statistics: {
          loginCount: 42,
          lastLoginAt: '2023-01-01T00:00:00Z',
        },
        ...(isV2 && {
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            timezone: 'UTC',
          },
          statistics: {
            loginCount: 42,
            lastLoginAt: '2023-01-01T00:00:00Z',
            totalSessions: 15,
            sessionDuration: 3600,
            devicesCount: 2,
          },
          security: {
            twoFactorEnabled: true,
            lastPasswordChange: '2023-01-01T00:00:00Z',
            passwordChangedAt: '2023-01-01T00:00:00Z',
            failedLoginAttempts: 0,
            lastFailedLoginAt: '2023-01-01T00:00:00Z',
          },
        }),
      }
    }

    // For other profile schemas (not UserProfile)
    if (nameLower.includes('profile') && !nameLower.includes('userprofile')) {
      return patterns.profile
    }

    // For User schemas, generate user-specific data
    if (nameLower.includes('user')) {
      const isV2 = nameLower.includes('v2') || nameLower.includes('user2')

      // Generate more realistic data that matches typical request patterns
      const mockData = {
        id: requestBody?.id || '123e4567-e89b-12d3-a456-426614174000',
        email: requestBody?.email || 'test@example.com',
        firstName: requestBody?.firstName || 'John',
        lastName: requestBody?.lastName || 'Doe',
        status: requestBody?.status || 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }

      if (isV2) {
        return {
          ...mockData,
          role: requestBody?.role || 'user',
          emailVerified: true,
          twoFactorEnabled: false,
          lastLoginAt: '2023-01-01T00:00:00Z',
        }
      }

      return mockData
    }

    // Default to entity pattern for most schemas
    return patterns.entity
  }

  /**
   * Generate array data
   * @param property - Array property schema
   * @returns Array data
   */
  private generateArrayData(property: OpenAPISchema): any[] {
    const { items } = property
    if (!items) return []

    const count = property.maxItems || 3
    return Array.from({ length: count }, () => {
      if (items.$ref) {
        return this.generateMockDataForRef(items.$ref)
      }
      if (items.type === 'object' && items.properties) {
        return this.generateRealisticMockData(items)
      }
      return this.generatePrimitiveData(items)
    })
  }

  /**
   * Generate primitive data based on schema property
   * @param property - OpenAPI schema property
   * @param fieldName - Name of the field (optional)
   * @returns Generated primitive data
   */
  private generatePrimitiveData(
    property: OpenAPISchema,
    fieldName?: string
  ): any {
    const { type, format, enum: enumValues } = property

    // Generate more realistic data based on field name
    if (fieldName) {
      const nameLower = fieldName.toLowerCase()

      if (nameLower.includes('email')) {
        return 'test@example.com'
      }

      if (nameLower.includes('firstname') || nameLower.includes('first_name')) {
        return 'Jane'
      }

      if (nameLower.includes('lastname') || nameLower.includes('last_name')) {
        return 'Smith'
      }

      if (nameLower.includes('password')) {
        return 'password123'
      }

      if (nameLower.includes('role')) {
        return 'user'
      }

      if (nameLower.includes('status')) {
        return 'active'
      }

      if (
        nameLower.includes('sendwelcomeemail') ||
        nameLower.includes('send_welcome_email')
      ) {
        return true
      }
    }

    // Fallback to generic data generation
    if (type === 'string') {
      if (format === 'email') {
        return 'test@example.com'
      }
      if (format === 'date-time') {
        return '2023-01-01T00:00:00Z'
      }
      if (format === 'uuid') {
        return '123e4567-e89b-12d3-a456-426614174000'
      }
      if (enumValues && enumValues.length > 0) {
        return enumValues[0]
      }
      return 'sample string'
    }

    if (type === 'integer' || type === 'number') {
      return 42
    }

    if (type === 'boolean') {
      return true
    }

    if (type === 'array') {
      return []
    }

    if (type === 'object') {
      return {}
    }

    return null
  }

  /**
   * Setup Nock intercepts for all endpoints in an OpenAPI specification
   * @param spec - OpenAPI specification
   * @param baseUrl - Base URL for the API
   */
  public setupNockIntercepts(spec: OpenAPISpec, baseUrl: string): void {
    const scope = nock(baseUrl)

    // Setup intercepts for each path - sort by specificity (longer paths first)
    const paths = Object.entries(spec.paths).sort((a, b) => {
      // Sort by path length (longer paths first) to avoid regex conflicts
      const aLength = a[0].split('/').length
      const bLength = b[0].split('/').length
      return bLength - aLength
    })

    for (const [pathKey, pathItem] of paths) {
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
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            pathKey,
            operation as OpenAPIOperation
          )
        }
      }
    }

    // Store the scope for cleanup
    this.activeIntercepts.push(scope)
  }

  /**
   * Set up a specific endpoint intercept
   * @param scope - Nock scope
   * @param method - HTTP method
   * @param endpointPath - Endpoint path
   * @param operation - OpenAPI operation
   */
  private setupEndpointIntercept(
    scope: Scope,
    method: HTTPMethod,
    endpointPath: string,
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
      if (responses['201']) {
        statusCode = 201
      } else if (responses['204']) {
        statusCode = 204
      } else {
        statusCode = 200
      }
    }

    if (!successResponse) {
      // eslint-disable-next-line no-console
      console.warn(`No success response found for ${method} ${endpointPath}`)
      return
    }

    // For POST/PUT requests, we'll generate mock request body data
    // This will be used to create dynamic responses that reflect the request
    let requestBodyData: any = undefined
    if ((method === 'POST' || method === 'PUT') && operation.requestBody) {
      const requestSchema =
        operation.requestBody.content?.['application/json']?.schema
      if (requestSchema) {
        // Generate mock request data that can be used for response generation
        // This simulates what the actual request might look like
        requestBodyData = this.generateRealisticMockData(requestSchema)
      }
    }

    const mockResponse = this.generateMockResponse(successResponse, {
      requestBody: requestBodyData,
    })

    // Use the correct method name for nock
    const nockMethod = method.toLowerCase() as keyof Scope
    if (typeof scope[nockMethod] === 'function') {
      // Use the exact path for now
      ;(scope[nockMethod] as any)(endpointPath).reply(statusCode, mockResponse)
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Method ${method} not supported by nock scope`)
    }
  }

  /**
   * Activate Nock intercepts for a specific request
   * @param requestDetails - Request details to activate intercepts for
   */
  public activateNockForRequest<TBody = unknown, TResponse = unknown>(
    requestDetails: RequestDetails<TBody, TResponse>
  ): void {
    try {
      const bestMatchingSpec = this.findBestMatchingSpec(requestDetails)
      if (!bestMatchingSpec) {
        // eslint-disable-next-line no-console
        console.warn(
          `No matching OpenAPI specification found for request: ${requestDetails.url}`
        )
        return
      }

      // Use the first server URL from the spec, or fallback to the request URL
      const baseUrl =
        bestMatchingSpec.servers?.[0]?.url ||
        this.baseUrl ||
        this.extractBaseUrl(requestDetails.url)

      // Extract the path from the request URL relative to the base URL
      const requestUrl = new URL(requestDetails.url)
      const baseUrlObj = new URL(baseUrl)

      // Remove the base URL path from the request path
      let relativePath = requestUrl.pathname
      if (baseUrlObj.pathname !== '/') {
        relativePath =
          requestUrl.pathname.replace(baseUrlObj.pathname, '') || '/'
      }

      // Set up only the specific intercept needed for this request
      this.setupSpecificIntercept(
        bestMatchingSpec,
        baseUrl,
        requestDetails.method,
        relativePath
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.warn(`Failed to activate Nock for request: ${errorMessage}`)
    }
  }

  /**
   * Setup specific Nock intercept for a request
   * @param spec - OpenAPI specification
   * @param baseUrl - Base URL for the API
   * @param method - HTTP method
   * @param path - Request path
   */
  private setupSpecificIntercept(
    spec: OpenAPISpec,
    baseUrl: string,
    method: string,
    requestPath: string
  ): void {
    const scope = nock(baseUrl)

    // Find the matching path in the OpenAPI spec
    const matchingPath = this.findMatchingPath(spec.paths, requestPath)

    if (matchingPath) {
      const pathItem = spec.paths[matchingPath]
      if (pathItem) {
        const operation =
          pathItem[method.toLowerCase() as keyof OpenAPIPathItem]

        if (operation && 'responses' in operation) {
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            requestPath,
            operation as OpenAPIOperation
          )
        }
      }
    }

    // Store the scope for cleanup
    this.activeIntercepts.push(scope)
  }

  /**
   * Find the matching path in OpenAPI spec for a given request path
   * @param paths - OpenAPI paths
   * @param requestPath - Request path
   * @returns Matching OpenAPI path or null
   */
  // eslint-disable-next-line class-methods-use-this
  private findMatchingPath(
    paths: Record<string, OpenAPIPathItem>,
    requestPath: string
  ): string | null {
    // Sort paths by length (longest first) to match most specific paths first
    const sortedPaths = Object.keys(paths).sort((a, b) => {
      const aLength = a.split('/').length
      const bLength = b.split('/').length
      return bLength - aLength
    })

    for (const specPath of sortedPaths) {
      // Convert OpenAPI path to regex pattern
      const pathPattern = specPath.replace(/\{([^}]+)\}/g, '[^/]+')
      const regex = new RegExp(`^${pathPattern}$`)

      if (regex.test(requestPath)) {
        return specPath
      }
    }

    return null
  }

  /**
   * Extract base URL from a full URL
   * @param url - Full URL
   * @returns Base URL
   */
  // eslint-disable-next-line class-methods-use-this
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
      defaultSpec: this.defaultSpecFolder,
      specMapSize: this.specMap.size,
    }
  }
}

// Singleton instance
const dynamicNockRepo = new DynamicNockRepository()

// Export convenience functions
export const configure = (config: NocchinoConfig): void =>
  dynamicNockRepo.configure(config)

export const activateNockForRequest = <TBody = unknown, TResponse = unknown>(
  requestDetails: RequestDetails<TBody, TResponse>
): void => dynamicNockRepo.activateNockForRequest(requestDetails)

export const restoreNock = (): void => dynamicNockRepo.restoreNock()

export const getState = (): RepositoryState => dynamicNockRepo.getState()

export { dynamicNockRepo as repository }
