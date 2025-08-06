/**
 * Comprehensive Cache System for Nocchino
 * 
 * This module provides a robust caching system with multiple strategies,
 * cache events, statistics, and advanced features for optimal performance.
 */

import type {
  CachingStrategy,
  NocchinoError,
} from '../types';

import { debugError } from './debugger';
// ErrorCode and ErrorSeverity are not used in this file

// ===== CACHE EVENTS =====

export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'clear' | 'expire' | 'evict';
  key: string;
  timestamp: number;
  data?: unknown;
  ttl?: number;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  expires: number;
  evictions: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  cacheSize: number;
  maxSize: number;
}

export interface CacheEntry<T = unknown> {
  value: T;
  expires: number;
  created: number;
  accessed: number;
  accessCount: number;
  metadata?: Record<string, unknown>;
}

// ===== ENHANCED CACHING STRATEGIES =====

/**
 * Enhanced Memory Cache Strategy
 * Advanced in-memory caching with LRU, statistics, and events
 */
export class EnhancedMemoryCacheStrategy implements CachingStrategy {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 1000;
  private statistics: Omit<CacheStatistics, 'hitRate' | 'totalRequests' | 'averageResponseTime'> = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    expires: 0,
    evictions: 0,
    cacheSize: 0,
    maxSize: 1000,
  };
  private eventListeners: ((event: CacheEvent) => void)[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000, enableCleanup: boolean = true) {
    this.maxSize = maxSize;
    this.statistics.maxSize = maxSize;
    
    if (enableCleanup) {
      this.startCleanupInterval();
    }
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.recordEvent('miss', key);
      this.statistics.misses += 1;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.recordEvent('expire', key);
      this.statistics.expires += 1;
      this.statistics.misses += 1;
      return null;
    }

    // Update access statistics
    item.accessed = Date.now();
    item.accessCount += 1;
    this.cache.set(key, item);

    this.recordEvent('hit', key, item.value);
    this.statistics.hits += 1;

    return item.value as T;
  }

  public set<T>(key: string, value: T, ttl: number = 300000): void {
    const now = Date.now();
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expires: now + ttl,
      created: now,
      accessed: now,
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.statistics.sets += 1;
    this.statistics.cacheSize = this.cache.size;
    
    this.recordEvent('set', key, value, ttl);
  }

  public clear(): void {
    this.cache.clear();
    this.statistics.clears += 1;
    this.statistics.cacheSize = 0;
    
    this.recordEvent('clear', 'all');
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.statistics.expires += 1;
      return false;
    }
    
    return true;
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.statistics.deletes += 1;
      this.statistics.cacheSize = this.cache.size;
      this.recordEvent('delete', key);
    }
    return deleted;
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    const totalRequests = this.statistics.hits + this.statistics.misses;
    const hitRate = totalRequests > 0 ? (this.statistics.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.statistics,
      hitRate,
      totalRequests,
      averageResponseTime: 0, // Could be enhanced with timing
    };
  }

  /**
   * Add event listener for cache events
   */
  public addEventListener(listener: (event: CacheEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: CacheEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Get cache size
   */
  public getSize(): number {
    return this.cache.size;
  }

  /**
   * Get max cache size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Get cache keys
   */
  public getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry metadata
   */
  public getEntryMetadata(key: string): Partial<CacheEntry> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const result: Partial<CacheEntry> = {
      created: entry.created,
      accessed: entry.accessed,
      accessCount: entry.accessCount,
      expires: entry.expires,
    };
    
    if (entry.metadata) {
      result.metadata = entry.metadata;
    }
    
    return result;
  }

  /**
   * Set metadata for a cache entry
   */
  public setEntryMetadata(key: string, metadata: Record<string, unknown>): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.metadata = { ...entry.metadata, ...metadata };
    this.cache.set(key, entry);
    return true;
  }

  /**
   * Evict least recently used items
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessed < oldestAccess) {
        oldestAccess = entry.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.statistics.evictions += 1;
      this.recordEvent('evict', oldestKey);
    }
  }

  /**
   * Record cache event
   */
  private recordEvent(type: CacheEvent['type'], key: string, data?: unknown, ttl?: number): void {
    const event: CacheEvent = {
      type,
      key,
      timestamp: Date.now(),
      data,
      ...(ttl !== undefined && { ttl }),
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        debugError(error as NocchinoError, { context: 'cache-event-listener' });
      }
    });
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
          expiredCount += 1;
        }
      }

      if (expiredCount > 0) {
        this.statistics.expires += expiredCount;
        this.statistics.cacheSize = this.cache.size;
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Stop cleanup interval
   */
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache and cleanup
   */
  public destroy(): void {
    this.stopCleanupInterval();
    this.clear();
    this.eventListeners = [];
  }
}

/**
 * Tiered Cache Strategy
 * Multi-level caching with different storage types
 */
export class TieredCacheStrategy implements CachingStrategy {
  private l1Cache: EnhancedMemoryCacheStrategy;
  private l2Cache: EnhancedMemoryCacheStrategy;

