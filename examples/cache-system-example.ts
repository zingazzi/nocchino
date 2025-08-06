/**
 * Cache System Example
 *
 * Demonstrates the comprehensive cache system with multiple strategies,
 * statistics, events, and advanced features.
 */

import {
  EnhancedMemoryCacheStrategy,
  TieredCacheStrategy,
  RedisLikeCacheStrategy,
  CacheManager,
  cacheManager,
} from '../src';

import type {
  CacheEvent,
  CacheStatistics,
} from '../src';

// ===== CACHE EVENT LISTENERS =====

/**
 * Cache Event Logger
 * Logs all cache events for monitoring
 */
class CacheEventLogger {
  public onCacheEvent(event: CacheEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const eventType = event.type.toUpperCase();

    console.log(`[${timestamp}] CACHE ${eventType}: ${event.key}`);

    if (event.data) {
      console.log(`  Data: ${JSON.stringify(event.data).substring(0, 100)}...`);
    }

    if (event.ttl) {
      console.log(`  TTL: ${event.ttl}ms`);
    }
  }
}

/**
 * Cache Performance Monitor
 * Monitors cache performance and provides insights
 */
class CachePerformanceMonitor {
  private hitRates: number[] = [];
  private eventCounts: Record<string, number> = {};

  public onCacheEvent(event: CacheEvent): void {
    // Track event counts
    this.eventCounts[event.type] = (this.eventCounts[event.type] || 0) + 1;

    console.log(`📊 Cache Performance: ${event.type} event recorded`);
  }

  public getPerformanceReport(): void {
    console.log('\n📈 Cache Performance Report:');
    console.log('============================');

    Object.entries(this.eventCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} events`);
    });

    console.log(`  Total events: ${Object.values(this.eventCounts).reduce((a, b) => a + b, 0)}`);
  }
}

// ===== CACHE SYSTEM DEMONSTRATION =====

async function demonstrateCacheSystem(): Promise<void> {
  console.log('🚀 Nocchino Cache System Example');
  console.log('================================\n');

  // Initialize event listeners
  const eventLogger = new CacheEventLogger();
  const performanceMonitor = new CachePerformanceMonitor();

  // ===== ENHANCED MEMORY CACHE =====
  console.log('1️⃣ Enhanced Memory Cache Strategy');
  console.log('--------------------------------');

  const enhancedCache = new EnhancedMemoryCacheStrategy(100, true);

  // Add event listeners
  enhancedCache.addEventListener(eventLogger.onCacheEvent.bind(eventLogger));
  enhancedCache.addEventListener(performanceMonitor.onCacheEvent.bind(performanceMonitor));

  // Demonstrate basic operations
  console.log('\n📝 Setting cache entries...');
  enhancedCache.set('user:1', { id: 1, name: 'John Doe', email: 'john@example.com' }, 300000);
  enhancedCache.set('user:2', { id: 2, name: 'Jane Smith', email: 'jane@example.com' }, 300000);
  enhancedCache.set('config:app', { theme: 'dark', language: 'en', debug: true }, 600000);

  console.log('\n🔍 Retrieving cache entries...');
  const user1 = enhancedCache.get('user:1');
  const user2 = enhancedCache.get('user:2');
  const config = enhancedCache.get('config:app');
  const nonExistent = enhancedCache.get('user:999');

  console.log(`  user:1: ${user1 ? '✅ Found' : '❌ Not found'}`);
  console.log(`  user:2: ${user2 ? '✅ Found' : '❌ Not found'}`);
  console.log(`  config:app: ${config ? '✅ Found' : '❌ Not found'}`);
  console.log(`  user:999: ${nonExistent ? '✅ Found' : '❌ Not found'}`);

  // Demonstrate metadata
  console.log('\n🏷️ Setting entry metadata...');
  enhancedCache.setEntryMetadata('user:1', {
    source: 'database',
    lastUpdated: new Date().toISOString(),
    priority: 'high'
  });

  const metadata = enhancedCache.getEntryMetadata('user:1');
  console.log(`  Metadata for user:1:`, metadata);

  // Get statistics
  const stats = enhancedCache.getStatistics();
  console.log('\n📊 Cache Statistics:');
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)}%`);
  console.log(`  Cache Size: ${stats.cacheSize}/${stats.maxSize}`);

  // ===== TIERED CACHE =====
  console.log('\n\n2️⃣ Tiered Cache Strategy');
  console.log('------------------------');

  const tieredCache = new TieredCacheStrategy(50, 200);

  console.log('\n📝 Setting entries in tiered cache...');
  tieredCache.set('product:1', { id: 1, name: 'Laptop', price: 999.99 }, 300000);
  tieredCache.set('product:2', { id: 2, name: 'Mouse', price: 29.99 }, 300000);
  tieredCache.set('product:3', { id: 3, name: 'Keyboard', price: 89.99 }, 300000);

  console.log('\n🔍 Retrieving from tiered cache...');
  const product1 = tieredCache.get('product:1');
  const product2 = tieredCache.get('product:2');

  console.log(`  product:1: ${product1 ? '✅ Found' : '❌ Not found'}`);
  console.log(`  product:2: ${product2 ? '✅ Found' : '❌ Not found'}`);

  // Get tiered statistics
  const tieredStats = tieredCache.getStatistics();
  console.log('\n📊 Tiered Cache Statistics:');
  console.log('  L1 Cache:');
  console.log(`    Hits: ${tieredStats.l1.hits}`);
  console.log(`    Hit Rate: ${tieredStats.l1.hitRate.toFixed(2)}%`);
  console.log('  L2 Cache:');
  console.log(`    Hits: ${tieredStats.l2.hits}`);
  console.log(`    Hit Rate: ${tieredStats.l2.hitRate.toFixed(2)}%`);

