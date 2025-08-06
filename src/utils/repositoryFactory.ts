/**
 * Repository Factory - Dependency Injection Implementation
 *
 * This module provides factory methods to create repository instances
 * with different configurations and strategies.
 */

import type {
  RepositoryConfig,
  INockRepository,
  IEventManager,
  IMockGenerationStrategy,
  ICachingStrategy,
  IErrorRecoveryStrategy,
} from '../types';

import {
  EnhancedMemoryCacheStrategy,
  TieredCacheStrategy,
  RedisLikeCacheStrategy,
} from './cacheSystem';
import { EventManager } from './eventManager';
import {
  JsonSchemaFakerStrategy,
  EmptyObjectStrategy,
  CustomDataStrategy,
  MemoryCacheStrategy,
  NoCacheStrategy,
  RetryStrategy,
  FallbackStrategy,
  LogAndContinueStrategy,
  AbortStrategy,
} from './strategies';

// eslint-disable-next-line max-classes-per-file

/**
 * Factory class for creating Nock repository instances
 * with different configurations and strategies
 */
export class NockRepositoryFactory {
  /**
   * Create a basic repository with default strategies
   * @returns Repository instance with default configuration
   */
  public static createBasic(): INockRepository {
    const config: RepositoryConfig = {
      eventManager: new EventManager(),
      mockGenerationStrategy: new JsonSchemaFakerStrategy(),
      cachingStrategy: new EnhancedMemoryCacheStrategy(),
      errorRecoveryStrategies: [
        new RetryStrategy(),
        new FallbackStrategy(),
        new LogAndContinueStrategy(),
      ],
      enableDebugging: false,
      enablePerformanceMonitoring: false,
    };

    return this.createWithConfig(config);
  }

  /**
   * Create a repository optimized for performance
   * @returns Repository instance with performance optimizations
   */
  public static createPerformanceOptimized(): INockRepository {
    const config: RepositoryConfig = {
      eventManager: new EventManager(),
      mockGenerationStrategy: new EmptyObjectStrategy(), // Fastest strategy
      cachingStrategy: new TieredCacheStrategy(100, 2000), // Tiered cache for performance
      errorRecoveryStrategies: [
        new LogAndContinueStrategy(), // Minimal error handling for speed
      ],
      enableDebugging: false,
      enablePerformanceMonitoring: true,
    };

    return this.createWithConfig(config);
  }

  /**
   * Create a repository optimized for debugging
   * @returns Repository instance with debugging features
   */
  public static createDebugOptimized(): INockRepository {
    const config: RepositoryConfig = {
      eventManager: new EventManager(),
      mockGenerationStrategy: new CustomDataStrategy(),
      cachingStrategy: new NoCacheStrategy(), // No cache for easier debugging
      errorRecoveryStrategies: [
        new AbortStrategy(), // Stop on any error for debugging
        new LogAndContinueStrategy(),
      ],
      enableDebugging: true,
      enablePerformanceMonitoring: true,
    };

    return this.createWithConfig(config);
  }

  /**
   * Create a repository with custom configuration
   * @param config - Custom configuration
   * @returns Repository instance with custom configuration
   */
  public static createWithConfig(config: RepositoryConfig): INockRepository {
    // Import here to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { DynamicNockRepository } = require('./dynamicNock');

    return new DynamicNockRepository(config);
  }

  /**
   * Create a repository with custom strategies
   * @param options - Strategy options
   * @returns Repository instance with custom strategies
   */
  public static createWithCustomStrategies(options: {
    mockGenerationStrategy?: IMockGenerationStrategy;
    cachingStrategy?: ICachingStrategy;
    errorRecoveryStrategies?: IErrorRecoveryStrategy[];
    eventManager?: IEventManager;
  }): INockRepository {
    const config: RepositoryConfig = {
      eventManager: options.eventManager || new EventManager(),
      mockGenerationStrategy: options.mockGenerationStrategy || new JsonSchemaFakerStrategy(),
      cachingStrategy: options.cachingStrategy || new MemoryCacheStrategy(),
      errorRecoveryStrategies: options.errorRecoveryStrategies || [
        new RetryStrategy(),
        new FallbackStrategy(),
        new LogAndContinueStrategy(),
      ],
      enableDebugging: false,
      enablePerformanceMonitoring: false,
    };

    return this.createWithConfig(config);
  }

  /**
   * Create a repository for testing purposes
   * @returns Repository instance optimized for testing
   */
  public static createForTesting(): INockRepository {
    const config: RepositoryConfig = {
      eventManager: new EventManager(),
      mockGenerationStrategy: new CustomDataStrategy(),
      cachingStrategy: new NoCacheStrategy(), // No cache for predictable tests
      errorRecoveryStrategies: [
        new LogAndContinueStrategy(), // Continue on errors for tests
      ],
      enableDebugging: true,
      enablePerformanceMonitoring: false,
    };

    return this.createWithConfig(config);
  }

