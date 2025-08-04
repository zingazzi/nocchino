import type { APIResponse } from '../src/types';
import { configure } from '../src/utils/dynamicNock';
import { GenericAPIClient } from '../src/utils/genericAPIClient';

// Define generic request and response types
interface CreateResourceRequest {
  name: string
  description: string
  type: string
  metadata?: Record<string, unknown>
}

interface Resource {
  id: string
  name: string
  description: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

interface ResourceListResponse {
  resources: Resource[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems: number
  }
}

// Configure Nocchino with mandatory defaultSpec folder
configure({
  specMap: {
    'X-Api-Version': {
      v1: 'specs/api-v1/users-api.yml',
      v2: 'specs/api-v2/users-api-v2.yml',
    },
  },
  defaultSpec: 'specs', // Now points to a folder containing all OpenAPI specs
  baseUrl: 'https://api.example.com',
});

/**
 * Example demonstrating type-safe API requests with generic types
 */
export async function demonstrateGenericTypes(): Promise<void> {
  try {
    // Create a generic API client for resource operations
    const resourceClient = new GenericAPIClient<
      CreateResourceRequest,
      Resource
    >('https://api.example.com');

    // Example 1: Type-safe GET request
    console.log('📋 Example 1: Type-safe GET request');
    const resourceListResponse = await resourceClient.get<ResourceListResponse>(
      '/v1/resources',
      {
        'X-Api-Version': 'v1',
      },
    );

    console.log('✅ Resource list response:', resourceListResponse);
    console.log(
      '📊 Response type is inferred:',
      typeof resourceListResponse.data.resources,
    );

    // Example 2: Type-safe POST request
    console.log('\n📋 Example 2: Type-safe POST request');
    const createResourceRequest: CreateResourceRequest = {
      name: 'Example Resource',
      description: 'A generic resource for demonstration',
      type: 'example',
      metadata: {
        category: 'demo',
        priority: 'medium',
      },
    };

    const createResourceResponse = await resourceClient.post<
      CreateResourceRequest,
      Resource
    >('/v1/resources', createResourceRequest, {
      'X-Api-Version': 'v1',
      'Content-Type': 'application/json',
    });

    console.log('✅ Create resource response:', createResourceResponse);
    console.log(
      '📊 Created resource type is inferred:',
      typeof createResourceResponse.data.id,
    );

    // Example 3: Using different response types for the same request
    console.log('\n📋 Example 3: Different response types');

    // GET resource by ID - returns single resource
    const singleResourceResponse = await resourceClient.get<Resource>(
      '/v1/resources/123',
      {
        'X-Api-Version': 'v1',
      },
    );
    console.log('✅ Single resource response:', singleResourceResponse);

    // GET resources list - returns resource list
    const resourcesListResponse = await resourceClient.get<ResourceListResponse>('/v1/resources', {
      'X-Api-Version': 'v1',
    });
    console.log('✅ Resources list response:', resourcesListResponse);

    // Example 4: Type-safe PUT request
    console.log('\n📋 Example 4: Type-safe PUT request');
    const updateResourceRequest = {
      name: 'Updated Resource',
      description: 'Updated description',
      status: 'active',
    };

    const updateResourceResponse = await resourceClient.put<
      typeof updateResourceRequest,
      Resource
    >('/v1/resources/123', updateResourceRequest, {
      'X-Api-Version': 'v1',
      'Content-Type': 'application/json',
    });

    console.log('✅ Update resource response:', updateResourceResponse);

    // Example 5: Type-safe DELETE request
    console.log('\n📋 Example 5: Type-safe DELETE request');
    const deleteResourceResponse = await resourceClient.delete<{
      message: string
    }>('/v1/resources/123', {
      'X-Api-Version': 'v1',
    });

    console.log('✅ Delete resource response:', deleteResourceResponse);

    console.log('\n🎉 All generic type examples completed successfully!');
  } catch (error) {
    console.error('❌ Error during generic types demonstration:', error);
  }
}

/**
 * Example showing how to create specialized API clients
 */
export class ResourceAPIClient extends GenericAPIClient<
  CreateResourceRequest,
  Resource
> {
  constructor(baseUrl: string) {
    super(baseUrl, {
      'Content-Type': 'application/json',
      'X-Api-Version': 'v1',
    });
  }

  /**
   * Create a new resource with type safety
   */
  public async createResource(
    resourceData: CreateResourceRequest,
  ): Promise<APIResponse<Resource>> {
    return this.post('/v1/resources', resourceData);
  }

  /**
   * Get resource by ID with type safety
   */
  public async getResourceById(
    resourceId: string,
  ): Promise<APIResponse<Resource>> {
    return this.get<Resource>(`/v1/resources/${resourceId}`);
  }

  /**
   * Get resources list with type safety
   */
  public async getResources(): Promise<APIResponse<ResourceListResponse>> {
    return this.get<ResourceListResponse>('/v1/resources');
  }

  /**
   * Update resource with type safety
   */
  public async updateResource(
    resourceId: string,
    resourceData: Partial<CreateResourceRequest>,
  ): Promise<APIResponse<Resource>> {
    return this.put<Partial<CreateResourceRequest>, Resource>(
      `/v1/resources/${resourceId}`,
      resourceData,
    );
  }

  /**
   * Delete resource with type safety
   */
  public async deleteResource(
    resourceId: string,
  ): Promise<APIResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/v1/resources/${resourceId}`);
  }
}

/**
 * Example demonstrating specialized API client usage
 */
export async function demonstrateSpecializedClient(): Promise<void> {
  try {
    console.log('🚀 Demonstrating specialized API client...\n');

    // Create a specialized resource API client
    const resourceClient = new ResourceAPIClient('https://api.example.com');

    // Create a new resource
    const newResource = await resourceClient.createResource({
      name: 'Specialized Resource',
      description: 'A resource created with specialized client',
      type: 'specialized',
      metadata: {
        client: 'specialized',
        version: '1.0.0',
      },
    });
    console.log(
      '✅ Created resource with specialized client:',
      newResource.data,
    );

    // Get resources list
    const resources = await resourceClient.getResources();
    console.log(
      '✅ Retrieved resources with specialized client:',
      resources.data.resources.length,
    );

    // Update resource
    const updatedResource = await resourceClient.updateResource('123', {
      name: 'Updated Resource',
      description: 'Updated description',
    });
    console.log(
      '✅ Updated resource with specialized client:',
      updatedResource.data,
    );

    console.log('\n🎉 Specialized client demonstration completed!');
  } catch (error) {
    console.error('❌ Error during specialized client demonstration:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  demonstrateGenericTypes()
    .then(() => demonstrateSpecializedClient())
    .catch(console.error);
}
