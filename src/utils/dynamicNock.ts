import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';
import jsf from 'json-schema-faker';
import nock, { type Scope } from 'nock';

import type {
  OpenAPISpec,
  NocchinoConfig,
  NocchinoEndpoint,
  RequestDetails,
  MockResponseOptions,
  RepositoryState,
  HTTPMethod,
  OpenAPIOperation,
  OpenAPIResponse,
  OpenAPIPathItem,
  OpenAPISchema,
} from '../types';

import {
  debugEndpoint,
  debugError,
} from './debugger';
import {
  ErrorCode,
  ErrorSeverity,
  errorHandler,
  createSpecNotFoundError,
  createEndpointMismatchError,
} from './errorHandler';

/**
 * Dynamic Nock Repository for OpenAPI-based HTTP request interception
 * Supports loading multiple OpenAPI specifications from multiple endpoints
 * and Generic Types
 */
export class DynamicNockRepository {
  private specMap: Map<string, Record<string, string>>;

  private endpoints: NocchinoEndpoint[];

  private activeIntercepts: Scope[];

  private loadedSpecs: Map<string, OpenAPISpec>;

  private endpointSpecs: Map<string, Map<string, OpenAPISpec>>;

  constructor() {
    this.specMap = new Map();
    this.endpoints = [];
    this.activeIntercepts = [];
    this.loadedSpecs = new Map();
    this.endpointSpecs = new Map();

    // Configure jsf for better fake data generation
    // eslint-disable-next-line global-require
    jsf.extend('faker', () => require('@faker-js/faker'));
    jsf.option({
      alwaysFakeOptionals: true,
      maxItems: 5,
      maxLength: 10,
    });
  }

  /**
   * Initialize the repository with multiple endpoints and their specifications
   * @param endpoints - Array of endpoint configurations
   */
  public initialize(endpoints: NocchinoEndpoint[]): void {
    try {
      // Validate configuration
      errorHandler.validateConfiguration(endpoints);

      this.endpoints = endpoints;
      this.loadedSpecs.clear();
      this.endpointSpecs.clear();

      // Debug endpoint configuration
      endpoints.forEach((endpoint) => {
        debugEndpoint(endpoint);
        this.loadEndpointSpecifications(endpoint);
      });
    } catch (error) {
      if (error instanceof Error) {
        debugError(error, { endpoints });
        throw errorHandler.createError(
          ErrorCode.INVALID_CONFIG,
          `Failed to initialize repository: ${error.message}`,
          { additionalInfo: { endpoints } },
          ErrorSeverity.HIGH,
          false,
        );
      }
      throw error;
    }
  }

  /**
   * Configure the repository with mapping rules and endpoint settings
   * @param config - Configuration object
   */
  public configure(config: NocchinoConfig): void {
    if (config.specMap) {
      this.specMap = new Map(Object.entries(config.specMap));
    }
    this.initialize(config.endpoints);
  }

