/**
 * Architecture Example - Observer, Strategy, and Dependency Injection Patterns
 *
 * This example demonstrates how to use the new architecture components:
 * - Observer Pattern: Event-driven architecture
 * - Strategy Pattern: Pluggable strategies for different behaviors
 * - Dependency Injection: Flexible configuration and testing
 */

import {
  NockRepositoryFactory,
  RepositoryConfigBuilder,
  JsonSchemaFakerStrategy,
  CustomDataStrategy,
  MemoryCacheStrategy,
  RetryStrategy,
  FallbackStrategy,
  LogAndContinueStrategy,
} from '../src';
import type {
  NockEventListener,
  RequestDetails,
  MockResponse,
  NocchinoError,
  OpenAPISpec,
  NocchinoEndpoint,
} from '../src/types';
import { EventManager } from '../src/utils/eventManager';

// ===== OBSERVER PATTERN EXAMPLE =====

/**
 * Custom Event Listener for logging
 */
class LoggingEventListener implements NockEventListener {
  public onRequestStarted(request: RequestDetails): void {
    console.log(`🔍 [Observer] Request started: ${request.method} ${request.url}`);
  }

  public onRequestCompleted(response: MockResponse): void {
    console.log(`✅ [Observer] Request completed: ${response.status} (${response.duration}ms)`);
  }

  public onError(error: NocchinoError): void {
    console.error(`❌ [Observer] Error occurred: ${error.message}`);
  }

  public onSpecificationLoaded(spec: OpenAPISpec): void {
    console.log(`📄 [Observer] Specification loaded: ${spec.info.title} v${spec.info.version}`);
  }

  public onEndpointConfigured(endpoint: NocchinoEndpoint): void {
    console.log(`🔧 [Observer] Endpoint configured: ${endpoint.baseUrl}`);
  }
}

/**
 * Performance Monitoring Event Listener
 */
class PerformanceEventListener implements NockEventListener {
  private requestCount = 0;

  private totalDuration = 0;

  public onRequestStarted(request: RequestDetails): void {
    this.requestCount++;
    console.log(`📊 [Performance] Request #${this.requestCount}: ${request.method} ${request.url}`);
  }

  public onRequestCompleted(response: MockResponse): void {
    this.totalDuration += response.duration || 0;
    const avgDuration = this.totalDuration / this.requestCount;
    console.log(`📊 [Performance] Avg duration: ${avgDuration.toFixed(2)}ms`);
  }

  public onError(error: NocchinoError): void {
    console.error(`📊 [Performance] Error in request #${this.requestCount}: ${error.message}`);
  }

  public onSpecificationLoaded(spec: OpenAPISpec): void {
    console.log(`📊 [Performance] Spec loaded: ${Object.keys(spec.paths).length} paths`);
  }

  public onEndpointConfigured(endpoint: NocchinoEndpoint): void {
    console.log(`📊 [Performance] Endpoint: ${endpoint.specs.length} specs`);
  }
}

// ===== STRATEGY PATTERN EXAMPLE =====

/**
 * Custom Mock Generation Strategy for User Data
 */
class UserDataStrategy extends CustomDataStrategy {
  constructor() {
    super();

    // Add custom generators for user-related schemas
    this.addCustomGenerator('user', () => ({
      id: Math.floor(Math.random() * 10000),
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    }));

    this.addCustomGenerator('admin', () => ({
      id: Math.floor(Math.random() * 10000),
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: new Date().toISOString(),
    }));
  }

  public override getStrategyName(): string {
    return 'UserData';
  }
}

// ===== DEPENDENCY INJECTION EXAMPLE =====

/**
 * Example demonstrating the new architecture patterns
 */
