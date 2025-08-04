/**
 * Debugger Example for Nocchino
 *
 * This example demonstrates how to use the comprehensive debugging system
 * with performance monitoring, request tracking, and debug sessions.
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
import {
  initialize,
  activateNockForRequest,
  restoreNock,
} from '../src/utils/dynamicNock';

// Example 1: Basic Debug Mode Setup
console.log('=== Example 1: Basic Debug Mode Setup ===');

const debuggerInstance = NocchinoDebugger.getInstance();

// Enable debug mode with specific configuration
const sessionId = debuggerInstance.enableDebugMode(
  DebugLevel.DEBUG,
  [DebugCategory.REQUEST, DebugCategory.ERROR, DebugCategory.PERFORMANCE],
  true, // enablePerformanceMonitoring
  true, // enableMemoryMonitoring
  true, // enableRequestTracking
);

console.log(`✅ Debug session started: ${sessionId}`);

// Example 2: Request Tracking
console.log('\n=== Example 2: Request Tracking ===');

const requestDetails: RequestDetails = {
  url: 'https://api.example.com/v1/users',
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
};

// Track the request
const requestId = debuggerInstance.trackRequest(requestDetails);
console.log(`📊 Request tracked: ${requestId}`);

// Simulate request processing
setTimeout(() => {
  debuggerInstance.completeRequest(requestId, 200, 'users-api.yml', 'https://api.example.com');
  console.log(`✅ Request completed: ${requestId}`);
}, 100);

// Example 3: Performance Monitoring
console.log('\n=== Example 3: Performance Monitoring ===');

// Monitor memory usage
debuggerInstance.monitorMemory();
console.log('💾 Memory usage monitored');

// Track specification loading
const specStartTime = new Date();
setTimeout(() => {
  debuggerInstance.trackSpecLoading('/path/to/spec.yml', specStartTime);
  console.log('📄 Specification loading tracked');
}, 50);

// Track Nock setup
const nockStartTime = new Date();
setTimeout(() => {
  debuggerInstance.trackNockSetup('GET', 'https://api.example.com/v1/users', nockStartTime);
  console.log('🔧 Nock setup tracked');
}, 75);

// Example 4: Debug Logging with Different Levels
console.log('\n=== Example 4: Debug Logging with Different Levels ===');

debuggerInstance.log(DebugLevel.ERROR, DebugCategory.ERROR, 'Critical error occurred', {
  errorCode: 'SPEC_NOT_FOUND',
  url: 'https://api.example.com/missing-endpoint',
});

debuggerInstance.log(DebugLevel.WARN, DebugCategory.REQUEST, 'Request timeout warning', {
  url: 'https://api.example.com/slow-endpoint',
  timeout: 5000,
});

debuggerInstance.log(DebugLevel.INFO, DebugCategory.SYSTEM, 'System configuration loaded', {
  endpoints: 2,
  specs: 3,
});

debuggerInstance.log(DebugLevel.DEBUG, DebugCategory.PERFORMANCE, 'Performance metric recorded', {
  operation: 'spec_loading',
  duration: 150,
});

debuggerInstance.log(DebugLevel.TRACE, DebugCategory.MEMORY, 'Memory allocation traced', {
  heapUsed: 1024 * 1024,
  heapTotal: 2048 * 1024,
});

// Example 5: Convenience Functions
console.log('\n=== Example 5: Convenience Functions ===');

// Debug request details
const complexRequest: RequestDetails = {
  url: 'https://api.example.com/v1/users/123',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'John Doe', email: 'john@example.com' },
};

debugRequest(complexRequest);
console.log('🔍 Request details debugged');

// Debug specification
const spec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'API for managing users',
  },
  paths: {
    '/users': {
      get: {
        responses: {
          200: { description: 'Success' },
          404: { description: 'Not found' },
        },
      },
      post: {
        responses: {
          201: { description: 'Created' },
          400: { description: 'Bad request' },
        },
      },
    },
  },
};

debugSpecification(spec);
console.log('📋 Specification debugged');

// Debug endpoint
const endpoint: NocchinoEndpoint = {
  baseUrl: 'https://api.example.com',
  specs: ['specs/api-v1', 'specs/api-v2', 'specs/shared'],
};

debugEndpoint(endpoint);
console.log('🌐 Endpoint debugged');

// Debug error
const error = new Error('Network timeout');
debugError(error, { retryAttempt: 3, maxRetries: 5 });
console.log('❌ Error debugged');

// Debug performance
debugPerformance('database_query', 250);
console.log('⚡ Performance debugged');

// Example 6: Log Filtering and Analysis
console.log('\n=== Example 6: Log Filtering and Analysis ===');

// Get all logs
const allLogs = debuggerInstance.getLogs();
console.log(`📝 Total logs: ${allLogs.length}`);

// Get error logs only
const errorLogs = debuggerInstance.getLogs(DebugLevel.ERROR);
console.log(`❌ Error logs: ${errorLogs.length}`);

// Get request logs only
const requestLogs = debuggerInstance.getLogs(undefined, DebugCategory.REQUEST);
console.log(`🌐 Request logs: ${requestLogs.length}`);

// Get recent logs (last 5)
const recentLogs = debuggerInstance.getLogs(undefined, undefined, 5);
console.log(`🕒 Recent logs: ${recentLogs.length}`);

// Example 7: Performance Metrics
console.log('\n=== Example 7: Performance Metrics ===');

const metrics = debuggerInstance.getPerformanceMetrics();
console.log('📊 Performance Metrics:');
console.log(`  - Total Requests: ${metrics.requestCount}`);
console.log(`  - Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
console.log(`  - Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
console.log(`  - Memory Usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
console.log(`  - Spec Load Time: ${metrics.specLoadTime}ms`);
console.log(`  - Nock Setup Time: ${metrics.nockSetupTime}ms`);

// Example 8: Request Trackers
console.log('\n=== Example 8: Request Trackers ===');

const trackers = debuggerInstance.getRequestTrackers();
console.log(`📈 Active request trackers: ${trackers.length}`);

trackers.forEach((tracker, index) => {
  console.log(`  ${index + 1}. ${tracker.requestId}:`);
  console.log(`     URL: ${tracker.url}`);
  console.log(`     Method: ${tracker.method}`);
  console.log(`     Duration: ${tracker.duration || 'pending'}ms`);
  console.log(`     Status: ${tracker.status || 'pending'}`);
  if (tracker.specMatched) {
    console.log(`     Spec: ${tracker.specMatched}`);
  }
  if (tracker.endpointMatched) {
    console.log(`     Endpoint: ${tracker.endpointMatched}`);
  }
});

// Example 9: Debug Sessions
console.log('\n=== Example 9: Debug Sessions ===');

const currentSession = debuggerInstance.getCurrentSession();
if (currentSession) {
  console.log('🎯 Current Session:');
  console.log(`  - ID: ${currentSession.id}`);
  console.log(`  - Level: ${DebugLevel[currentSession.level]}`);
  console.log(`  - Categories: ${currentSession.categories.join(', ')}`);
  console.log(`  - Start Time: ${currentSession.startTime.toISOString()}`);
  console.log(`  - Logs: ${currentSession.logs.length}`);
}

const allSessions = debuggerInstance.getSessions();
console.log(`📚 Total sessions: ${allSessions.length}`);

// Example 10: Integration with Nocchino
console.log('\n=== Example 10: Integration with Nocchino ===');

try {
  // Initialize with debugging
  const endpoints: NocchinoEndpoint[] = [
    {
      baseUrl: 'https://api.example.com',
      specs: ['specs/api-v1'],
    },
  ];

  initialize(endpoints);
  console.log('✅ Nocchino initialized with debugging');

  // Activate request with debugging
  activateNockForRequest({
    url: 'https://api.example.com/v1/users',
    method: 'GET',
  });
  console.log('✅ Request activated with debugging');
} catch (error) {
  debugError(error as Error, { context: 'nocchino_integration' });
  console.log('❌ Error during Nocchino integration');
}

// Example 11: Debug Report Generation
console.log('\n=== Example 11: Debug Report Generation ===');

const report = debuggerInstance.generateReport();
console.log('📋 Debug Report:');
console.log(report);

// Example 12: Session Management
console.log('\n=== Example 12: Session Management ===');

// Start multiple sessions
const session1 = debuggerInstance.startSession(DebugLevel.INFO, [DebugCategory.REQUEST]);
const session2 = debuggerInstance.startSession(DebugLevel.DEBUG, [DebugCategory.ERROR]);
const session3 = debuggerInstance.startSession(DebugLevel.TRACE, [DebugCategory.PERFORMANCE]);

console.log(`🎭 Started 3 sessions: ${session1}, ${session2}, ${session3}`);

// End current session
const endedSession = debuggerInstance.endSession();
if (endedSession) {
  console.log(`🏁 Ended session: ${endedSession.id}`);
  console.log(`   Duration: ${endedSession.endTime!.getTime() - endedSession.startTime.getTime()}ms`);
  console.log(`   Logs: ${endedSession.logs.length}`);
}

// Example 13: Advanced Configuration
console.log('\n=== Example 13: Advanced Configuration ===');

debuggerInstance.configure({
  level: DebugLevel.TRACE,
  categories: [DebugCategory.REQUEST, DebugCategory.PERFORMANCE, DebugCategory.MEMORY],
  enablePerformanceMonitoring: true,
  enableMemoryMonitoring: true,
  enableRequestTracking: true,
  maxLogEntries: 5000,
  sessionTimeout: 600000, // 10 minutes
});

console.log('⚙️ Advanced configuration applied');

// Example 14: Memory Monitoring
console.log('\n=== Example 14: Memory Monitoring ===');

// Monitor memory multiple times
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    debuggerInstance.monitorMemory();
    console.log(`💾 Memory monitored (${i + 1}/5)`);
  }, i * 100);
}

// Example 15: Cleanup and Final Report
console.log('\n=== Example 15: Cleanup and Final Report ===');

// Get final statistics
const finalMetrics = debuggerInstance.getPerformanceMetrics();
const finalLogs = debuggerInstance.getLogs();
const finalSessions = debuggerInstance.getSessions();
const finalTrackers = debuggerInstance.getRequestTrackers();

console.log('📊 Final Statistics:');
console.log(`  - Total Logs: ${finalLogs.length}`);
console.log(`  - Total Sessions: ${finalSessions.length}`);
console.log(`  - Active Trackers: ${finalTrackers.length}`);
console.log(`  - Total Requests: ${finalMetrics.requestCount}`);
console.log(`  - Average Response Time: ${finalMetrics.averageResponseTime.toFixed(2)}ms`);

// Disable debug mode
const finalSession = debuggerInstance.disableDebugMode();
if (finalSession) {
  console.log(`🏁 Final session ended: ${finalSession.id}`);
}

// Clean up
debuggerInstance.clearLogs();
debuggerInstance.clearSessions();
console.log('🧹 Cleanup completed');

console.log('\n🎉 Debugger example completed successfully!');
console.log('\nKey Features Demonstrated:');
console.log('✅ Debug session management with different levels');
console.log('✅ Request tracking with performance metrics');
console.log('✅ Memory usage monitoring');
console.log('✅ Performance tracking for specs and Nock setup');
console.log('✅ Log filtering by level and category');
console.log('✅ Convenience functions for common debugging scenarios');
console.log('✅ Integration with Nocchino functionality');
console.log('✅ Debug report generation');
console.log('✅ Advanced configuration options');
console.log('✅ Session management and cleanup');
