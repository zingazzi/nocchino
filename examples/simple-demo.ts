/**
 * Simple Nocchino Demo
 *
 * This example demonstrates the basic functionality of Nocchino
 * with simplified mock responses that work reliably.
 */

import axios from 'axios';
import nock from 'nock';

import {
  configure,
  activateNockForRequest,
  restoreNock,
} from '../src/utils/dynamicNock';

// Configure Nocchino with simple mapping
configure({
  baseUrl: 'https://api.example.com',
  defaultSpec: 'specs/api-v1/users-api.yml',
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/users-api.yml',
      v2: 'specs/api-v2/users-api-v2.yml',
    },
  },
});

interface UserData {
  email: string
  firstName: string
  lastName: string
  password: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  status: string
  createdAt: string
  updatedAt: string
}

interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems: number
  }
  total: number
}

interface ErrorResponse {
  error: string
  code: string
  details?: Record<string, any>
}

/**
 * Simple demonstration of Nocchino functionality
 */
export async function runSimpleDemo(): Promise<void> {
  try {
    // Example 1: Basic GET request

    // Set up a simple mock response
    nock('https://api.example.com')
      .get('/v1/users')
      .reply(200, {
        users: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalItems: 1,
        },
        total: 1,
      } as UserListResponse);

    const response = await axios.get<UserListResponse>(
      'https://api.example.com/v1/users',
      {
        headers: { 'X-Api-Version': 'v1' },
      },
    );

    // Clean up
    nock.cleanAll();

    // Example 2: POST request

    nock('https://api.example.com')
      .post('/v1/users')
      .reply(201, {
        id: '456e7890-e89b-12d3-a456-426614174001',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      } as User);

    const userData: UserData = {
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
    };

    const createResponse = await axios.post<User>(
      'https://api.example.com/v1/users',
      userData,
      {
        headers: { 'X-Api-Version': 'v1' },
      },
    );

    // Clean up
    nock.cleanAll();

    // Example 3: Error handling

    nock('https://api.example.com')
      .get('/v1/users/nonexistent')
      .reply(404, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        details: {
          userId: 'nonexistent',
        },
      } as ErrorResponse);

    try {
      await axios.get('https://api.example.com/v1/users/nonexistent', {
        headers: { 'X-Api-Version': 'v1' },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Error handled correctly
      }
    }

    // Clean up
    nock.cleanAll();
  } catch (error) {
    console.error(
      '❌ Error during demo:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    nock.cleanAll();
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runSimpleDemo();
}
