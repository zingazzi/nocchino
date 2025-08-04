import {
  configure, activateNockForRequest, restoreNock,
} from '../src/utils/dynamicNock';

describe('User Service Tests', () => {
  // Configure Nocchino with multi-endpoint setup
  beforeAll(() => {
    configure({
      endpoints: [
        {
          baseUrl: 'https://api.example.com',
          specs: ['specs/api-v1', 'specs/api-v2'],
        },
      ],
    });
  });

  // Clean up after each test
  afterEach(() => {
    restoreNock();
  });

  describe('User API v1 Tests', () => {
    test('should list users with v1 API', () => {
      // Activate Nock for v1 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v1/users',
          method: 'GET',
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });

    test('should create user with v1 API', () => {
      // Activate Nock for v1 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v1/users',
          method: 'POST',
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            password: 'password123',
          },
        });
      }).not.toThrow();
    });

    test('should get user by ID with v1 API', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Activate Nock for v1 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: `https://api.example.com/v1/users/${userId}`,
          method: 'GET',
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });

    test('should get user profile with v1 API', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Activate Nock for v1 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: `https://api.example.com/v1/users/${userId}/profile`,
          method: 'GET',
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });
  });

  describe('User API v2 Tests', () => {
    test('should list users with v2 API', () => {
      // Activate Nock for v2 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v2/users',
          method: 'GET',
          headers: {
            'X-Api-Version': 'v2',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });

    test('should create user with v2 API', () => {
      // Activate Nock for v2 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v2/users',
          method: 'POST',
          headers: {
            'X-Api-Version': 'v2',
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            password: 'password123',
            role: 'user',
          },
        });
      }).not.toThrow();
    });

    test('should get user profile with v2 API', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Activate Nock for v2 API - should not throw
      expect(() => {
        activateNockForRequest({
          url: `https://api.example.com/v2/users/${userId}/profile`,
          method: 'GET',
          headers: {
            'X-Api-Version': 'v2',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });
  });

  describe('Environment-based Tests', () => {
    test('should use staging environment', () => {
      // Activate Nock for staging environment - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v1/users',
          method: 'GET',
          headers: {
            'X-Environment': 'staging',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });

    test('should use production environment', () => {
      // Activate Nock for production environment - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/v2/users',
          method: 'GET',
          headers: {
            'X-Environment': 'production',
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle missing API version gracefully', () => {
      // Activate Nock without API version - should not throw
      expect(() => {
        activateNockForRequest({
          url: 'https://api.example.com/users',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }).not.toThrow();
    });
  });
});
