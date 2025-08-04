import type { NocchinoEndpoint } from '../src/types';
import {
  initialize, getState, restoreNock,
} from '../src/utils/dynamicNock';

describe('Multi-Endpoint Basic Tests', () => {
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

  test('should handle single endpoint', () => {
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

    initialize(endpoints);

    const state = getState();
    expect(state.endpoints).toHaveLength(0);
  });

  test('should load specifications from folders and files', () => {
    const endpoints: NocchinoEndpoint[] = [
      {
        baseUrl: 'https://api.example.com',
        specs: [
          'specs/api-v1', // Folder
          'specs/api-v2/users-api-v2.yml', // Single file
        ],
      },
    ];

    initialize(endpoints);

    const state = getState();
    expect(state.endpoints).toHaveLength(1);
    expect(state.endpoints[0]?.specs).toContain('specs/api-v1');
    expect(state.endpoints[0]?.specs).toContain('specs/api-v2/users-api-v2.yml');
  });
});
