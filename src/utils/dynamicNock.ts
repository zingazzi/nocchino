import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';
import jsf from 'json-schema-faker';
import nock from 'nock';
import type { Scope } from 'nock';

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
} from '../types';

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
  private specMap: Map<string, Record<string, string>>;

  private defaultSpec: string | null;

  private baseUrl: string | null;

  private activeIntercepts: Scope[];

  constructor() {
    this.specMap = new Map();
    this.defaultSpec = null;
    this.baseUrl = null;
    this.activeIntercepts = [];

    // Configure jsf for better fake data generation
    jsf.extend('faker', () => require('@faker-js/faker'));
    jsf.option({
      alwaysFakeOptionals: true,
      maxItems: 5,
      maxLength: 10,
    });
  }

  /**
   * Configure the repository with mapping rules and default settings
   * @param config - Configuration object
   */
  public configure(config: NocchinoConfig): void {
    if (config.specMap) {
      this.specMap = new Map(Object.entries(config.specMap));
    }
    if (config.defaultSpec) {
      this.defaultSpec = config.defaultSpec;
    }
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Load and parse an OpenAPI specification file
   * @param specPath - Path to the OpenAPI YAML file
   * @returns Parsed OpenAPI specification
   */
  public loadSpecification(specPath: string): OpenAPISpec {
    try {
      const fullPath = path.resolve(specPath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const spec = yaml.load(fileContent) as OpenAPISpec;

      if (!spec.openapi) {
        throw new Error(
          'Invalid OpenAPI specification: missing openapi version',
        );
      }

      return spec;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to load OpenAPI specification from ${specPath}: ${errorMessage}`,
      );
    }
  }

  /**
   * Map a request to the appropriate OpenAPI specification based on headers
   * @param requestDetails - Request details including headers
   * @returns Path to the appropriate OpenAPI specification file
   */
  public mapRequestToSpec(requestDetails: RequestDetails): string {
    const { headers = {} } = requestDetails;

    // Check each header mapping
    for (const [headerKey, headerValues] of this.specMap) {
      const headerValue = headers[headerKey];
      if (headerValue && headerValues[headerValue]) {
        return headerValues[headerValue];
      }
    }

    // Fallback to default spec
    if (this.defaultSpec) {
      return this.defaultSpec;
    }

    throw new Error('No OpenAPI specification found for request');
  }

  /**
   * Generate mock response based on OpenAPI response schema
   * @param schema - OpenAPI response schema
   * @param options - Additional options for response generation
   * @returns Generated mock response
   */
  public generateMockResponse(
    schema: OpenAPIResponse,
    options: MockResponseOptions = {},
  ): any {
    try {
      const responseSchema = schema.schema || { type: 'object' };
      const mockData = jsf.generate(responseSchema as any);

      if (options.transform) {
        return options.transform(mockData);
      }

      return mockData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to generate mock response: ${errorMessage}`);
      return { error: 'Failed to generate mock response' };
    }
  }

  /**
   * Setup Nock intercepts for all endpoints in an OpenAPI specification
   * @param spec - OpenAPI specification
   * @param baseUrl - Base URL for the API
   */
  public setupNockIntercepts(spec: OpenAPISpec, baseUrl: string): void {
    const scope = nock(baseUrl);

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
      ];

      for (const method of methods) {
        const operation = pathItem[method];
        if (operation && 'responses' in operation) {
          this.setupEndpointIntercept(
            scope,
            method.toUpperCase() as HTTPMethod,
            path,
            operation as OpenAPIOperation,
          );
        }
      }
    }
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
    operation: OpenAPIOperation,
  ): void {
    const { responses } = operation;
    const successResponse = responses['200'] || responses['201'] || responses['204'];

    if (!successResponse) {
      console.warn(`No success response found for ${method} ${path}`);
      return;
    }

    const mockResponse = this.generateMockResponse(successResponse);
    (scope as any)[method.toLowerCase()](path).reply(200, mockResponse);
  }

  /**
   * Activate Nock intercepts for a specific request
   * @param requestDetails - Request details
   */
  public activateNockForRequest(requestDetails: RequestDetails): void {
    try {
      const specPath = this.mapRequestToSpec(requestDetails);
      const spec = this.loadSpecification(specPath);
      const baseUrl = this.extractBaseUrl(requestDetails.url);

      this.setupNockIntercepts(spec, baseUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to activate Nock for request: ${errorMessage}`);
    }
  }

  /**
   * Extract base URL from a full URL
   * @param url - Full URL
   * @returns Base URL
   */
  private extractBaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      // Fallback for relative URLs
      const urlParts = url.split('/');
      return `${urlParts[0]}//${urlParts[2]}`;
    }
  }

  /**
   * Restore Nock to clean state
   */
  public restoreNock(): void {
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
      baseUrl: this.baseUrl,
      defaultSpec: this.defaultSpec,
      specMapSize: this.specMap.size,
    };
  }
}

// Singleton instance
const dynamicNockRepo = new DynamicNockRepository();

// Export convenience functions
export const configure = (config: NocchinoConfig): void => dynamicNockRepo.configure(config);

export const activateNockForRequest = (requestDetails: RequestDetails): void => dynamicNockRepo.activateNockForRequest(requestDetails);

export const restoreNock = (): void => dynamicNockRepo.restoreNock();

export const getState = (): RepositoryState => dynamicNockRepo.getState();

export { dynamicNockRepo as repository };
