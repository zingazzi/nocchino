/**
 * Error Handling Tests for Nocchino
 *
 * This test file validates the comprehensive error handling system
 * including error types, severity levels, and recovery strategies.
 */

import {
  initialize,
  activateNockForRequest,
  restoreNock,
  getState,
} from '../src/utils/dynamicNock';
import {
  ErrorHandler,
  ErrorCode,
  ErrorSeverity,
  ErrorCategory,
  errorHandler,
  createSpecNotFoundError,
  createEndpointMismatchError,
  createMockGenerationError,
  createValidationError,
} from '../src/utils/errorHandler';

describe('Error Handling System', () => {
  beforeEach(() => {
    // Clear error log before each test
    errorHandler.clearErrorLog();
  });

  afterEach(() => {
    restoreNock();
  });

  describe('Error Handler Instance', () => {
    test('should be a singleton', () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      expect(handler1).toBe(handler2);
    });

    test('should create structured errors', () => {
      const error = errorHandler.createError(
        ErrorCode.SPEC_NOT_FOUND,
        'Test error message',
        { url: 'https://api.example.com/test' },
        ErrorSeverity.MEDIUM,
        true,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.SPEC_NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.context.url).toBe('https://api.example.com/test');
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    test('should log errors', () => {
      const error = errorHandler.createError(
        ErrorCode.INVALID_CONFIG,
        'Test error',
      );

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]).toBe(error);
    });

    test('should maintain log size limit', () => {
      // Create more errors than the max log size
      for (let i = 0; i < 1100; i++) {
        errorHandler.createError(
          ErrorCode.SPEC_NOT_FOUND,
          `Error ${i}`,
        );
      }

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors.length).toBeLessThanOrEqual(1000);
    });

    test('should provide error statistics', () => {
      errorHandler.createError(ErrorCode.SPEC_NOT_FOUND, 'Error 1');
      errorHandler.createError(ErrorCode.SPEC_NOT_FOUND, 'Error 2');
      errorHandler.createError(ErrorCode.INVALID_CONFIG, 'Error 3');

      const stats = errorHandler.getErrorStats();
      expect(stats[ErrorCode.SPEC_NOT_FOUND]).toBe(2);
      expect(stats[ErrorCode.INVALID_CONFIG]).toBe(1);
      expect(stats[ErrorCategory.SPECIFICATION]).toBe(2);
      expect(stats[ErrorCategory.CONFIGURATION]).toBe(1);
    });
  });

  describe('Convenience Error Functions', () => {
    test('should create spec not found error', () => {
      const error = createSpecNotFoundError('https://api.example.com/test', {
        method: 'GET',
      });

      expect(error.code).toBe(ErrorCode.SPEC_NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.recoverable).toBe(true);
      expect(error.context.url).toBe('https://api.example.com/test');
      expect(error.context.method).toBe('GET');
    });

    test('should create endpoint mismatch error', () => {
      const availableEndpoints = ['https://api1.com', 'https://api2.com'];
      const error = createEndpointMismatchError(
        'https://api3.com/test',
        availableEndpoints,
        { method: 'POST' },
      );

      expect(error.code).toBe(ErrorCode.ENDPOINT_MISMATCH);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.context.url).toBe('https://api3.com/test');
      expect(error.context.additionalInfo?.['availableEndpoints']).toEqual(availableEndpoints);
    });

    test('should create mock generation error', () => {
      const error = createMockGenerationError('Schema validation failed', {
        filePath: '/path/to/spec.yml',
      });

      expect(error.code).toBe(ErrorCode.MOCK_GENERATION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.context.filePath).toBe('/path/to/spec.yml');
    });

    test('should create validation error', () => {
      const error = createValidationError('Invalid request body', {
        method: 'POST',
        url: 'https://api.example.com/users',
      });

      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.context.method).toBe('POST');
      expect(error.context.url).toBe('https://api.example.com/users');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate proper configuration', () => {
      const validEndpoints = [
        {
          baseUrl: 'https://api.example.com',
          specs: ['specs/api-v1'],
        },
      ];

      expect(() => {
        errorHandler.validateConfiguration(validEndpoints);
      }).not.toThrow();
    });

    test('should reject non-array endpoints', () => {
      expect(() => {
        errorHandler.validateConfiguration('invalid' as any);
      }).toThrow();

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors[0]?.code).toBe(ErrorCode.INVALID_CONFIG);
    });

    test('should reject empty endpoints array', () => {
      expect(() => {
        errorHandler.validateConfiguration([]);
      }).toThrow();

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors[0]?.code).toBe(ErrorCode.MISSING_ENDPOINTS);
    });

    test('should reject invalid endpoint objects', () => {
      const invalidEndpoints = [
        {
          baseUrl: 'https://api.example.com',
          // Missing specs array
        },
      ];

      expect(() => {
        errorHandler.validateConfiguration(invalidEndpoints as any);
      }).toThrow();

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors[0]?.code).toBe(ErrorCode.INVALID_ENDPOINT_CONFIG);
    });
  });

  describe('Error Recovery Strategies', () => {
    test('should handle spec not found gracefully', () => {
      // Enable debug mode to see warnings
      errorHandler.setDebugMode(true);

      const error = createSpecNotFoundError('https://api.example.com/test');
      errorHandler.handleError(error);

      // Should not throw, just log warning
      expect(() => {
        errorHandler.handleError(error);
      }).not.toThrow();
    });

    test('should handle endpoint mismatch gracefully', () => {
      errorHandler.setDebugMode(true);

      const error = createEndpointMismatchError(
        'https://api3.com/test',
        ['https://api1.com', 'https://api2.com'],
      );
      errorHandler.handleError(error);

      // Should not throw, just log warning
      expect(() => {
        errorHandler.handleError(error);
      }).not.toThrow();
    });

    test('should handle memory errors critically', () => {
      const error = errorHandler.createError(
        ErrorCode.MEMORY_ERROR,
        'Memory limit exceeded',
        {},
        ErrorSeverity.CRITICAL,
        false,
      );

      // Should clear error log to free memory
      const initialLogSize = errorHandler.getRecentErrors().length;
      errorHandler.handleError(error);
      const finalLogSize = errorHandler.getRecentErrors().length;

      expect(finalLogSize).toBeLessThanOrEqual(initialLogSize);
    });
  });

  describe('Integration with DynamicNockRepository', () => {
    test('should handle invalid configuration during initialization', () => {
      const invalidEndpoints = [
        {
          baseUrl: 'https://api.example.com',
          // Missing specs array
        },
      ];

      expect(() => {
        initialize(invalidEndpoints as any);
      }).toThrow();

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors.length).toBeGreaterThan(0);
      expect(recentErrors[0]?.code).toBe(ErrorCode.INVALID_ENDPOINT_CONFIG);
    });

    test('should handle missing specifications gracefully', () => {
      const validEndpoints = [
        {
          baseUrl: 'https://api.example.com',
          specs: ['specs/api-v1'],
        },
      ];

      initialize(validEndpoints);

      // This should not throw, just log warnings
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v1/users',
          method: 'GET',
        });
      }).not.toThrow();

      // The system handles missing specs gracefully, so we don't expect errors
      // but we can verify the system is working
      const state = getState();
      expect(state.endpoints).toHaveLength(1);
    });

    test('should handle endpoint mismatches gracefully', () => {
      const validEndpoints = [
        {
          baseUrl: 'https://api.example.com',
          specs: ['specs/api-v1'],
        },
      ];

      initialize(validEndpoints);

      // Request to non-configured endpoint
      expect(() => {
        activateNockForRequest({
          url: 'https://different-api.com/v1/users',
          method: 'GET',
        });
      }).not.toThrow();

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Debug Mode', () => {
    test('should enable debug mode', () => {
      errorHandler.setDebugMode(true);

      // Create an error and check if it's logged
      const error = errorHandler.createError(
        ErrorCode.SPEC_NOT_FOUND,
        'Debug test error',
      );

      // In a real scenario, this would log to console
      // For testing, we just verify the error was created
      expect(error.code).toBe(ErrorCode.SPEC_NOT_FOUND);
    });

    test('should disable debug mode', () => {
      errorHandler.setDebugMode(false);

      const error = errorHandler.createError(
        ErrorCode.SPEC_NOT_FOUND,
        'Non-debug test error',
      );

      expect(error.code).toBe(ErrorCode.SPEC_NOT_FOUND);
    });
  });

  describe('Error Context', () => {
    test('should include request details in error context', () => {
      const requestDetails = {
        url: 'https://api.example.com/v1/users',
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      };

      const error = errorHandler.createError(
        ErrorCode.SPEC_NOT_FOUND,
        'Test error with request details',
        { requestDetails },
      );

      expect(error.context.requestDetails).toEqual(requestDetails);
    });

    test('should include endpoint information in error context', () => {
      const endpoint = {
        baseUrl: 'https://api.example.com',
        specs: ['specs/api-v1'],
      };

      const error = errorHandler.createError(
        ErrorCode.ENDPOINT_MISMATCH,
        'Test error with endpoint details',
        { endpoint },
      );

      expect(error.context.endpoint).toEqual(endpoint);
    });

    test('should include additional info in error context', () => {
      const additionalInfo = {
        retryAttempt: 3,
        maxRetries: 5,
        lastError: 'Previous error message',
      };

      const error = errorHandler.createError(
        ErrorCode.MOCK_GENERATION_FAILED,
        'Test error with additional info',
        { additionalInfo },
      );

      expect(error.context.additionalInfo).toEqual(additionalInfo);
    });
  });
});
