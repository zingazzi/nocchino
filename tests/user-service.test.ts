import axios from 'axios'

import {
  configure,
  activateNockForRequest,
  restoreNock,
} from '../src/utils/dynamicNock'

/**
 * Example test suite demonstrating Nocchino usage
 *
 * This test file shows how to use the dynamic Nock repository for testing
 * API interactions with different versions and scenarios.
 *
 * Design Patterns Demonstrated:
 * - Strategy Pattern: Different API versions based on headers
 * - Factory Pattern: Dynamic mock response generation
 * - Template Method Pattern: Test setup and teardown flow
 */

describe('User Service Tests', () => {
  // Configure Nocchino with mapping rules
  beforeAll(() => {
    configure({
      baseUrl: 'https://api.example.com',
      defaultSpec: 'specs', // Now points to the specs folder
      specMap: {
        'X-Api-Version': {
          v1: 'specs/api-v1/users-api.yml',
          v2: 'specs/api-v2/users-api-v2.yml',
        },
        'X-Environment': {
          staging: 'specs/api-v1/users-api.yml',
          production: 'specs/api-v2/users-api-v2.yml',
        },
      },
    })
  })

  // Clean up after each test
  afterEach(() => {
    restoreNock()
  })

  describe('User API v1 Tests', () => {
    test('should list users with v1 API', async () => {
      // Activate Nock for v1 API
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'GET',
        headers: {
          'X-Api-Version': 'v1',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get('https://api.example.com/v1/users', {
        headers: {
          'X-Api-Version': 'v1',
          'Content-Type': 'application/json',
        },
      })

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
      expect(response.data).toHaveProperty('pagination')
      expect(response.data).toHaveProperty('total')
      expect(Array.isArray(response.data.users)).toBe(true)

      // Check user structure
      if (response.data.users.length > 0) {
        const user = response.data.users[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('firstName')
        expect(user).toHaveProperty('lastName')
        expect(user).toHaveProperty('status')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
      }
    })

    test('should create user with v1 API', async () => {
      // Activate Nock for v1 API
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'POST',
        headers: {
          'X-Api-Version': 'v1',
          'Content-Type': 'application/json',
        },
      })

      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      }

      // Make the actual request
      const response = await axios.post(
        'https://api.example.com/v1/users',
        userData,
        {
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        }
      )

      // Assertions
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email', userData.email)
      expect(response.data).toHaveProperty('firstName', userData.firstName)
      expect(response.data).toHaveProperty('lastName', userData.lastName)
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('createdAt')
      expect(response.data).toHaveProperty('updatedAt')
    })

    test('should get user by ID with v1 API', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Activate Nock for v1 API
      activateNockForRequest({
        url: `https://api.example.com/v1/users/${userId}`,
        method: 'GET',
        headers: {
          'X-Api-Version': 'v1',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get(
        `https://api.example.com/v1/users/${userId}`,
        {
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        }
      )

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', userId)
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('firstName')
      expect(response.data).toHaveProperty('lastName')
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('createdAt')
      expect(response.data).toHaveProperty('updatedAt')
    })

    test('should get user profile with v1 API', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Activate Nock for v1 API
      activateNockForRequest({
        url: `https://api.example.com/v1/users/${userId}/profile`,
        method: 'GET',
        headers: {
          'X-Api-Version': 'v1',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get(
        `https://api.example.com/v1/users/${userId}/profile`,
        {
          headers: {
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json',
          },
        }
      )

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('preferences')
      expect(response.data).toHaveProperty('statistics')

      // Check user object
      expect(response.data.user).toHaveProperty('id', userId)
      expect(response.data.user).toHaveProperty('email')
      expect(response.data.user).toHaveProperty('firstName')
      expect(response.data.user).toHaveProperty('lastName')

      // Check preferences
      expect(response.data.preferences).toHaveProperty('theme')
      expect(response.data.preferences).toHaveProperty('language')
      expect(response.data.preferences).toHaveProperty('notifications')

      // Check statistics
      expect(response.data.statistics).toHaveProperty('loginCount')
      expect(response.data.statistics).toHaveProperty('lastLoginAt')
    })
  })

  describe('User API v2 Tests', () => {
    test('should list users with v2 API', async () => {
      // Activate Nock for v2 API
      activateNockForRequest({
        url: 'https://api.example.com/v2/users',
        method: 'GET',
        headers: {
          'X-Api-Version': 'v2',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get('https://api.example.com/v2/users', {
        headers: {
          'X-Api-Version': 'v2',
          'Content-Type': 'application/json',
        },
      })

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
      expect(response.data).toHaveProperty('pagination')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('filters')
      expect(Array.isArray(response.data.users)).toBe(true)

      // Check enhanced user structure (v2)
      if (response.data.users.length > 0) {
        const user = response.data.users[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('firstName')
        expect(user).toHaveProperty('lastName')
        expect(user).toHaveProperty('status')
        expect(user).toHaveProperty('role') // New in v2
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
        expect(user).toHaveProperty('lastLoginAt') // New in v2
        expect(user).toHaveProperty('emailVerified') // New in v2
        expect(user).toHaveProperty('twoFactorEnabled') // New in v2
      }
    })

    test('should create user with v2 API', async () => {
      // Activate Nock for v2 API
      activateNockForRequest({
        url: 'https://api.example.com/v2/users',
        method: 'POST',
        headers: {
          'X-Api-Version': 'v2',
          'Content-Type': 'application/json',
        },
      })

      const userData = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
        role: 'user',
        sendWelcomeEmail: true,
      }

      // Make the actual request
      const response = await axios.post(
        'https://api.example.com/v2/users',
        userData,
        {
          headers: {
            'X-Api-Version': 'v2',
            'Content-Type': 'application/json',
          },
        }
      )

      // Assertions - expect consistent mock data structure
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('firstName')
      expect(response.data).toHaveProperty('lastName')
      expect(response.data).toHaveProperty('role')
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('createdAt')
      expect(response.data).toHaveProperty('updatedAt')
      expect(response.data).toHaveProperty('emailVerified')
      expect(response.data).toHaveProperty('twoFactorEnabled')

      // Verify the response contains the expected V2 fields
      expect(response.data.emailVerified).toBe(true)
      expect(response.data.twoFactorEnabled).toBe(false)
      expect(response.data.role).toBe('user')
    })

    test('should get user profile with v2 API', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Activate Nock for v2 API
      activateNockForRequest({
        url: `https://api.example.com/v2/users/${userId}/profile`,
        method: 'GET',
        headers: {
          'X-Api-Version': 'v2',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get(
        `https://api.example.com/v2/users/${userId}/profile`,
        {
          headers: {
            'X-Api-Version': 'v2',
            'Content-Type': 'application/json',
          },
        }
      )

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('preferences')
      expect(response.data).toHaveProperty('statistics')
      expect(response.data).toHaveProperty('security') // New in v2

      // Check enhanced user object (v2)
      expect(response.data.user).toHaveProperty('id', userId)
      expect(response.data.user).toHaveProperty('email')
      expect(response.data.user).toHaveProperty('firstName')
      expect(response.data.user).toHaveProperty('lastName')
      expect(response.data.user).toHaveProperty('role')
      expect(response.data.user).toHaveProperty('emailVerified')
      expect(response.data.user).toHaveProperty('twoFactorEnabled')

      // Check enhanced preferences (v2)
      expect(response.data.preferences).toHaveProperty('theme')
      expect(response.data.preferences).toHaveProperty('language')
      expect(response.data.preferences).toHaveProperty('notifications')
      expect(response.data.preferences).toHaveProperty('timezone') // New in v2
      expect(response.data.preferences.notifications).toHaveProperty('email')
      expect(response.data.preferences.notifications).toHaveProperty('push')
      expect(response.data.preferences.notifications).toHaveProperty('sms')

      // Check enhanced statistics (v2)
      expect(response.data.statistics).toHaveProperty('loginCount')
      expect(response.data.statistics).toHaveProperty('lastLoginAt')
      expect(response.data.statistics).toHaveProperty('sessionDuration') // New in v2
      expect(response.data.statistics).toHaveProperty('devicesCount') // New in v2

      // Check security (new in v2)
      expect(response.data.security).toHaveProperty('passwordChangedAt')
      expect(response.data.security).toHaveProperty('failedLoginAttempts')
      expect(response.data.security).toHaveProperty('lastFailedLoginAt')
    })
  })

  describe('Environment-based Tests', () => {
    test('should use staging environment', async () => {
      // Activate Nock for staging environment
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'GET',
        headers: {
          'X-Environment': 'staging',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get('https://api.example.com/v1/users', {
        headers: {
          'X-Environment': 'staging',
          'Content-Type': 'application/json',
        },
      })

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
    })

    test('should use production environment', async () => {
      // Activate Nock for production environment
      activateNockForRequest({
        url: 'https://api.example.com/v2/users',
        method: 'GET',
        headers: {
          'X-Environment': 'production',
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get('https://api.example.com/v2/users', {
        headers: {
          'X-Environment': 'production',
          'Content-Type': 'application/json',
        },
      })

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
      expect(response.data).toHaveProperty('filters') // v2 feature
    })
  })

  describe('Error Handling Tests', () => {
    test('should handle missing API version gracefully', async () => {
      // This should use the default spec
      activateNockForRequest({
        url: 'https://api.example.com/v1/users',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Make the actual request
      const response = await axios.get('https://api.example.com/v1/users', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Assertions
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
    })
  })
})