async function demonstrateArchitecture(): Promise<void> {
  console.log('🚀 Nocchino Architecture Example');
  console.log('================================\n');

  // ===== 1. OBSERVER PATTERN =====
  console.log('1. Observer Pattern Example');
  console.log('----------------------------');

  // Create event listeners
  const loggingListener = new LoggingEventListener();
  const performanceListener = new PerformanceEventListener();

  // Create event manager and add listeners
  const eventManager = new EventManager();
  eventManager.addListener(loggingListener);
  eventManager.addListener(performanceListener);

  // Demonstrate event notifications
  eventManager.notifyRequestStarted({
    url: 'https://api.example.com/v1/users',
    method: 'GET',
  });

  eventManager.notifyRequestCompleted({
    data: { users: [] },
    status: 200,
    duration: 150,
    specMatched: 'users-api.yml',
    endpointMatched: 'https://api.example.com',
  });

  eventManager.notifySpecificationLoaded({
    openapi: '3.0.0',
    info: { title: 'Users API', version: '1.0.0' },
    paths: { '/users': { get: { responses: { 200: { description: 'Success' } } } } },
  });

  console.log('\n');

  // ===== 2. STRATEGY PATTERN =====
  console.log('2. Strategy Pattern Example');
  console.log('----------------------------');

  // Create different mock generation strategies
  const jsonSchemaStrategy = new JsonSchemaFakerStrategy();
  const userDataStrategy = new UserDataStrategy();

  // Demonstrate different strategies
  const testSchema = {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      email: { type: 'string' },
    },
  };

  console.log('JSON Schema Faker Strategy:');
  const jsonSchemaResult = jsonSchemaStrategy.generate(testSchema);
  console.log('  Result:', jsonSchemaResult);

  console.log('User Data Strategy:');
  const userDataResult = userDataStrategy.generate(testSchema);
  console.log('  Result:', userDataResult);

  console.log('\n');

  // ===== 3. DEPENDENCY INJECTION =====
  console.log('3. Dependency Injection Example');
  console.log('--------------------------------');

  // Method 1: Using Factory with predefined configurations
  console.log('Method 1: Factory with predefined configurations');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const basicRepo = NockRepositoryFactory.createBasic();
  console.log('  Basic repository created');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const performanceRepo = NockRepositoryFactory.createPerformanceOptimized();
  console.log('  Performance-optimized repository created');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const debugRepo = NockRepositoryFactory.createDebugOptimized();
  console.log('  Debug-optimized repository created');

  // Method 2: Using Builder pattern
  console.log('\nMethod 2: Builder pattern');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const customRepo = new RepositoryConfigBuilder()
    .withEventManager(eventManager)
    .withMockGenerationStrategy(userDataStrategy)
    .withCachingStrategy(new MemoryCacheStrategy(1000))
    .withErrorRecoveryStrategies([
      new RetryStrategy(3, 1000),
      new FallbackStrategy(),
      new LogAndContinueStrategy(),
    ])
    .withDebugging(true)
    .withPerformanceMonitoring(true)
    .buildRepository();

  console.log('  Custom repository created with builder');

  // Method 3: Using Factory with custom strategies
  console.log('\nMethod 3: Factory with custom strategies');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const customStrategyRepo = NockRepositoryFactory.createWithCustomStrategies({
    mockGenerationStrategy: userDataStrategy,
    cachingStrategy: new MemoryCacheStrategy(500),
    errorRecoveryStrategies: [
      new RetryStrategy(2, 500),
      new LogAndContinueStrategy(),
    ],
    eventManager,
  });

  console.log('  Custom strategy repository created');

  console.log('\n');

  // ===== 4. INTEGRATION EXAMPLE =====
  console.log('4. Integration Example');
  console.log('----------------------');

  // Create a repository with all patterns working together
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const integratedRepo = new RepositoryConfigBuilder()
    .withEventManager(eventManager)
    .withMockGenerationStrategy(userDataStrategy)
    .withCachingStrategy(new MemoryCacheStrategy(2000))
    .withErrorRecoveryStrategies([
      new RetryStrategy(3, 1000),
      new FallbackStrategy(),
      new LogAndContinueStrategy(),
    ])
    .withDebugging(true)
    .withPerformanceMonitoring(true)
    .buildRepository();

  console.log('✅ Integrated repository created with:');
  console.log('  - Observer Pattern: Event-driven architecture');
  console.log('  - Strategy Pattern: Pluggable strategies');
  console.log('  - Dependency Injection: Flexible configuration');

  // Demonstrate the integration
  try {
    // This would normally be called by the repository
    eventManager.notifyRequestStarted({
      url: 'https://api.example.com/v1/users/123',
      method: 'GET',
    });

    // Simulate mock generation with custom strategy
    const mockData = userDataStrategy.generate(testSchema);
    console.log('  Generated mock data:', mockData);

    eventManager.notifyRequestCompleted({
      data: mockData,
      status: 200,
      duration: 75,
      specMatched: 'users-api.yml',
      endpointMatched: 'https://api.example.com',
    });
  } catch (error) {
    console.error('  Error in integration example:', error);
  }

  console.log('\n🎉 Architecture demonstration completed!');
}

// ===== USAGE EXAMPLES =====

/**
 * Example: Creating different repository types for different use cases
 */
function demonstrateUseCases(): void {
  console.log('\n📋 Use Case Examples');
  console.log('====================\n');

  // Use Case 1: Development/Testing
  console.log('1. Development/Testing Repository');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const devRepo = NockRepositoryFactory.createForTesting();
  console.log('   - Optimized for debugging');
  console.log('   - Custom data strategies');
  console.log('   - No caching for predictability');
  console.log('   - Continue on errors');

  // Use Case 2: Production
  console.log('\n2. Production Repository');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prodRepo = NockRepositoryFactory.createForProduction();
  console.log('   - Performance optimized');
  console.log('   - Large cache for efficiency');
  console.log('   - Robust error recovery');
  console.log('   - Monitoring enabled');

  // Use Case 3: Performance Testing
  console.log('\n3. Performance Testing Repository');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const perfRepo = NockRepositoryFactory.createPerformanceOptimized();
  console.log('   - Fastest mock generation');
  console.log('   - Large cache');
  console.log('   - Minimal error handling');
  console.log('   - Performance monitoring');

  // Use Case 4: Custom Configuration
  console.log('\n4. Custom Configuration Repository');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const customRepo = new RepositoryConfigBuilder()
    .withMockGenerationStrategy(new UserDataStrategy())
    .withCachingStrategy(new MemoryCacheStrategy(3000))
    .withErrorRecoveryStrategies([
      new RetryStrategy(5, 2000),
      new FallbackStrategy(),
    ])
    .withDebugging(false)
    .withPerformanceMonitoring(true)
    .buildRepository();

  console.log('   - Custom user data strategy');
  console.log('   - Large cache (3000 items)');
  console.log('   - Aggressive retry strategy');
  console.log('   - Performance monitoring only');
}

// Run the examples
if (require.main === module) {
  demonstrateArchitecture()
    .then(() => {
      demonstrateUseCases();
    })
    .catch((error) => {
      console.error('Error running architecture example:', error);
    });
}

export {
  demonstrateArchitecture,
  demonstrateUseCases,
  LoggingEventListener,
  PerformanceEventListener,
  UserDataStrategy,
};
