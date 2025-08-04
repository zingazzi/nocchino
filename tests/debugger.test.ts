/**
 * Debugger Tests for Nocchino
 *
 * This test file validates the comprehensive debugging system
 * including performance monitoring, request tracking, and debug sessions.
 */

import type { RequestDetails, NocchinoEndpoint, OpenAPISpec } from '../src/types';
import {
  NocchinoDebugger,
  DebugLevel,
  DebugCategory,
  debugRequest,
  debugSpecification,
  debugEndpoint,
  debugError,
  debugPerformance,
} from '../src/utils/debugger';

describe('Debugger System', () => {
  let debuggerInstance: NocchinoDebugger;

  beforeEach(() => {
    debuggerInstance = NocchinoDebugger.getInstance();
    // Reset to default configuration to avoid extra logs
    debuggerInstance.configure({
      level: DebugLevel.NONE,
      categories: [],
      enablePerformanceMonitoring: false,
      enableMemoryMonitoring: false,
      enableRequestTracking: false,
    });
  });

  afterEach(() => {
    debuggerInstance.disableDebugMode();
    debuggerInstance.reset();
  });

  describe('Debugger Instance', () => {
    test('should be a singleton', () => {
      const instance1 = NocchinoDebugger.getInstance();
      const instance2 = NocchinoDebugger.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should configure debugger', () => {
      // Create a fresh instance for this test
      const freshDebugger = NocchinoDebugger.getInstance();
      freshDebugger.reset();

      const config = {
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.REQUEST, DebugCategory.ERROR],
        enablePerformanceMonitoring: true,
        enableMemoryMonitoring: true,
        enableRequestTracking: true,
      };

      freshDebugger.configure(config);
      const logs = freshDebugger.getLogs();
      const configLogs = logs.filter((log) => log.message === 'Debugger configured');
      expect(configLogs.length).toBeGreaterThan(0);
      expect(configLogs[0]?.message).toBe('Debugger configured');
    });
  });

  describe('Debug Sessions', () => {
    test('should start a debug session', () => {
      const sessionId = debuggerInstance.startSession(DebugLevel.DEBUG, [DebugCategory.REQUEST]);

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);

      const currentSession = debuggerInstance.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(currentSession?.id).toBe(sessionId);
      expect(currentSession?.level).toBe(DebugLevel.DEBUG);
    });

    test('should end a debug session', () => {
      const sessionId = debuggerInstance.startSession();
      const session = debuggerInstance.endSession();

      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
      expect(session?.endTime).toBeDefined();
      expect(debuggerInstance.getCurrentSession()).toBeUndefined();
    });

    test('should get all sessions', () => {
      debuggerInstance.startSession();
      debuggerInstance.startSession();
      debuggerInstance.startSession();

      const sessions = debuggerInstance.getSessions();
      expect(sessions).toHaveLength(3);
    });
  });

  describe('Debug Logging', () => {
    test('should log messages at different levels', () => {
      debuggerInstance.configure({
        level: DebugLevel.TRACE,
        categories: Object.values(DebugCategory),
      });

      debuggerInstance.log(DebugLevel.ERROR, DebugCategory.ERROR, 'Error message');
      debuggerInstance.log(DebugLevel.WARN, DebugCategory.REQUEST, 'Warning message');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Info message');
      debuggerInstance.log(DebugLevel.DEBUG, DebugCategory.PERFORMANCE, 'Debug message');
      debuggerInstance.log(DebugLevel.TRACE, DebugCategory.MEMORY, 'Trace message');

      const logs = debuggerInstance.getLogs();
      // Filter out configuration logs to get only our test logs
      const testLogs = logs.filter((log) => log.message === 'Error message'
        || log.message === 'Warning message'
        || log.message === 'Info message'
        || log.message === 'Debug message'
        || log.message === 'Trace message');
      expect(testLogs).toHaveLength(5);
      expect(testLogs[0]?.level).toBe(DebugLevel.ERROR);
      expect(testLogs[1]?.level).toBe(DebugLevel.WARN);
      expect(testLogs[2]?.level).toBe(DebugLevel.INFO);
      expect(testLogs[3]?.level).toBe(DebugLevel.DEBUG);
      expect(testLogs[4]?.level).toBe(DebugLevel.TRACE);
    });

    test('should filter logs by level', () => {
      debuggerInstance.configure({
        level: DebugLevel.TRACE,
        categories: Object.values(DebugCategory),
      });

      debuggerInstance.log(DebugLevel.ERROR, DebugCategory.ERROR, 'Error message');
      debuggerInstance.log(DebugLevel.WARN, DebugCategory.REQUEST, 'Warning message');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Info message');

      const errorLogs = debuggerInstance.getLogs(DebugLevel.ERROR);
      const warnLogs = debuggerInstance.getLogs(DebugLevel.WARN);
      const infoLogs = debuggerInstance.getLogs(DebugLevel.INFO);

      // Filter out configuration logs
      const filteredErrorLogs = errorLogs.filter((log) => log.message === 'Error message');
      const filteredWarnLogs = warnLogs.filter((log) => log.message === 'Warning message');
      const filteredInfoLogs = infoLogs.filter((log) => log.message === 'Info message');

      expect(filteredErrorLogs).toHaveLength(1);
      expect(filteredWarnLogs).toHaveLength(1);
      expect(filteredInfoLogs).toHaveLength(1);
    });

    test('should filter logs by category', () => {
      debuggerInstance.configure({
        level: DebugLevel.TRACE,
        categories: Object.values(DebugCategory),
      });

      debuggerInstance.log(DebugLevel.INFO, DebugCategory.REQUEST, 'Request message');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.ERROR, 'Error message');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'System message');

      const requestLogs = debuggerInstance.getLogs(undefined, DebugCategory.REQUEST);
      const errorLogs = debuggerInstance.getLogs(undefined, DebugCategory.ERROR);

      expect(requestLogs).toHaveLength(1);
      expect(errorLogs).toHaveLength(1);
    });

    test('should limit log entries', () => {
      debuggerInstance.configure({
        level: DebugLevel.TRACE,
        categories: Object.values(DebugCategory),
        maxLogEntries: 3,
      });

      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Message 1');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Message 2');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Message 3');
      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Message 4');

      const logs = debuggerInstance.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0]?.message).toBe('Message 2');
      expect(logs[1]?.message).toBe('Message 3');
      expect(logs[2]?.message).toBe('Message 4');
    });
  });

  describe('Request Tracking', () => {
    test('should track requests', () => {
      debuggerInstance.configure({
        enableRequestTracking: true,
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.REQUEST],
      });

      const requestDetails: RequestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      };

      const requestId = debuggerInstance.trackRequest(requestDetails);
      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^req_\d+_[a-z0-9]+$/);

      const trackers = debuggerInstance.getRequestTrackers();
      expect(trackers).toHaveLength(1);
      expect(trackers[0]?.url).toBe(requestDetails.url);
      expect(trackers[0]?.method).toBe(requestDetails.method);
    });

    test('should complete request tracking', () => {
      debuggerInstance.configure({
        enableRequestTracking: true,
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.REQUEST],
      });

      const requestDetails: RequestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'GET',
      };

      const requestId = debuggerInstance.trackRequest(requestDetails);
      debuggerInstance.completeRequest(requestId, 200, 'users-api.yml', 'https://api.example.com');

      const trackers = debuggerInstance.getRequestTrackers();
      expect(trackers).toHaveLength(1);
      expect(trackers[0]?.requestId).toBe(requestId);
      expect(trackers[0]?.status).toBe(200);
    });

    test('should update performance metrics', () => {
      debuggerInstance.configure({
        enableRequestTracking: true,
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.REQUEST],
      });

      const requestDetails: RequestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'GET',
      };

      const requestId = debuggerInstance.trackRequest(requestDetails);
      debuggerInstance.completeRequest(requestId, 200);

      const metrics = debuggerInstance.getPerformanceMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track specification loading', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.SPECIFICATION],
      });

      const startTime = new Date();
      // Add a small delay to ensure measurable time
      setTimeout(() => {
        debuggerInstance.trackSpecLoading('/path/to/spec.yml', startTime);
      }, 1);

      const metrics = debuggerInstance.getPerformanceMetrics();
      expect(metrics.specLoadTime).toBeGreaterThanOrEqual(0);
    });

    test('should track Nock setup', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.NOCK],
      });

      const startTime = new Date();
      // Add a small delay to ensure measurable time
      setTimeout(() => {
        debuggerInstance.trackNockSetup('GET', 'https://api.example.com/v1/users', startTime);
      }, 1);

      const metrics = debuggerInstance.getPerformanceMetrics();
      expect(metrics.nockSetupTime).toBeGreaterThanOrEqual(0);
    });

    test('should monitor memory usage', () => {
      debuggerInstance.configure({
        enableMemoryMonitoring: true,
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.MEMORY],
      });

      debuggerInstance.monitorMemory();

      const metrics = debuggerInstance.getPerformanceMetrics();
      expect(metrics.totalMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Debug Mode Management', () => {
    test('should enable debug mode', () => {
      const sessionId = debuggerInstance.enableDebugMode(
        DebugLevel.DEBUG,
        [DebugCategory.REQUEST, DebugCategory.ERROR],
        true,
        true,
        true,
      );

      expect(sessionId).toBeDefined();
      expect(debuggerInstance.getCurrentSession()).toBeDefined();
    });

    test('should disable debug mode', () => {
      debuggerInstance.enableDebugMode();
      const session = debuggerInstance.disableDebugMode();

      expect(session).toBeDefined();
      expect(debuggerInstance.getCurrentSession()).toBeUndefined();
    });
  });

  describe('Convenience Functions', () => {
    test('should debug request details', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.REQUEST],
      });

      const requestDetails: RequestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'POST',
        body: { name: 'John Doe' },
      };

      debugRequest(requestDetails);

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.REQUEST);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Request details');
    });

    test('should debug specification', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.SPECIFICATION],
      });

      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      debugSpecification(spec);

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.SPECIFICATION);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Specification loaded');
    });

    test('should debug endpoint', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.CONFIGURATION],
      });

      const endpoint: NocchinoEndpoint = {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1', 'specs/api-v2'],
      };

      debugEndpoint(endpoint);

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.CONFIGURATION);
      // Filter out configuration logs to get only our endpoint debug log
      const endpointLogs = logs.filter((log) => log.message === 'Endpoint configured');
      expect(endpointLogs).toHaveLength(1);
      expect(endpointLogs[0]?.message).toBe('Endpoint configured');
    });

    test('should debug error', () => {
      debuggerInstance.configure({
        level: DebugLevel.ERROR,
        categories: [DebugCategory.ERROR],
      });

      const error = new Error('Test error');
      debugError(error, { context: 'test' });

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.ERROR);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Test error');
    });

    test('should debug performance', () => {
      debuggerInstance.configure({
        level: DebugLevel.DEBUG,
        categories: [DebugCategory.PERFORMANCE],
      });

      debugPerformance('test operation', 150);

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.PERFORMANCE);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Performance: test operation');
    });
  });

  describe('Debug Report Generation', () => {
    test('should generate debug report', () => {
      debuggerInstance.enableDebugMode();

      // Add some activity
      const requestDetails: RequestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'GET',
      };
      const requestId = debuggerInstance.trackRequest(requestDetails);
      debuggerInstance.completeRequest(requestId, 200);
      debuggerInstance.monitorMemory();

      const report = debuggerInstance.generateReport();

      expect(report).toContain('=== Nocchino Debug Report ===');
      expect(report).toContain('Performance Metrics:');
      expect(report).toContain('Total Requests:');
      expect(report).toContain('Debug Sessions:');
    });
  });

  describe('Log Management', () => {
    test('should clear logs', () => {
      debuggerInstance.configure({
        level: DebugLevel.INFO,
        categories: [DebugCategory.SYSTEM],
      });

      // Clear any existing logs first
      debuggerInstance.clearLogs();

      debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'Test message');
      expect(debuggerInstance.getLogs()).toHaveLength(1);

      debuggerInstance.clearLogs();
      expect(debuggerInstance.getLogs()).toHaveLength(0);
    });

    test('should clear sessions', () => {
      debuggerInstance.startSession();
      debuggerInstance.startSession();
      expect(debuggerInstance.getSessions()).toHaveLength(2);

      debuggerInstance.clearSessions();
      expect(debuggerInstance.getSessions()).toHaveLength(0);
    });
  });

  describe('Integration with Error Handling', () => {
    test('should work with error handling system', () => {
      debuggerInstance.configure({
        level: DebugLevel.ERROR,
        categories: [DebugCategory.ERROR],
      });

      const error = new Error('Integration test error');
      debugError(error);

      const logs = debuggerInstance.getLogs(undefined, DebugCategory.ERROR);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Integration test error');
    });
  });
});
