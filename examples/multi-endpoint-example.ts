import type { NocchinoEndpoint, NocchinoConfig } from '../src/types';
import {
  initialize, activateNockForRequest, restoreNock, configure,
} from '../src/utils/dynamicNock';

/**
 * Multi-Endpoint Example
 *
 * This example demonstrates how to use Nocchino with multiple endpoints
 * in the same test suite. You can test against different APIs simultaneously.
 */

// Example 1: Using the new initialize method
async function multiEndpointExample() {
  console.log('🚀 Multi-Endpoint Example\n');

  // Configure multiple endpoints with their respective OpenAPI specifications
  const endpoints: NocchinoEndpoint[] = [
    {
      baseUrl: 'https://api.example.com',
      specs: [
        './specs/api-v1', // Folder containing OpenAPI specs
        './specs/api-v2/users-api-v2.yml', // Single file
      ],
    },
    {
      baseUrl: 'https://api.example2.com',
      specs: [
        './specs/api-v2', // Another folder
        './specs/api-v1/products-api.yml', // Another single file
      ],
    },
  ];

  try {
    // Initialize the repository with multiple endpoints
    initialize(endpoints);
    console.log('✅ Multi-endpoint initialization completed');

    // Example: Making requests to different endpoints in the same test
    console.log('\n📋 Testing different endpoints...');

    // Request to first endpoint
    activateNockForRequest({
      url: 'https://api.example.com/users/123',
      method: 'GET',
    });
    console.log('✅ Activated nock for api.example.com');

    // Request to second endpoint
    activateNockForRequest({
      url: 'https://api.example2.com/products/456',
      method: 'POST',
      body: { name: 'Test Product' },
    });
    console.log('✅ Activated nock for api.example2.com');

    // Both endpoints will now have their respective OpenAPI specs loaded
    // and nock intercepts set up based on the specifications

    console.log('\n🎉 Multi-endpoint nock setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up multi-endpoint nock:', error);
  } finally {
    // Clean up all intercepts
    restoreNock();
    console.log('🧹 Cleaned up all intercepts');
  }
}

// Example 2: Using the configure method (backward compatible)
async function configureExample() {
  console.log('\n🔄 Configure Method Example\n');

  const config: NocchinoConfig = {
    endpoints: [
      {
        baseUrl: 'https://api.example.com',
        specs: ['./specs/api-v1'],
      },
      {
        baseUrl: 'https://api.example2.com',
        specs: ['./specs/api-v2'],
      },
    ],
    specMap: {
      'x-api-version': {
        v1: './specs/api-v1',
        v2: './specs/api-v2',
      },
    },
  };

  try {
    configure(config);
    console.log('✅ Configuration completed');

    // Test different API versions
    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: { 'x-api-version': 'v1' },
    });
    console.log('✅ Activated nock for v1 API');

    activateNockForRequest({
      url: 'https://api.example.com/v2/users',
      method: 'GET',
      headers: { 'x-api-version': 'v2' },
    });
    console.log('✅ Activated nock for v2 API');

    console.log('\n🎉 Configure method example completed!');
  } catch (error) {
    console.error('❌ Error in configure example:', error);
  } finally {
    restoreNock();
  }
}

// Example 3: Single endpoint configuration
async function singleEndpointExample() {
  console.log('\n🎯 Single Endpoint Example\n');

  const endpoints: NocchinoEndpoint[] = [
    {
      baseUrl: 'https://api.example.com',
      specs: ['./specs/api-v1', './specs/api-v2'],
    },
  ];

  try {
    initialize(endpoints);
    console.log('✅ Single endpoint initialization completed');

    // Test different paths on the same endpoint
    activateNockForRequest({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
    });
    console.log('✅ Activated nock for /v1/users');

    activateNockForRequest({
      url: 'https://api.example.com/v2/users',
      method: 'GET',
    });
    console.log('✅ Activated nock for /v2/users');

    console.log('\n🎉 Single endpoint example completed!');
  } catch (error) {
    console.error('❌ Error in single endpoint example:', error);
  } finally {
    restoreNock();
  }
}

// Run all examples
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('NOCCHINO MULTI-ENDPOINT EXAMPLES');
  console.log('='.repeat(60));

  await multiEndpointExample();
  await configureExample();
  await singleEndpointExample();

  console.log(`\n${'='.repeat(60)}`);
  console.log('ALL EXAMPLES COMPLETED SUCCESSFULLY! 🎉');
  console.log('='.repeat(60));
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('\n✅ All examples completed successfully');
    })
    .catch((error) => {
      console.error('❌ Examples failed:', error);
    });
}

export {
  multiEndpointExample, configureExample, singleEndpointExample, runAllExamples,
};
