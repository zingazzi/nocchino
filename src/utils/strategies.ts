/**
 * Strategy Pattern Implementations for Nocchino
 *
 * This module contains various strategy implementations for:
 * - Mock generation strategies
 * - Caching strategies
 * - Error recovery strategies
 */

import jsf from 'json-schema-faker';

import type {
  MockGenerationStrategy,
  CachingStrategy,
  ErrorRecoveryStrategy,
  OpenAPISchema,
  MockResponseOptions,
  NocchinoError,
} from '../types';

import { debugError } from './debugger';
import { ErrorCode, ErrorSeverity } from './errorHandler';

// eslint-disable-next-line max-classes-per-file

// ===== MOCK GENERATION STRATEGIES =====

/**
 * JSON Schema Faker Strategy
 * Uses json-schema-faker to generate realistic mock data
 */
export class JsonSchemaFakerStrategy implements MockGenerationStrategy {
  constructor() {
    // Configure jsf for better fake data generation
    jsf.extend('faker', () => require('@faker-js/faker'));
    jsf.option({
      alwaysFakeOptionals: true,
      maxItems: 5,
      maxLength: 10,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public canHandle(schema: OpenAPISchema): boolean {
    return schema && typeof schema === 'object';
  }

  // eslint-disable-next-line class-methods-use-this
  public generate(schema: OpenAPISchema, options: MockResponseOptions = {}): unknown {
    try {
      const mockData = jsf.generate(schema as Parameters<typeof jsf.generate>[0]);

      // Apply transformation if provided
      if (options.transform) {
        return options.transform(mockData);
      }

      return mockData;
    } catch (error) {
      // Log error but continue with fallback
      return {};
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public getStrategyName(): string {
    return 'JsonSchemaFaker';
  }
}

/**
 * Empty Object Strategy
 * Returns empty objects for all schemas (fallback strategy)
 */
export class EmptyObjectStrategy implements MockGenerationStrategy {
  // eslint-disable-next-line class-methods-use-this
  public canHandle(_schema: OpenAPISchema): boolean {
    return true; // Can handle any schema
  }

  // eslint-disable-next-line class-methods-use-this
  public generate(_schema: OpenAPISchema, _options: MockResponseOptions = {}): unknown {
    return {};
  }

  // eslint-disable-next-line class-methods-use-this
  public getStrategyName(): string {
    return 'EmptyObject';
  }
}

/**
 * Custom Data Strategy
 * Allows custom data generation based on schema properties
 */
export class CustomDataStrategy implements MockGenerationStrategy {
  private customGenerators: Map<string, (schema: OpenAPISchema) => unknown> = new Map();

  constructor() {
    this.setupDefaultGenerators();
  }

  private setupDefaultGenerators(): void {
    // User-related generators
    this.customGenerators.set('user', () => ({
      id: Math.floor(Math.random() * 1000),
      name: 'John Doe',
      email: 'john.doe@example.com',
    }));

    // Product-related generators
    this.customGenerators.set('product', () => ({
      id: Math.floor(Math.random() * 1000),
      name: 'Sample Product',
      price: 99.99,
      category: 'electronics',
    }));
  }

  public addCustomGenerator(name: string, generator: (schema: OpenAPISchema) => unknown): void {
    this.customGenerators.set(name, generator);
  }

  // eslint-disable-next-line class-methods-use-this
  public canHandle(schema: OpenAPISchema): boolean {
    return schema && typeof schema === 'object';
  }

  public generate(schema: OpenAPISchema, _options: MockResponseOptions = {}): unknown {
    // Try to find a custom generator based on schema title or description
    const schemaTitle = schema.title?.toLowerCase() || '';
    const schemaDescription = schema.description?.toLowerCase() || '';

    // eslint-disable-next-line no-restricted-syntax
    for (const [name, generator] of this.customGenerators) {
      if (schemaTitle.includes(name) || schemaDescription.includes(name)) {
        return generator(schema);
      }
    }

    // Fallback to empty object
    return {};
  }

  // eslint-disable-next-line class-methods-use-this
  public getStrategyName(): string {
    return 'CustomData';
  }
}

// ===== CACHING STRATEGIES =====

/**
 * Memory Cache Strategy
 * Simple in-memory caching with TTL support
 */
export class MemoryCacheStrategy implements CachingStrategy {
  private cache = new Map<string, { value: unknown; expires: number }>();

  private maxSize: number = 1000;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  public set<T>(key: string, value: T, ttl: number = 300000): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, expires: Date.now() + ttl });
  }

  public clear(): void {
    this.cache.clear();
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public getSize(): number {
    return this.cache.size;
  }

  public getMaxSize(): number {
    return this.maxSize;
  }
}

/**
 * No Cache Strategy
 * Disables caching entirely
 */
export class NoCacheStrategy implements CachingStrategy {
  // eslint-disable-next-line class-methods-use-this
  public get<T>(_key: string): T | null {
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  public set<T>(_key: string, _value: T, _ttl?: number): void {
    // Do nothing
  }

  // eslint-disable-next-line class-methods-use-this
  public clear(): void {
    // Do nothing
  }

  // eslint-disable-next-line class-methods-use-this
  public has(_key: string): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  public delete(_key: string): boolean {
    return false;
  }
}

// ===== ERROR RECOVERY STRATEGIES =====

/**
 * Retry Strategy
 * Attempts to retry operations that failed
 */
export class RetryStrategy implements ErrorRecoveryStrategy {
  private maxRetries: number = 3;

  private retryDelay: number = 1000;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  public canHandle(error: NocchinoError): boolean {
    return error.recoverable && (error.retryCount || 0) < this.maxRetries;
  }

  public async handle(error: NocchinoError): Promise<void> {
    if (!this.canHandle(error)) {
      throw error;
    }

    const retryCount = (error.retryCount || 0) + 1;
    // eslint-disable-next-line no-param-reassign
    error.retryCount = retryCount;
    // eslint-disable-next-line no-param-reassign
    error.maxRetries = this.maxRetries;

    // Wait before retry
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay * retryCount));

    debugError(error, {
      context: 'retry-strategy',
      retryCount,
      message: `Retrying operation (${retryCount}/${this.maxRetries})`,
    });
  }

  public getStrategyName(): string {
    return 'Retry';
  }
}

/**
 * Fallback Strategy
 * Provides fallback behavior when operations fail
 */
export class FallbackStrategy implements ErrorRecoveryStrategy {
  private fallbackActions: Map<ErrorCode, () => void> = new Map();

  constructor() {
    this.setupDefaultFallbacks();
  }

  private setupDefaultFallbacks(): void {
    this.fallbackActions.set(ErrorCode.SPEC_NOT_FOUND, () => {
      // Fallback: No specification found, returning empty response
    });

    this.fallbackActions.set(ErrorCode.ENDPOINT_MISMATCH, () => {
      // Fallback: Endpoint mismatch, skipping request
    });

    this.fallbackActions.set(ErrorCode.MOCK_GENERATION_FAILED, () => {
      // Fallback: Mock generation failed, returning empty object
    });
  }

  public addFallbackAction(errorCode: ErrorCode, action: () => void): void {
    this.fallbackActions.set(errorCode, action);
  }

  public canHandle(error: NocchinoError): boolean {
    return this.fallbackActions.has(error.code as ErrorCode);
  }

  // eslint-disable-next-line require-await
  public async handle(error: NocchinoError): Promise<void> {
    const fallbackAction = this.fallbackActions.get(error.code as ErrorCode);
    if (fallbackAction) {
      try {
        fallbackAction();
      } catch (fallbackError) {
        // Silently handle fallback errors
        debugError(error, { context: 'fallback-strategy', fallbackError });
      }
    }
  }

  public getStrategyName(): string {
    return 'Fallback';
  }
}

/**
 * Log and Continue Strategy
 * Logs errors but continues execution
 */
export class LogAndContinueStrategy implements ErrorRecoveryStrategy {
  // eslint-disable-next-line class-methods-use-this
  public canHandle(error: NocchinoError): boolean {
    return error.severity === ErrorSeverity.LOW || error.severity === ErrorSeverity.MEDIUM;
  }

  // eslint-disable-next-line require-await
  public async handle(error: NocchinoError): Promise<void> {
    debugError(error, { context: 'log-and-continue', message: 'Log and continue' });
  }

  // eslint-disable-next-line class-methods-use-this
  public getStrategyName(): string {
    return 'LogAndContinue';
  }
}

/**
 * Abort Strategy
 * Immediately stops execution on any error
 */
export class AbortStrategy implements ErrorRecoveryStrategy {
  // eslint-disable-next-line class-methods-use-this
  public canHandle(error: NocchinoError): boolean {
    return error.severity === ErrorSeverity.CRITICAL;
  }

  // eslint-disable-next-line require-await
  public async handle(error: NocchinoError): Promise<void> {
    debugError(error, { context: 'abort-strategy', message: 'Critical error, aborting' });
    throw error;
  }

  // eslint-disable-next-line class-methods-use-this
  public getStrategyName(): string {
    return 'Abort';
  }
}
