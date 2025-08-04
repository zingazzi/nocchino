import type { NocchinoEndpoint } from '../src/types';
import {
  initialize, activateNockForRequest, restoreNock, getState,
} from '../src/utils/dynamicNock';

describe('Multi-Endpoint Functionality', () => {
  afterEach(() => {
    restoreNock();
  });

  test('should initialize with multiple endpoints', () => {
    const endpoints: NocchinoEndpoint[] = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['./specs/api-v1', './specs/api-v2/users-api-v2.yml'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['./specs/api-v2', './specs/api-v1/products-api.yml'],
      },
    ];

    initialize(endpoints);

    const state = getState();
    expect(state.endpoints).toHaveLength(2);
    expect(state.endpoints[0]?.baseUrl).toBe('https://api.example.com');
    expect(state.endpoints[1]?.baseUrl).toBe('https://api.example2.com');
    expect(state.endpoints[0]?.specs).toContain('./specs/api-v1');
    expect(state.endpoints[1]?.specs).toContain('./specs/api-v2');
  });

  test('should handle requests to different endpoints', () => {
    const endpoints: NocchinoEndpoint[] = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['./specs/api-v1'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['./specs/api-v2'],
      },
    ];

    initialize(endpoints);

    // These should not throw errors even if specs don't exist
    expect(() => {
      activateNockForRequest({
        url: 'https://api.example.com/users/123',
        method: 'GET',
      });
    }).not.toThrow();

    expect(() => {
      activateNockForRequest({
        url: 'https://api.example2.com/products/456',
        method: 'POST',
        body: { name: 'Test Product' },
      });
    }).not.toThrow();
  });

  test('should handle single endpoint configuration', () => {
    const endpoints: NocchinoEndpoint[] = [
      {
        baseUrl: 'https://api.example.com',
        specs: ['./specs/api-v1'],
      },
    ];

    initialize(endpoints);

    const state = getState();
    expect(state.endpoints).toHaveLength(1);
    expect(state.endpoints[0]?.baseUrl).toBe('https://api.example.com');
  });

  test('should handle empty endpoints array', () => {
    const endpoints: NocchinoEndpoint[] = [];

    expect(() => {
      initialize(endpoints);
    }).toThrow();

    // Should throw an error for empty endpoints array
    expect(() => {
      initialize(endpoints);
    }).toThrow('At least one endpoint must be configured');
  });
});
