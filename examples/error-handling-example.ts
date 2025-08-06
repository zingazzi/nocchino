/**
 * Error Handling Example for Nocchino
 *
 * This example demonstrates how to use the comprehensive error handling system
 * in real-world scenarios with proper error recovery and debugging.
 */

import {
  initialize,
  configure,
  activateNockForRequest,
  restoreNock,
  getState,
  errorHandler,
  ErrorCode,
  ErrorSeverity,
  createSpecNotFoundError,
  createEndpointMismatchError,
  createMockGenerationError,
} from '../src/utils/dynamicNock';
import {
  ErrorHandler,
  ErrorCategory,
} from '../src/utils/errorHandler';

// Example 1: Basic Error Handling Setup
console.log('=== Example 1: Basic Error Handling Setup ===');

// Enable debug mode for detailed error logging
errorHandler.setDebugMode(true);

// Configure with proper error handling
try {
  const endpoints = [
    {
      baseUrl: 'https://api.example.com',
      specs: ['specs/api-v1', 'specs/api-v2'],
    },
    {
      baseUrl: 'https://api.example2.com',
      specs: ['specs/api-v2'],
    },
  ];

  initialize(endpoints);
  console.log('✅ Configuration successful');
} catch (error) {
  console.error('❌ Configuration failed:', error instanceof Error ? error.message : 'Unknown error');

  // Get error statistics
  const stats = errorHandler.getErrorStats();
  console.log('Error Statistics:', stats);
}

// Example 2: Handling Missing Specifications
console.log('\n=== Example 2: Handling Missing Specifications ===');

try {
  // Try to activate a request that might not have a matching spec
  activateNockForRequest({
    url: 'https://api.example.com/v1/users/123',
    method: 'GET',
  });

  console.log('✅ Request activated successfully');
} catch (error) {
  console.log('⚠️ Request activation failed (expected for missing specs)');

  // Get recent errors
  const recentErrors = errorHandler.getRecentErrors(5);
  console.log('Recent Errors:', recentErrors.map((e) => ({
    code: e.code,
    message: e.message,
    severity: e.severity,
    recoverable: e.recoverable,
  })));
}

// Example 3: Endpoint Mismatch Handling
console.log('\n=== Example 3: Endpoint Mismatch Handling ===');

try {
  // Try to activate a request to a non-configured endpoint
  activateNockForRequest({
    url: 'https://unknown-api.com/v1/users',
    method: 'GET',
  });

  console.log('✅ Request activated successfully');
} catch (error) {
  console.log('⚠️ Endpoint mismatch handled gracefully');

  // Check error statistics
  const stats = errorHandler.getErrorStats();
  if (stats[ErrorCode.ENDPOINT_MISMATCH]) {
    console.log(`Found ${stats[ErrorCode.ENDPOINT_MISMATCH]} endpoint mismatch errors`);
  }
}

// Example 4: Custom Error Handling
console.log('\n=== Example 4: Custom Error Handling ===');

// Create custom error handling scenarios
const customError = createSpecNotFoundError('https://api.example.com/custom-endpoint', {
  method: 'POST',
  additionalInfo: {
    customField: 'custom value',
    retryAttempt: 1,
  },
});

console.log('Custom Error Created:', {
  code: customError.code,
  message: customError.message,
  severity: customError.severity,
  context: customError.context,
});

// Handle the error
errorHandler.handleError(customError);

// Example 5: Error Recovery Strategies
console.log('\n=== Example 5: Error Recovery Strategies ===');

// Simulate different error scenarios
const errorScenarios = [
  {
    name: 'Spec Not Found',
    error: createSpecNotFoundError('https://api.example.com/missing-spec'),
    expectedBehavior: 'Graceful handling with warning',
  },
  {
    name: 'Endpoint Mismatch',
    error: createEndpointMismatchError(
      'https://wrong-api.com/test',
      ['https://api1.com', 'https://api2.com'],
    ),
    expectedBehavior: 'Graceful handling with available endpoints info',
  },
  {
    name: 'Mock Generation Failed',
    error: createMockGenerationError('Schema validation failed'),
    expectedBehavior: 'Fallback to empty response',
  },
];