  /**
   * Load all OpenAPI specifications for a specific endpoint
   * @param endpoint - Endpoint configuration
   */
  private loadEndpointSpecifications(endpoint: NocchinoEndpoint): void {
    const endpointSpecs = new Map<string, OpenAPISpec>();

    endpoint.specs.forEach((specPath) => {
      try {
        const fullPath = path.resolve(specPath);

        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Load all OpenAPI files from directory
            const openApiFiles = this.findOpenApiFiles(fullPath);
            openApiFiles.forEach((filePath) => {
              try {
                const spec = this.loadSpecification(filePath);
                const relativePath = path.relative(fullPath, filePath);
                const specKey = relativePath.replace(/\.(yml|yaml|json)$/, '');
                endpointSpecs.set(specKey, spec);
                this.loadedSpecs.set(specKey, spec);
              } catch (error) {
                // Silently handle specification loading errors
              }
            });
          } else if (stat.isFile()) {
            // Load single file
            try {
              const spec = this.loadSpecification(fullPath);
              const fileName = path.basename(fullPath, path.extname(fullPath));
              endpointSpecs.set(fileName, spec);
              this.loadedSpecs.set(fileName, spec);
            } catch (error) {
              // Silently handle specification loading errors
            }
          }
        } else {
          // Silently handle missing spec paths
        }
      } catch (error) {
        // Silently handle spec path processing errors
      }
    });

    this.endpointSpecs.set(endpoint.baseUrl, endpointSpecs);
  }

  /**
   * Recursively find all OpenAPI files in a directory
   * @param dirPath - Directory path to search
   * @returns Array of file paths
   */
  // eslint-disable-next-line class-methods-use-this
  private findOpenApiFiles(dirPath: string): string[] {
    const openApiFiles: string[] = [];

    const processDirectory = (currentPath: string): void => {
      const items = fs.readdirSync(currentPath);

      items.forEach((item) => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (ext === '.yml' || ext === '.yaml' || ext === '.json') {
            openApiFiles.push(fullPath);
          }
        }
      });
    };

    processDirectory(dirPath);
    return openApiFiles;
  }

  /**
   * Load a single OpenAPI specification from file
   * @param specPath - Path to the OpenAPI specification file
   * @returns OpenAPI specification object
   */
  // eslint-disable-next-line class-methods-use-this
  public loadSpecification(specPath: string): OpenAPISpec {
    try {
      const fullPath = path.resolve(specPath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const spec = yaml.load(fileContent) as OpenAPISpec;

      if (!spec.openapi) {
        throw errorHandler.createError(
          ErrorCode.INVALID_SPEC_FORMAT,
          'Invalid OpenAPI specification: missing openapi version',
          { filePath: specPath },
          ErrorSeverity.HIGH,
          false,
        );
      }

      return spec;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw errorHandler.createError(
        ErrorCode.SPEC_LOAD_FAILED,
        `Failed to load OpenAPI specification from ${specPath}: ${errorMessage}`,
        { filePath: specPath },
        ErrorSeverity.MEDIUM,
        true,
      );
    }
  }

  /**
   * Find the endpoint that matches a request URL
   * @param requestUrl - Request URL
   * @returns Matching endpoint or null
   */
  private findMatchingEndpoint(requestUrl: string): NocchinoEndpoint | null {
    const url = new URL(requestUrl);
    const requestHost = url.host;

    for (const endpoint of this.endpoints) {
      const endpointUrl = new URL(endpoint.baseUrl);
      if (endpointUrl.host === requestHost) {
        return endpoint;
      }
    }

    return null;
  }

  /**
   * Find the best matching specification for a request
   * @param requestDetails - Request details
   * @returns The best matching OpenAPI specification
   */
  private findBestMatchingSpec<TBody = unknown, TResponse = unknown>(
    requestDetails: RequestDetails<TBody, TResponse>,
  ): OpenAPISpec | null {
    const { url, method } = requestDetails;
    const requestUrl = new URL(url);
    const requestPath = requestUrl.pathname;

    // Find the matching endpoint
    const endpoint = this.findMatchingEndpoint(url);
    if (!endpoint) {
      // Log endpoint mismatch for debugging
      const availableEndpoints = this.endpoints.map((ep) => ep.baseUrl);
      errorHandler.handleError(
        createEndpointMismatchError(url, availableEndpoints, {
          requestDetails,
          method,
        }),
      );
      return null;
    }

    const endpointSpecs = this.endpointSpecs.get(endpoint.baseUrl);
    if (!endpointSpecs) {
      errorHandler.handleError(
        createSpecNotFoundError(url, {
          requestDetails,
          endpoint,
          method,
        }),
      );
      return null;
    }

    let bestMatch: OpenAPISpec | null = null;
    let bestScore = 0;

    Array.from(endpointSpecs.values()).forEach((spec) => {
      // Get the base URL from the spec
      const baseUrl = spec.servers?.[0]?.url || endpoint.baseUrl;
      const baseUrlObj = new URL(baseUrl);

      // Calculate the relative path for this spec
      let relativePath = requestPath;
      if (baseUrlObj.pathname !== '/') {
        relativePath = requestPath.replace(baseUrlObj.pathname, '') || '/';
      }

      const score = this.calculateSpecMatchScore(spec, relativePath, method);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = spec;
      }
    });

    return bestMatch;
  }

  /**
   * Calculate how well a specification matches a request
   * @param spec - OpenAPI specification
   * @param requestPath - Request path
   * @param method - HTTP method
   * @returns Match score (higher is better)
   */
  // eslint-disable-next-line class-methods-use-this
  private calculateSpecMatchScore(
    spec: OpenAPISpec,
    requestPath: string,
    method: string,
  ): number {
    let score = 0;
    const paths = spec.paths || {};

    for (const [pathTemplate, pathItem] of Object.entries(paths)) {
      const operation = pathItem[method.toLowerCase() as keyof OpenAPIPathItem];
      if (operation) {
        // Convert OpenAPI path template to regex
        const pathPattern = pathTemplate.replace(/\{([^}]+)\}/g, '[^/]+');
        const regex = new RegExp(`^${pathPattern}$`);

        if (regex.test(requestPath)) {
          // Exact path match gets highest score
          score += 100;
          // Longer paths get higher score (more specific)
          score += pathTemplate.split('/').length * 10;
        }
      }
    }

    return score;
  }

  /**
   * Generate mock response based on OpenAPI response schema
   * @param schema - OpenAPI response schema
   * @param options - Additional options for response generation
   * @returns Generated mock response
   */
  // eslint-disable-next-line class-methods-use-this
  public generateMockResponse<TResponse = unknown>(
    schema: OpenAPIResponse,
    options: MockResponseOptions = {},
  ): TResponse {
    try {
      // Handle different schema formats
      let responseSchema: OpenAPISchema | undefined = schema;

      if (schema.content && schema.content['application/json']) {
        responseSchema = schema.content['application/json'].schema;
      }

      if (schema.schema) {
        responseSchema = schema.schema;
      }

      if (!responseSchema) {
        return {} as TResponse;
      }

      // Handle $ref references - return empty object for now
      if (responseSchema.$ref) {
        return {} as TResponse;
      }

      // For now, return empty object - no preset schema generation
      const mockData = {};

      // Apply any custom transformations
      if (options.transform) {
        return options.transform(mockData) as TResponse;
      }

      return mockData as TResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to generate mock response for schema: ${errorMessage}`,
      );
      return {} as TResponse;
    }
  }

  /**
   * Setup Nock intercepts for all endpoints in an OpenAPI specification
   * @param spec - OpenAPI specification
   * @param baseUrl - Base URL for the API
   */
  public setupNockIntercepts(spec: OpenAPISpec, baseUrl: string): void {
    const scope = nock(baseUrl);

    // Setup intercepts for each path - sort by specificity (longer paths first)
    const paths = Object.entries(spec.paths).sort((a, b) => {
      // Sort by path length (longer paths first) to avoid regex conflicts
      const aLength = a[0].split('/').length;
      const bLength = b[0].split('/').length;
      return bLength - aLength;
    });

    for (const [pathKey, pathItem] of paths) {
      const methods: Array<keyof OpenAPIPathItem> = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options',
      ];

      for (const method of methods) {
        const operation = pathItem[method];
        if (operation && 'responses' in operation) {
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            pathKey,
            operation as OpenAPIOperation,
          );
        }
      }
    }

    // Store the scope for cleanup
    this.activeIntercepts.push(scope);
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
    operation: OpenAPIOperation,
  ): void {
    const { responses } = operation;

    // Find the appropriate response based on method
    let successResponse: OpenAPIResponse | undefined;
    let statusCode = 200;

    if (method === 'POST') {
      successResponse = responses['201'] || responses['200'];
      statusCode = responses['201'] ? 201 : 200;
    } else if (method === 'PUT') {
      successResponse = responses['200'] || responses['201'];
      statusCode = responses['201'] ? 201 : 200;
    } else {
      successResponse = responses['200'] || responses['201'] || responses['204'];
      if (responses['201']) {
        statusCode = 201;
      } else if (responses['204']) {
        statusCode = 204;
      } else {
        statusCode = 200;
      }
    }

    if (!successResponse) {
      // eslint-disable-next-line no-console
      console.warn(`No success response found for ${method} ${endpointPath}`);
      return;
    }

    // For POST/PUT requests, we'll generate mock request body data
    // This will be used to create dynamic responses that reflect the request
    let requestBodyData: any;
    if ((method === 'POST' || method === 'PUT') && operation.requestBody) {
      const requestSchema = operation.requestBody.content?.['application/json']?.schema;
      if (requestSchema) {
        // For now, use empty object - no preset schema generation
        requestBodyData = {};
      }
    }

    const mockResponse = this.generateMockResponse(successResponse, {
      requestBody: requestBodyData,
    });

    // Use the correct method name for nock
    const nockMethod = method.toLowerCase() as keyof Scope;
    if (typeof scope[nockMethod] === 'function') {
      // Use the exact path for now
      (scope[nockMethod] as any)(endpointPath).reply(statusCode, mockResponse);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Method ${method} not supported by nock scope`);
    }
  }

  /**
   * Activate Nock intercepts for a specific request
   * @param requestDetails - Request details to activate intercepts for
   */
  public activateNockForRequest<TBody = unknown, TResponse = unknown>(
    requestDetails: RequestDetails<TBody, TResponse>,
  ): void {
    try {
      const bestMatchingSpec = this.findBestMatchingSpec(requestDetails);
      if (!bestMatchingSpec) {
        // eslint-disable-next-line no-console
        console.warn(
          `No matching OpenAPI specification found for request: ${requestDetails.url}`,
        );
        return;
      }

      // Find the matching endpoint
      const endpoint = this.findMatchingEndpoint(requestDetails.url);
      if (!endpoint) {
        // eslint-disable-next-line no-console
        console.warn(
          `No matching endpoint found for request: ${requestDetails.url}`,
        );
        return;
      }

      // Extract the path from the request URL relative to the base URL
      const requestUrl = new URL(requestDetails.url);
      const baseUrlObj = new URL(endpoint.baseUrl);

      // Remove the base URL path from the request path
      let relativePath = requestUrl.pathname;
      if (baseUrlObj.pathname !== '/') {
        relativePath = requestUrl.pathname.replace(baseUrlObj.pathname, '') || '/';
      }

      // Handle version prefixes (e.g., /v1/users -> /users)
      const versionMatch = relativePath.match(/^\/v\d+\/(.+)$/);
      if (versionMatch) {
        relativePath = `/${versionMatch[1]}`;
      }

      // Set up only the specific intercept needed for this request
      this.setupSpecificIntercept(
        bestMatchingSpec,
        endpoint.baseUrl,
        requestDetails.method,
        relativePath,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.warn(`Failed to activate Nock for request: ${errorMessage}`);
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
    requestPath: string,
  ): void {
    const scope = nock(baseUrl);

    // Find the matching path in the OpenAPI spec
    const matchingPath = this.findMatchingPath(spec.paths, requestPath);

    if (matchingPath) {
      const pathItem = spec.paths[matchingPath];
      if (pathItem) {
        const operation = pathItem[method.toLowerCase() as keyof OpenAPIPathItem];

        if (operation && 'responses' in operation) {
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            requestPath,
            operation as OpenAPIOperation,
          );
        }
      }
    }

    // Store the scope for cleanup
    this.activeIntercepts.push(scope);
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
    requestPath: string,
  ): string | null {
    // Sort paths by length (longest first) to match most specific paths first
    const sortedPaths = Object.keys(paths).sort((a, b) => {
      const aLength = a.split('/').length;
      const bLength = b.split('/').length;
      return bLength - aLength;
    });

    for (const specPath of sortedPaths) {
      // Convert OpenAPI path to regex pattern
      const pathPattern = specPath.replace(/\{([^}]+)\}/g, '[^/]+');
      const regex = new RegExp(`^${pathPattern}$`);

      if (regex.test(requestPath)) {
        return specPath;
      }
    }

    // If no exact match, try matching without version prefix
    const versionMatch = requestPath.match(/^\/v\d+\/(.+)$/);
    if (versionMatch) {
      const pathWithoutVersion = `/${versionMatch[1]}`;
      for (const specPath of sortedPaths) {
        const pathPattern = specPath.replace(/\{([^}]+)\}/g, '[^/]+');
        const regex = new RegExp(`^${pathPattern}$`);

        if (regex.test(pathWithoutVersion)) {
          return specPath;
        }
      }
    }

    return null;
  }

  /**
   * Restore Nock to clean state
   */
  public restoreNock(): void {
    // Clean up active intercepts
    for (const scope of this.activeIntercepts) {
      scope.persist(false);
    }

    // Clean up all Nock intercepts
    nock.cleanAll();
    this.activeIntercepts = [];
  }

  /**
   * Get current repository state
   * @returns Repository state information
   */
  public getState(): RepositoryState {
    return {
      activeIntercepts: this.activeIntercepts.length,
      endpoints: this.endpoints,
      specMapSize: this.specMap.size,
    };
  }
}

// Singleton instance
const dynamicNockRepo = new DynamicNockRepository();

// Export convenience functions
export const initialize = (endpoints: NocchinoEndpoint[]): void => dynamicNockRepo.initialize(endpoints);

export const configure = (config: NocchinoConfig): void => dynamicNockRepo.configure(config);

export const activateNockForRequest = <TBody = unknown, TResponse = unknown>(
  requestDetails: RequestDetails<TBody, TResponse>,
): void => dynamicNockRepo.activateNockForRequest(requestDetails);

export const restoreNock = (): void => dynamicNockRepo.restoreNock();

export const getState = (): RepositoryState => dynamicNockRepo.getState();

export { dynamicNockRepo as repository };