  constructor(l1MaxSize: number = 100, l2MaxSize: number = 1000) {
    this.l1Cache = new EnhancedMemoryCacheStrategy(l1MaxSize);
    this.l2Cache = new EnhancedMemoryCacheStrategy(l2MaxSize);
  }

  public get<T>(key: string): T | null {
    // Try L1 cache first
    let value = this.l1Cache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // Try L2 cache
    value = this.l2Cache.get<T>(key);
    if (value !== null) {
      // Promote to L1 cache
      this.l1Cache.set(key, value, 60000); // 1 minute TTL for L1
      return value;
    }

    return null;
  }

  public set<T>(key: string, value: T, ttl: number = 300000): void {
    // Set in both caches
    this.l1Cache.set(key, value, Math.min(ttl, 60000)); // L1 has shorter TTL
    this.l2Cache.set(key, value, ttl);
  }

  public clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  public has(key: string): boolean {
    return this.l1Cache.has(key) || this.l2Cache.has(key);
  }

  public delete(key: string): boolean {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.l2Cache.delete(key);
    return l1Deleted || l2Deleted;
  }

  /**
   * Get statistics for both cache tiers
   */
  public getStatistics(): { l1: CacheStatistics; l2: CacheStatistics } {
    return {
      l1: this.l1Cache.getStatistics(),
      l2: this.l2Cache.getStatistics(),
    };
  }

  /**
   * Get L1 cache instance
   */
  public getL1Cache(): EnhancedMemoryCacheStrategy {
    return this.l1Cache;
  }

  /**
   * Get L2 cache instance
   */
  public getL2Cache(): EnhancedMemoryCacheStrategy {
    return this.l2Cache;
  }
}

/**
 * Redis-like Cache Strategy
 * Simulates Redis behavior with advanced features
 */
export class RedisLikeCacheStrategy implements CachingStrategy {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 1000;
  private statistics: Omit<CacheStatistics, 'hitRate' | 'totalRequests' | 'averageResponseTime'> = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    expires: 0,
    evictions: 0,
    cacheSize: 0,
    maxSize: 1000,
  };

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.statistics.maxSize = maxSize;
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.statistics.misses += 1;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.statistics.expires += 1;
      this.statistics.misses += 1;
      return null;
    }

    // Update access statistics
    item.accessed = Date.now();
    item.accessCount += 1;
    this.cache.set(key, item);

    this.statistics.hits += 1;
    return item.value as T;
  }

  public set<T>(key: string, value: T, ttl: number = 300000): void {
    const now = Date.now();
    
    // Implement random eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictRandom();
    }

    const entry: CacheEntry<T> = {
      value,
      expires: now + ttl,
      created: now,
      accessed: now,
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.statistics.sets += 1;
    this.statistics.cacheSize = this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
    this.statistics.clears += 1;
    this.statistics.cacheSize = 0;
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.statistics.expires += 1;
      return false;
    }
    
    return true;
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.statistics.deletes += 1;
      this.statistics.cacheSize = this.cache.size;
    }
    return deleted;
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    const totalRequests = this.statistics.hits + this.statistics.misses;
    const hitRate = totalRequests > 0 ? (this.statistics.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.statistics,
      hitRate,
      totalRequests,
      averageResponseTime: 0,
    };
  }

  /**
   * Evict random items (Redis-like behavior)
   */
  private evictRandom(): void {
    const keys = Array.from(this.cache.keys());
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (randomKey) {
        this.cache.delete(randomKey);
        this.statistics.evictions += 1;
      }
    }
  }

  /**
   * Get cache size
   */
  public getSize(): number {
    return this.cache.size;
  }

  /**
   * Get max cache size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }
}

// ===== CACHE MANAGER =====

/**
 * Cache Manager
 * Centralized cache management with multiple strategies
 */
export class CacheManager {
  private strategies: Map<string, CachingStrategy> = new Map();
  private defaultStrategy: string = 'memory';
  private eventListeners: ((event: CacheEvent) => void)[] = [];

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register a caching strategy
   */
  public registerStrategy(name: string, strategy: CachingStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get a caching strategy
   */
  public getStrategy(name?: string): CachingStrategy {
    const strategyName = name || this.defaultStrategy;
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Cache strategy '${strategyName}' not found`);
    }
    
    return strategy;
  }

  /**
   * Set default strategy
   */
  public setDefaultStrategy(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Cache strategy '${name}' not found`);
    }
    this.defaultStrategy = name;
  }

  /**
   * Get all registered strategies
   */
  public getRegisteredStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: (event: CacheEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: CacheEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Register default strategies
   */
  private registerDefaultStrategies(): void {
    this.registerStrategy('memory', new EnhancedMemoryCacheStrategy());
    this.registerStrategy('tiered', new TieredCacheStrategy());
    this.registerStrategy('redis-like', new RedisLikeCacheStrategy());
  }
}

// Export singleton instance
export const cacheManager = new CacheManager(); 