  // ===== REDIS-LIKE CACHE =====
  console.log('\n\n3️⃣ Redis-like Cache Strategy');
  console.log('----------------------------');

  const redisLikeCache = new RedisLikeCacheStrategy(100);

  console.log('\n📝 Setting entries in Redis-like cache...');
  for (let i = 1; i <= 10; i++) {
    redisLikeCache.set(`item:${i}`, {
      id: i,
      data: `Data for item ${i}`,
      timestamp: Date.now()
    }, 300000);
  }

  console.log('\n🔍 Retrieving from Redis-like cache...');
  for (let i = 1; i <= 5; i++) {
    const item = redisLikeCache.get(`item:${i}`);
    console.log(`  item:${i}: ${item ? '✅ Found' : '❌ Not found'}`);
  }

  const redisStats = redisLikeCache.getStatistics();
  console.log('\n📊 Redis-like Cache Statistics:');
  console.log(`  Hits: ${redisStats.hits}`);
  console.log(`  Misses: ${redisStats.misses}`);
  console.log(`  Hit Rate: ${redisStats.hitRate.toFixed(2)}%`);
  console.log(`  Evictions: ${redisStats.evictions}`);

  // ===== CACHE MANAGER =====
  console.log('\n\n4️⃣ Cache Manager');
  console.log('----------------');

  console.log('\n📋 Registered Strategies:');
  const strategies = cacheManager.getRegisteredStrategies();
  strategies.forEach(strategy => {
    console.log(`  - ${strategy}`);
  });

  // Register custom strategy
  console.log('\n🔧 Registering custom strategy...');
  const customCache = new EnhancedMemoryCacheStrategy(50);
  cacheManager.registerStrategy('custom', customCache);

  console.log('✅ Custom strategy registered');
  console.log('\n📋 Updated Registered Strategies:');
  cacheManager.getRegisteredStrategies().forEach(strategy => {
    console.log(`  - ${strategy}`);
  });

  // Set default strategy
  console.log('\n⚙️ Setting default strategy...');
  cacheManager.setDefaultStrategy('memory');
  console.log('✅ Default strategy set to "memory"');

  // ===== PERFORMANCE MONITORING =====
  console.log('\n\n5️⃣ Performance Monitoring');
  console.log('---------------------------');

  performanceMonitor.getPerformanceReport();

  // ===== CLEANUP =====
  console.log('\n\n🧹 Cleanup');
  console.log('-----------');

  enhancedCache.destroy();
  console.log('✅ Enhanced cache destroyed');

  tieredCache.clear();
  console.log('✅ Tiered cache cleared');

  redisLikeCache.clear();
  console.log('✅ Redis-like cache cleared');

  console.log('\n🎉 Cache system demonstration completed!');
}

// ===== USAGE EXAMPLES =====

function demonstrateCacheUsage(): void {
  console.log('\n\n💡 Usage Examples');
  console.log('==================');

  // Example 1: Basic caching
  console.log('\n📝 Example 1: Basic Caching');
  const cache = new EnhancedMemoryCacheStrategy(100);

  // Cache expensive operation result
  const expensiveOperation = (id: number) => {
    console.log(`  Computing expensive operation for ID: ${id}`);
    return { result: `Computed result for ${id}`, timestamp: Date.now() };
  };

  const getCachedResult = (id: number) => {
    const cacheKey = `expensive:${id}`;
    let result = cache.get(cacheKey);

    if (!result) {
      result = expensiveOperation(id);
      cache.set(cacheKey, result, 300000); // 5 minutes
      console.log(`  ✅ Cached result for ID: ${id}`);
    } else {
      console.log(`  ⚡ Retrieved cached result for ID: ${id}`);
    }

    return result;
  };

  // First call - computes and caches
  getCachedResult(1);
  // Second call - retrieves from cache
  getCachedResult(1);

  // Example 2: Tiered caching for different data types
  console.log('\n📝 Example 2: Tiered Caching');
  const tieredCache = new TieredCacheStrategy(50, 200);

  // Frequently accessed data goes to L1
  tieredCache.set('session:user:123', { userId: 123, permissions: ['read', 'write'] }, 60000);

  // Less frequently accessed data goes to L2
  tieredCache.set('user:profile:123', {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: { theme: 'dark', language: 'en' }
  }, 300000);

  console.log('  ✅ Session data cached in L1 (fast access)');
  console.log('  ✅ Profile data cached in L2 (larger storage)');

  // Example 3: Cache with metadata
  console.log('\n📝 Example 3: Cache with Metadata');
  const metadataCache = new EnhancedMemoryCacheStrategy(100);

  metadataCache.set('api:users', { users: [{ id: 1, name: 'John' }] }, 300000);
  metadataCache.setEntryMetadata('api:users', {
    source: 'database',
    lastSync: new Date().toISOString(),
    version: '1.0.0'
  });

  const userData = metadataCache.get('api:users');
  const userMetadata = metadataCache.getEntryMetadata('api:users');

  console.log('  ✅ Cached API data with metadata');
  console.log(`  📊 Metadata: ${JSON.stringify(userMetadata)}`);

  // Cleanup
  cache.destroy();
  tieredCache.clear();
  metadataCache.destroy();
}

// ===== MAIN EXECUTION =====

if (require.main === module) {
  demonstrateCacheSystem()
    .then(() => {
      demonstrateCacheUsage();
    })
    .catch((error) => {
      console.error('❌ Error running cache system example:', error);
    });
}