  /**
   * Create a repository for production use
   * @returns Repository instance optimized for production
   */
  public static createForProduction(): INockRepository {
    const config: RepositoryConfig = {
      eventManager: new EventManager(),
      mockGenerationStrategy: new JsonSchemaFakerStrategy(),
      cachingStrategy: new RedisLikeCacheStrategy(5000), // Redis-like cache for production
      errorRecoveryStrategies: [
        new RetryStrategy(5, 2000), // More retries with longer delays
        new FallbackStrategy(),
        new LogAndContinueStrategy(),
      ],
      enableDebugging: false,
      enablePerformanceMonitoring: true,
    };

    return this.createWithConfig(config);
  }

  /**
   * Get available strategy types for configuration
   * @returns Object with available strategy types
   */
  public static getAvailableStrategies() {
    return {
      mockGeneration: {
        JsonSchemaFaker: JsonSchemaFakerStrategy,
        EmptyObject: EmptyObjectStrategy,
        CustomData: CustomDataStrategy,
      },
      caching: {
        MemoryCache: MemoryCacheStrategy,
        EnhancedMemoryCache: EnhancedMemoryCacheStrategy,
        TieredCache: TieredCacheStrategy,
        RedisLikeCache: RedisLikeCacheStrategy,
        NoCache: NoCacheStrategy,
      },
      errorRecovery: {
        Retry: RetryStrategy,
        Fallback: FallbackStrategy,
        LogAndContinue: LogAndContinueStrategy,
        Abort: AbortStrategy,
      },
    };
  }

  /**
   * Create a strategy instance by name
   * @param strategyType - Type of strategy
   * @param strategyName - Name of the strategy
   * @param options - Strategy options
   * @returns Strategy instance
   */
  public static createStrategy(
    strategyType: 'mockGeneration' | 'caching' | 'errorRecovery',
    strategyName: string,
    options?: Record<string, unknown>,
  ): IMockGenerationStrategy | ICachingStrategy | IErrorRecoveryStrategy {
    const strategies = this.getAvailableStrategies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategyMap = strategies[strategyType] as Record<string, any>;
    const StrategyClass = strategyMap[strategyName];

    if (!StrategyClass) {
      throw new Error(`Unknown ${strategyType} strategy: ${strategyName}`);
    }

    return new StrategyClass(options);
  }
}

/**
 * Configuration builder for creating repository configurations
 */
export class RepositoryConfigBuilder {
  private config: RepositoryConfig = {
    eventManager: new EventManager(),
    mockGenerationStrategy: new JsonSchemaFakerStrategy(),
    cachingStrategy: new EnhancedMemoryCacheStrategy(),
    errorRecoveryStrategies: [
      new RetryStrategy(),
      new FallbackStrategy(),
      new LogAndContinueStrategy(),
    ],
    enableDebugging: false,
    enablePerformanceMonitoring: false,
  };

  /**
   * Set the event manager
   * @param eventManager - Event manager instance
   * @returns Builder instance
   */
  public withEventManager(eventManager: IEventManager): RepositoryConfigBuilder {
    this.config.eventManager = eventManager;
    return this;
  }

  /**
   * Set the mock generation strategy
   * @param strategy - Mock generation strategy
   * @returns Builder instance
   */
  public withMockGenerationStrategy(strategy: IMockGenerationStrategy): RepositoryConfigBuilder {
    this.config.mockGenerationStrategy = strategy;
    return this;
  }

  /**
   * Set the caching strategy
   * @param strategy - Caching strategy
   * @returns Builder instance
   */
  public withCachingStrategy(strategy: ICachingStrategy): RepositoryConfigBuilder {
    this.config.cachingStrategy = strategy;
    return this;
  }

  /**
   * Set the error recovery strategies
   * @param strategies - Array of error recovery strategies
   * @returns Builder instance
   */
  public withErrorRecoveryStrategies(strategies: IErrorRecoveryStrategy[]): RepositoryConfigBuilder {
    this.config.errorRecoveryStrategies = strategies;
    return this;
  }

  /**
   * Enable or disable debugging
   * @param enabled - Whether to enable debugging
   * @returns Builder instance
   */
  public withDebugging(enabled: boolean): RepositoryConfigBuilder {
    this.config.enableDebugging = enabled;
    return this;
  }

  /**
   * Enable or disable performance monitoring
   * @param enabled - Whether to enable performance monitoring
   * @returns Builder instance
   */
  public withPerformanceMonitoring(enabled: boolean): RepositoryConfigBuilder {
    this.config.enablePerformanceMonitoring = enabled;
    return this;
  }

  /**
   * Build the repository configuration
   * @returns Repository configuration
   */
  public build(): RepositoryConfig {
    return { ...this.config };
  }

  /**
   * Build and create a repository instance
   * @returns Repository instance
   */
  public buildRepository(): INockRepository {
    return NockRepositoryFactory.createWithConfig(this.build());
  }
}
