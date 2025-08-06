/**
 * Simple test to demonstrate the new architecture patterns
 */

const {
  EventManager,
  JsonSchemaFakerStrategy,
  CustomDataStrategy,
  MemoryCacheStrategy,
  RetryStrategy,
  FallbackStrategy,
  LogAndContinueStrategy,
  NockRepositoryFactory,
  RepositoryConfigBuilder
} = require('./dist');

// Test Observer Pattern
console.log('🔍 Testing Observer Pattern...');
const eventManager = new EventManager();

// Add a simple listener
const testListener = {
  onRequestStarted: (request) => console.log(`📡 Request started: ${request.method} ${request.url}`),
  onRequestCompleted: (response) => console.log(`✅ Request completed: ${response.status}`),
  onError: (error) => console.log(`❌ Error: ${error.message}`),
  onSpecificationLoaded: (spec) => console.log(`📄 Spec loaded: ${spec.info?.title || 'Unknown'}`),
  onEndpointConfigured: (endpoint) => console.log(`🔧 Endpoint: ${endpoint.baseUrl}`)
};

eventManager.addListener(testListener);

// Test event notifications
eventManager.notifyRequestStarted({ url: 'https://api.example.com/users', method: 'GET' });
eventManager.notifyRequestCompleted({ data: {}, status: 200, duration: 100 });
eventManager.notifySpecificationLoaded({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {}
});
eventManager.notifyEndpointConfigured({ baseUrl: 'https://api.example.com', specs: ['test.yml'] });

console.log('\n');

// Test Strategy Pattern
console.log('🎯 Testing Strategy Pattern...');

const jsonSchemaStrategy = new JsonSchemaFakerStrategy();
const customStrategy = new CustomDataStrategy();
const cacheStrategy = new MemoryCacheStrategy(100);

// Test mock generation strategies
const testSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string' }
  }
};

console.log('JSON Schema Faker Strategy:');
const jsonResult = jsonSchemaStrategy.generate(testSchema);
console.log('  Result:', jsonResult);

console.log('Custom Data Strategy:');
const customResult = customStrategy.generate(testSchema);
console.log('  Result:', customResult);

// Test caching strategy
console.log('\nCaching Strategy:');
cacheStrategy.set('test-key', { data: 'test-value' });
const cachedValue = cacheStrategy.get('test-key');
console.log('  Cached value:', cachedValue);

console.log('\n');

// Test Error Recovery Strategies
console.log('🛡️ Testing Error Recovery Strategies...');

const retryStrategy = new RetryStrategy(2, 100);
const fallbackStrategy = new FallbackStrategy();
const logStrategy = new LogAndContinueStrategy();

// Test error handling
const testError = {
  message: 'Test error',
  code: 'TEST_ERROR',
  severity: 'MEDIUM',
  recoverable: true,
  retryCount: 0,
  context: { timestamp: new Date() }
};

console.log('Retry Strategy:');
console.log('  Can handle:', retryStrategy.canHandle(testError));

console.log('Fallback Strategy:');
console.log('  Can handle:', fallbackStrategy.canHandle(testError));

console.log('Log and Continue Strategy:');
console.log('  Can handle:', logStrategy.canHandle(testError));

console.log('\n');

// Test Dependency Injection with Factory
console.log('🏭 Testing Dependency Injection with Factory...');

// Create different repository types
const basicRepo = NockRepositoryFactory.createBasic();
console.log('✅ Basic repository created');

const performanceRepo = NockRepositoryFactory.createPerformanceOptimized();
console.log('✅ Performance-optimized repository created');

const debugRepo = NockRepositoryFactory.createDebugOptimized();
console.log('✅ Debug-optimized repository created');

// Test Builder Pattern
const customRepo = new RepositoryConfigBuilder()
  .withEventManager(eventManager)
  .withMockGenerationStrategy(customStrategy)
  .withCachingStrategy(cacheStrategy)
  .withErrorRecoveryStrategies([retryStrategy, fallbackStrategy, logStrategy])
  .withDebugging(true)
  .withPerformanceMonitoring(true)
  .buildRepository();

console.log('✅ Custom repository created with builder');

console.log('\n🎉 Architecture test completed successfully!');
console.log('\n📋 Summary of implemented patterns:');
console.log('  ✅ Observer Pattern: Event-driven architecture');
console.log('  ✅ Strategy Pattern: Pluggable strategies for different behaviors');
console.log('  ✅ Dependency Injection: Flexible configuration and testing');
console.log('  ✅ Factory Pattern: Easy repository creation with different configurations');
console.log('  ✅ Builder Pattern: Fluent API for complex configurations');
