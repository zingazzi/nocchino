/**
 * Comprehensive Debugging System for Nocchino
 *
 * This module provides advanced debugging capabilities including:
 * - Performance monitoring
 * - Request/response tracking
 * - Memory usage monitoring
 * - Detailed logging with different levels
 * - Debug session management
 * - Performance metrics collection
 */

import type { RequestDetails, NocchinoEndpoint, OpenAPISpec } from '../types';

// Debug Levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

// Debug Categories
export enum DebugCategory {
  CONFIGURATION = 'CONFIGURATION',
  SPECIFICATION = 'SPECIFICATION',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  PERFORMANCE = 'PERFORMANCE',
  MEMORY = 'MEMORY',
  NOCK = 'NOCK',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM'
}

// Performance Metrics
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  totalMemoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  specLoadTime: number;
  nockSetupTime: number;
}

// Debug Session
export interface DebugSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  level: DebugLevel;
  categories: DebugCategory[];
  metrics: PerformanceMetrics;
  logs: DebugLog[];
}

// Debug Log Entry
export interface DebugLog {
  timestamp: Date;
  level: DebugLevel;
  category: DebugCategory;
  message: string;
  data?: Record<string, unknown> | undefined;
  requestId?: string | undefined;
  sessionId?: string | undefined;
}

// Debug Configuration
export interface DebugConfig {
  level: DebugLevel;
  categories: DebugCategory[];
  enablePerformanceMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableRequestTracking: boolean;
  maxLogEntries: number;
  sessionTimeout: number; // in milliseconds
}

// Request Tracking
export interface RequestTracker {
  requestId: string;
  url: string;
  method: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status?: number;
  error?: string | undefined;
  specMatched?: string | undefined;
  endpointMatched?: string | undefined;
}

/**
 * Advanced Debugger Class
 */
export class NocchinoDebugger {
  private static instance: NocchinoDebugger;

  private config: DebugConfig;

  private logs: DebugLog[] = [];

  private sessions: Map<string, DebugSession> = new Map();

  private currentSession?: DebugSession | undefined;

  private requestTrackers: Map<string, RequestTracker> = new Map();

  private performanceMetrics: PerformanceMetrics;

  private startTime: Date;

  private constructor() {
    this.startTime = new Date();
    this.config = {
      level: DebugLevel.NONE,
      categories: [],
      enablePerformanceMonitoring: false,
      enableMemoryMonitoring: false,
      enableRequestTracking: false,
      maxLogEntries: 10000,
      sessionTimeout: 300000, // 5 minutes
    };
    this.performanceMetrics = this.initializeMetrics();
  }