errorScenarios.forEach((scenario) => {
  console.log(`\nTesting: ${scenario.name}`);
  console.log(`Expected: ${scenario.expectedBehavior}`);

  try {
    errorHandler.handleError(scenario.error);
    console.log('✅ Handled successfully');
  } catch (error) {
    console.log('❌ Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Example 6: Error Statistics and Monitoring
console.log('\n=== Example 6: Error Statistics and Monitoring ===');

// Get comprehensive error statistics
const stats = errorHandler.getErrorStats();
console.log('Error Statistics by Category:');
Object.entries(stats).forEach(([category, count]) => {
  if (Object.values(ErrorCategory).includes(category as ErrorCategory)) {
    console.log(`  ${category}: ${count} errors`);
  }
});

console.log('\nError Statistics by Code:');
Object.entries(stats).forEach(([code, count]) => {
  if (Object.values(ErrorCode).includes(code as ErrorCode)) {
    console.log(`  ${code}: ${count} errors`);
  }
});

// Example 7: Debug Mode and Logging
console.log('\n=== Example 7: Debug Mode and Logging ===');

// Toggle debug mode
console.log('Enabling debug mode...');
errorHandler.setDebugMode(true);

// Create some test errors to see debug output
const debugError = errorHandler.createError(
  ErrorCode.SPEC_NOT_FOUND,
  'Debug test error',
  { url: 'https://api.example.com/debug-test' },
  ErrorSeverity.LOW,
  true,
);

console.log('Debug error created with code:', debugError.code);

// Disable debug mode
console.log('Disabling debug mode...');
errorHandler.setDebugMode(false);

// Example 8: Error Context and Additional Information
console.log('\n=== Example 8: Error Context and Additional Information ===');

const contextError = errorHandler.createError(
  ErrorCode.VALIDATION_FAILED,
  'Request validation failed',
  {
    url: 'https://api.example.com/users',
    method: 'POST',
    additionalInfo: {
      validationErrors: ['Missing required field: email', 'Invalid format: phone'],
      requestBody: { name: 'John Doe' },
      timestamp: new Date().toISOString(),
    },
  },
  ErrorSeverity.MEDIUM,
  true,
);

console.log('Error with rich context:', {
  code: contextError.code,
  message: contextError.message,
  context: {
    url: contextError.context.url,
    method: contextError.context.method,
    additionalInfo: contextError.context.additionalInfo,
  },
});

// Example 9: Error Recovery and Retry Logic
console.log('\n=== Example 9: Error Recovery and Retry Logic ===');

// Simulate a retry scenario
const maxRetries = 3;
let retryCount = 0;

const simulateRetryableOperation = () => {
          retryCount += 1;

  if (retryCount < maxRetries) {
    const retryError = errorHandler.createError(
      ErrorCode.SPEC_LOAD_FAILED,
      `Spec loading failed (attempt ${retryCount}/${maxRetries})`,
      {
        retryCount,
        maxRetries,
        additionalInfo: {
          attempt: retryCount,
          maxAttempts: maxRetries,
        },
      },
      ErrorSeverity.MEDIUM,
      true,
    );

    console.log(`Attempt ${retryCount} failed, retrying...`);
    errorHandler.handleError(retryError);
    return false; // Indicate failure, should retry
  }

  console.log('✅ Operation succeeded after retries');
  return true; // Indicate success
};

// Simulate the retry logic
while (!simulateRetryableOperation() && retryCount < maxRetries) {
  // In a real scenario, you might add a delay here
  // await new Promise(resolve => setTimeout(resolve, 1000));
}

// Example 10: Cleanup and Final Statistics
console.log('\n=== Example 10: Cleanup and Final Statistics ===');

// Get final error statistics
const finalStats = errorHandler.getErrorStats();
console.log('Final Error Statistics:');
console.log(JSON.stringify(finalStats, null, 2));

// Get recent errors for analysis
const recentErrors = errorHandler.getRecentErrors(10);
console.log(`\nRecent ${recentErrors.length} Errors:`);
recentErrors.forEach((error, index) => {
  console.log(`${index + 1}. ${error.code}: ${error.message} (${error.severity})`);
});

// Clean up
restoreNock();
console.log('\n✅ Cleanup completed');

// Example 11: Error Handler Singleton Pattern
console.log('\n=== Example 11: Error Handler Singleton Pattern ===');

const handler1 = ErrorHandler.getInstance();
const handler2 = ErrorHandler.getInstance();

console.log('Singleton test:', handler1 === handler2 ? '✅ Passed' : '❌ Failed');

// Example 12: Error Categories and Classification
console.log('\n=== Example 12: Error Categories and Classification ===');

const categoryErrors = [
  { code: ErrorCode.INVALID_CONFIG, category: ErrorCategory.CONFIGURATION },
  { code: ErrorCode.SPEC_NOT_FOUND, category: ErrorCategory.SPECIFICATION },
  { code: ErrorCode.ENDPOINT_MISMATCH, category: ErrorCategory.REQUEST },
  { code: ErrorCode.MOCK_GENERATION_FAILED, category: ErrorCategory.RESPONSE },
  { code: ErrorCode.MEMORY_ERROR, category: ErrorCategory.SYSTEM },
];

categoryErrors.forEach(({ code, category }) => {
  const error = errorHandler.createError(code, `Test ${category} error`);
  console.log(`Created ${category} error with code: ${error.code}`);
});

console.log('\n🎉 Error handling example completed successfully!');
console.log('\nKey Features Demonstrated:');
console.log('✅ Structured error types with codes and severity levels');
console.log('✅ Rich error context with request details and additional info');
console.log('✅ Error categorization and statistics');
console.log('✅ Debug mode for detailed logging');
console.log('✅ Graceful error recovery strategies');
console.log('✅ Singleton pattern for centralized error handling');
console.log('✅ Configuration validation with proper error messages');
console.log('✅ Integration with existing Nocchino functionality');