  public static getInstance(): NocchinoDebugger {
    if (!NocchinoDebugger.instance) {
      NocchinoDebugger.instance = new NocchinoDebugger();
    }
    return NocchinoDebugger.instance;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      totalMemoryUsage: 0,
      cacheHitRate: 0,
      errorRate: 0,
      specLoadTime: 0,
      nockSetupTime: 0,
    };
  }

  /**
   * Configure debugger
   */
  public configure(config: Partial<DebugConfig>): void {
    // Log the configuration message before applying the new config
    // Bypass filtering for configuration logs
    const logEntry: DebugLog = {
      timestamp: new Date(),
      level: DebugLevel.INFO,
      category: DebugCategory.CONFIGURATION,
      message: 'Debugger configured',
      data: config,
      sessionId: this.currentSession?.id,
    };

    this.logs.push(logEntry);
    this.currentSession?.logs.push(logEntry);

    // Maintain log size
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Output to console
    this.outputToConsole(logEntry);

    this.config = { ...this.config, ...config };
  }

  /**
   * Start a debug session
   */
  public startSession(level: DebugLevel = DebugLevel.DEBUG, categories?: DebugCategory[]): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      level,
      categories: categories || Object.values(DebugCategory),
      metrics: this.initializeMetrics(),
      logs: [],
    };

    this.sessions.set(sessionId, this.currentSession);
    this.log(DebugLevel.INFO, DebugCategory.SYSTEM, `Debug session started: ${sessionId}`, {
      level,
      categories: this.currentSession.categories,
    });

    return sessionId;
  }

  /**
   * End current debug session
   */
  public endSession(): DebugSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date();
    this.currentSession.metrics = this.getPerformanceMetrics();

    this.log(DebugLevel.INFO, DebugCategory.SYSTEM, `Debug session ended: ${this.currentSession.id}`, {
      duration: this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime(),
      metrics: this.currentSession.metrics,
    });

    const session = this.currentSession;
    this.currentSession = undefined;
    return session;
  }

  /**
   * Log a debug message
   */
  public log(
    level: DebugLevel,
    category: DebugCategory,
    message: string,
    data?: Record<string, unknown>,
    requestId?: string,
  ): void {
    if (level > this.config.level) {
      return;
    }

    if (!this.config.categories.includes(category)) {
      return;
    }

    const logEntry: DebugLog = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      requestId,
      sessionId: this.currentSession?.id,
    };

    this.logs.push(logEntry);
    this.currentSession?.logs.push(logEntry);

    // Maintain log size
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Output to console based on level
    this.outputToConsole(logEntry);
  }

  /**
   * Output log to console
   */
  private outputToConsole(log: DebugLog): void {
    const timestamp = log.timestamp.toISOString();
    const prefix = `[Nocchino Debug] [${timestamp}] [${log.level}] [${log.category}]`;

    switch (log.level) {
      case DebugLevel.ERROR:
        console.error(`${prefix} ${log.message}`, log.data || '');
        break;
      case DebugLevel.WARN:
        console.warn(`${prefix} ${log.message}`, log.data || '');
        break;
      case DebugLevel.INFO:
        console.info(`${prefix} ${log.message}`, log.data || '');
        break;
      case DebugLevel.DEBUG:
        console.debug(`${prefix} ${log.message}`, log.data || '');
        break;
      case DebugLevel.TRACE:
        console.trace(`${prefix} ${log.message}`, log.data || '');
        break;
    }
  }

  /**
   * Track a request
   */
  public trackRequest(requestDetails: RequestDetails): string {
    if (!this.config.enableRequestTracking) {
      return '';
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tracker: RequestTracker = {
      requestId,
      url: requestDetails.url,
      method: requestDetails.method,
      startTime: new Date(),
    };

    this.requestTrackers.set(requestId, tracker);
    this.performanceMetrics.requestCount++;

    this.log(DebugLevel.DEBUG, DebugCategory.REQUEST, `Request started: ${requestId}`, {
      url: requestDetails.url,
      method: requestDetails.method,
      headers: requestDetails.headers,
    }, requestId);

    return requestId;
  }

  /**
   * Complete request tracking
   */
  public completeRequest(
    requestId: string,
    status: number,
    specMatched?: string,
    endpointMatched?: string,
    error?: string,
  ): void {
    if (!this.config.enableRequestTracking) {
      return;
    }

    const tracker = this.requestTrackers.get(requestId);
    if (!tracker) {
      return;
    }

    tracker.endTime = new Date();
    tracker.duration = tracker.endTime.getTime() - tracker.startTime.getTime();
    tracker.status = status;
    tracker.specMatched = specMatched;
    tracker.endpointMatched = endpointMatched;
    tracker.error = error;

    // Update performance metrics
    if (tracker.duration) {
      const totalTime = this.performanceMetrics.averageResponseTime * (this.performanceMetrics.requestCount - 1);
      this.performanceMetrics.averageResponseTime = (totalTime + tracker.duration) / this.performanceMetrics.requestCount;
    }

    if (error) {
      this.performanceMetrics.errorRate = (this.performanceMetrics.errorRate * (this.performanceMetrics.requestCount - 1) + 1) / this.performanceMetrics.requestCount;
    }

    this.log(DebugLevel.DEBUG, DebugCategory.REQUEST, `Request completed: ${requestId}`, {
      duration: tracker.duration,
      status,
      specMatched,
      endpointMatched,
      error,
    }, requestId);

    // Clean up old trackers
    this.cleanupOldTrackers();
  }

  /**
   * Clean up old request trackers
   */
  private cleanupOldTrackers(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute

    for (const [requestId, tracker] of this.requestTrackers.entries()) {
      if (tracker.endTime && now.getTime() - tracker.endTime.getTime() > timeout) {
        this.requestTrackers.delete(requestId);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  public monitorMemory(): void {
    if (!this.config.enableMemoryMonitoring) {
      return;
    }

    const memoryUsage = process.memoryUsage();
    this.performanceMetrics.totalMemoryUsage = memoryUsage.heapUsed;

    this.log(DebugLevel.DEBUG, DebugCategory.MEMORY, 'Memory usage monitored', {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
    });
  }

  /**
   * Track specification loading
   */
  public trackSpecLoading(specPath: string, startTime: Date): void {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    this.performanceMetrics.specLoadTime = duration;

    this.log(DebugLevel.DEBUG, DebugCategory.SPECIFICATION, `Specification loaded: ${specPath}`, {
      path: specPath,
      duration,
    });
  }

  /**
   * Track Nock setup
   */
  public trackNockSetup(method: string, url: string, startTime: Date): void {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    this.performanceMetrics.nockSetupTime = duration;

    this.log(DebugLevel.DEBUG, DebugCategory.NOCK, 'Nock setup completed', {
      method,
      url,
      duration,
    });
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get debug logs
   */
  public getLogs(level?: DebugLevel, category?: DebugCategory, limit?: number): DebugLog[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.level <= level);
    }

    if (category !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.category === category);
    }

    if (limit !== undefined) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): DebugSession | undefined {
    return this.currentSession;
  }

  /**
   * Get all sessions
   */
  public getSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get request trackers
   */
  public getRequestTrackers(): RequestTracker[] {
    return Array.from(this.requestTrackers.values());
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
    this.currentSession?.logs.splice(0);
  }

  /**
   * Clear sessions
   */
  public clearSessions(): void {
    this.sessions.clear();
    this.currentSession = undefined;
  }

  /**
   * Reset debugger state (for testing)
   */
  public reset(): void {
    this.logs = [];
    this.sessions.clear();
    this.currentSession = undefined;
    this.requestTrackers.clear();
    this.performanceMetrics = this.initializeMetrics();
    this.startTime = new Date();
  }

  /**
   * Generate debug report
   */
  public generateReport(): string {
    const metrics = this.getPerformanceMetrics();
    const sessionCount = this.sessions.size;
    const activeRequests = this.requestTrackers.size;
    const logCount = this.logs.length;

    return `
=== Nocchino Debug Report ===
Generated: ${new Date().toISOString()}
Uptime: ${new Date().getTime() - this.startTime.getTime()}ms

Performance Metrics:
- Total Requests: ${metrics.requestCount}
- Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
- Memory Usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB
- Spec Load Time: ${metrics.specLoadTime}ms
- Nock Setup Time: ${metrics.nockSetupTime}ms

Debug Sessions: ${sessionCount}
Active Requests: ${activeRequests}
Log Entries: ${logCount}

Current Session: ${this.currentSession?.id || 'None'}
Debug Level: ${DebugLevel[this.config.level]}
Enabled Categories: ${this.config.categories.join(', ')}
    `.trim();
  }

  /**
   * Enable debug mode with specific configuration
   */
  public enableDebugMode(
    level: DebugLevel = DebugLevel.DEBUG,
    categories?: DebugCategory[],
    enablePerformanceMonitoring = true,
    enableMemoryMonitoring = true,
    enableRequestTracking = true,
  ): string {
    this.configure({
      level,
      categories: categories || Object.values(DebugCategory),
      enablePerformanceMonitoring,
      enableMemoryMonitoring,
      enableRequestTracking,
    });

    return this.startSession(level, categories);
  }

  /**
   * Disable debug mode
   */
  public disableDebugMode(): DebugSession | null {
    const session = this.endSession();
    this.configure({
      level: DebugLevel.NONE,
      categories: [],
      enablePerformanceMonitoring: false,
      enableMemoryMonitoring: false,
      enableRequestTracking: false,
    });
    return session;
  }

  /**
   * Quick debug methods for common scenarios
   */
  public debugRequest(requestDetails: RequestDetails, data?: Record<string, unknown>): void {
    this.log(DebugLevel.DEBUG, DebugCategory.REQUEST, 'Request details', {
      ...requestDetails,
      ...data,
    });
  }

  public debugSpecification(spec: OpenAPISpec, data?: Record<string, unknown>): void {
    this.log(DebugLevel.DEBUG, DebugCategory.SPECIFICATION, 'Specification loaded', {
      title: spec.info.title,
      version: spec.info.version,
      paths: Object.keys(spec.paths).length,
      ...data,
    });
  }

  public debugEndpoint(endpoint: NocchinoEndpoint, data?: Record<string, unknown>): void {
    this.log(DebugLevel.DEBUG, DebugCategory.CONFIGURATION, 'Endpoint configured', {
      baseUrl: endpoint.baseUrl,
      specsCount: endpoint.specs.length,
      ...data,
    });
  }

  public debugError(error: Error, context?: Record<string, unknown>): void {
    this.log(DebugLevel.ERROR, DebugCategory.ERROR, error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  public debugPerformance(operation: string, duration: number, data?: Record<string, unknown>): void {
    this.log(DebugLevel.DEBUG, DebugCategory.PERFORMANCE, `Performance: ${operation}`, {
      duration,
      ...data,
    });
  }
}

// Export the debugger instance
export const nocchinoDebugger = NocchinoDebugger.getInstance();

// Convenience functions for quick debugging
export const debugRequest = (requestDetails: RequestDetails, data?: Record<string, unknown>): void => {
  nocchinoDebugger.debugRequest(requestDetails, data);
};

export const debugSpecification = (spec: OpenAPISpec, data?: Record<string, unknown>): void => {
  nocchinoDebugger.debugSpecification(spec, data);
};

export const debugEndpoint = (endpoint: NocchinoEndpoint, data?: Record<string, unknown>): void => {
  nocchinoDebugger.debugEndpoint(endpoint, data);
};

export const debugError = (error: Error, context?: Record<string, unknown>): void => {
  nocchinoDebugger.debugError(error, context);
};

export const debugPerformance = (operation: string, duration: number, data?: Record<string, unknown>): void => {
  nocchinoDebugger.debugPerformance(operation, duration, data);
};
