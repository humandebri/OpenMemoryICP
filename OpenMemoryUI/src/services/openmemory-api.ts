import { icAgent } from './ic-agent';
import type {
  Memory,
  SearchRequest,
  SearchResponse,
  ClusterResponse,
  CategoryResponse,
  SuggestionResponse,
  HealthStatus,
} from '@/types';

// Token Management Types
interface TokenInfo {
  description?: string;
  permissions: string[];
  expires_at: bigint;
  created_at: bigint;
  last_used_at?: bigint;
}

interface CreateTokenResponse {
  token: string;
  expires_at: bigint;
  permissions: string[];
}

// VectorDB Types
interface VectorStats {
  total_vectors: number;
  total_unique_vectors: number;
  average_vector_size: number;
  memory_usage_bytes: number;
  index_size: number;
  hash_collisions: number;
  query_performance_ms: number;
}

interface VectorConfig {
  embedding_dimensions: number;
  similarity_function: string;
  index_type: string;
  use_preprocessing: boolean;
  max_vectors_per_user: number;
}

interface VectorMetrics {
  search_latency: number[];
  index_operations: number[];
  memory_growth: number[];
  timestamps: string[];
}

class OpenMemoryAPI {
  private backendUrl = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
  private apiKey = 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O'; // Development API key

  async initialize() {
    await icAgent.initialize();
    // Try to restore session from previous login
    await icAgent.restoreSession();
  }

  // Health and status
  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await icAgent.getHealth() as HealthStatus;
      return response;
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw new Error('Failed to connect to OpenMemory service');
    }
  }

  // Memory management
  async getMemories(limit: number = 50, offset: number = 0): Promise<Memory[]> {
    try {
      const response = await icAgent.getMemories(limit, offset) as { memories: Memory[] };
      return response.memories || [];
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      throw new Error('Failed to fetch memories');
    }
  }

  async addMemory(
    content: string,
    category?: string,
    tags: string[] = []
  ): Promise<Memory> {
    try {
      if (!content.trim()) {
        throw new Error('Memory content cannot be empty');
      }

      const response = await icAgent.addMemory(content, category, tags) as { id: string; created_at: number } | { memory: Memory };
      
      // Handle different response formats from backend
      if ('memory' in response) {
        return response.memory;
      } else {
        // Create memory object from addMemory response
        return {
          id: response.id,
          content: content.trim(),
          timestamp: response.created_at,
          embedding: [],
          metadata: category ? { category } : {},
          tags: tags || [],
          created_at: response.created_at,
          updated_at: response.created_at,
          user_id: icAgent.getPrincipal()?.toString() || 'anonymous'
        };
      }
    } catch (error) {
      console.error('Failed to add memory:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save memory';
      throw new Error(errorMsg);
    }
  }

  async updateMemory(
    _id: string,
    _updates: Partial<Omit<Memory, 'id' | 'timestamp'>>
  ): Promise<Memory> {
    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll throw an error indicating it's not implemented
      throw new Error('Memory updates not yet implemented in backend');
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
    }
  }

  async deleteMemory(_id: string): Promise<void> {
    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll throw an error indicating it's not implemented
      throw new Error('Memory deletion not yet implemented in backend');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw error;
    }
  }

  // Search functionality
  async searchMemories(request: SearchRequest): Promise<SearchResponse> {
    try {
      if (!request.query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const response = await icAgent.searchMemories(
        request.query,
        request.limit,
        request.category_filter,
        request.min_score
      ) as SearchResponse;

      return {
        results: response.results || [],
        total_count: response.total_count || 0,
        processing_time_ms: response.processing_time_ms || 0,
      };
    } catch (error) {
      console.error('Failed to search memories:', error);
      throw new Error('Search failed');
    }
  }

  // Suggestions
  async getSuggestions(
    context: string,
    limit: number = 5
  ): Promise<SuggestionResponse> {
    try {
      if (!context.trim()) {
        throw new Error('Context cannot be empty');
      }

      const response = await icAgent.getSuggestions(context, limit) as SuggestionResponse;
      return {
        suggestions: response.suggestions || [],
        context: response.context || context,
      };
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      throw new Error('Failed to get suggestions');
    }
  }

  // Clustering
  async getClusters(minClusterSize: number = 2): Promise<ClusterResponse> {
    try {
      const response = await icAgent.getClusters(minClusterSize) as ClusterResponse;
      return {
        clusters: response.clusters || [],
        total_clusters: response.total_clusters || 0,
        unclustered_memories: response.unclustered_memories || 0,
      };
    } catch (error) {
      console.error('Failed to get clusters:', error);
      throw new Error('Failed to get memory clusters');
    }
  }

  // Categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await icAgent.getCategories() as { categories: string[] };
      return response.categories || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  async suggestCategories(memoryContent: string): Promise<CategoryResponse> {
    try {
      if (!memoryContent.trim()) {
        throw new Error('Memory content cannot be empty');
      }

      const response = await icAgent.suggestCategories(memoryContent) as CategoryResponse;
      return {
        suggestions: response.suggestions || [],
        memory_id: response.memory_id || '',
      };
    } catch (error) {
      console.error('Failed to get category suggestions:', error);
      throw new Error('Failed to get category suggestions');
    }
  }

  // Authentication methods
  async login(): Promise<boolean> {
    return await icAgent.login();
  }

  async logout(): Promise<void> {
    await icAgent.logout();
  }

  // API Key management
  async setOpenAIKey(apiKey: string): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/config/openai-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OC-API-Key': this.apiKey,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Failed to save OpenAI API key:', error);
      throw error;
    }
  }

  async getConfig(): Promise<{
    has_openai_key: boolean;
    has_openrouter_key: boolean;
    openai_key_preview?: string;
    openrouter_key_preview?: string;
    api_provider: string;
    embedding_model: string;
    available_models: Array<{
      id: string;
      name: string;
      provider: string;
      context_length: number;
      pricing?: {
        prompt: number;
        completion: number;
      };
    }>;
    updated_at?: number;
  }> {
    try {
      const response = await fetch(`${this.backendUrl}/config`, {
        method: 'GET',
        headers: {
          'X-OC-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get config:', error);
      throw error;
    }
  }

  async deleteOpenAIKey(): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/config/openai-key`, {
        method: 'DELETE',
        headers: {
          'X-OC-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete OpenAI API key:', error);
      throw error;
    }
  }

  async setOpenRouterKey(apiKey: string): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OC-API-Key': this.apiKey,
        },
        body: JSON.stringify({ 
          openrouter_api_key: apiKey,
          api_provider: 'OpenRouter'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save OpenRouter API key');
      }
    } catch (error) {
      console.error('Failed to save OpenRouter API key:', error);
      throw error;
    }
  }

  async updateConfig(config: {
    openai_api_key?: string;
    openrouter_api_key?: string;
    api_provider?: string;
    embedding_model?: string;
  }): Promise<void> {
    try {
      console.log('Sending config update request:', {
        url: `${this.backendUrl}/config`,
        config: config,
        headers: {
          'Content-Type': 'application/json',
          'X-OC-API-Key': this.apiKey.substring(0, 8) + '...'
        }
      });
      
      const response = await fetch(`${this.backendUrl}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OC-API-Key': this.apiKey,
        },
        body: JSON.stringify(config),
      });

      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API success response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await icAgent.isAuthenticated();
  }

  async restoreSession(): Promise<boolean> {
    return await icAgent.restoreSession();
  }

  getPrincipal() {
    return icAgent.getPrincipal();
  }

  // Access Token Management
  async createAccessToken(
    description: string,
    expiresInDays: number = 30,
    permissions: string[] = ['Read', 'Write']
  ): Promise<CreateTokenResponse> {
    try {
      const response = await icAgent.createAccessToken(
        description,
        expiresInDays,
        permissions
      ) as CreateTokenResponse;
      return response;
    } catch (error) {
      console.error('Failed to create access token:', error);
      throw new Error('Failed to create access token');
    }
  }

  async listAccessTokens(): Promise<TokenInfo[]> {
    try {
      const response = await icAgent.listAccessTokens() as { tokens: TokenInfo[] };
      return response.tokens || [];
    } catch (error) {
      console.error('Failed to list access tokens:', error);
      throw new Error('Failed to list access tokens');
    }
  }

  async revokeAccessToken(token: string): Promise<void> {
    try {
      await icAgent.revokeAccessToken(token);
    } catch (error) {
      console.error('Failed to revoke access token:', error);
      throw new Error('Failed to revoke access token');
    }
  }

  // VectorDB Management
  async getVectorStats(): Promise<VectorStats> {
    try {
      const response = await icAgent.getVectorStats() as VectorStats;
      return response;
    } catch (error) {
      console.error('Failed to get vector stats:', error);
      // Return mock data for now until backend endpoints are implemented
      return {
        total_vectors: 1234,
        total_unique_vectors: 1200,
        average_vector_size: 1536,
        memory_usage_bytes: 8 * 1024 * 1024,
        index_size: 16 * 1024 * 1024,
        hash_collisions: 3,
        query_performance_ms: 45
      };
    }
  }

  async getVectorConfig(): Promise<VectorConfig> {
    try {
      const response = await icAgent.getVectorConfig() as VectorConfig;
      return response;
    } catch (error) {
      console.error('Failed to get vector config:', error);
      // Return mock data for now until backend endpoints are implemented
      return {
        embedding_dimensions: 1536,
        similarity_function: 'Cosine',
        index_type: 'HNSW',
        use_preprocessing: true,
        max_vectors_per_user: 10000
      };
    }
  }

  async getVectorMetrics(): Promise<VectorMetrics> {
    try {
      const response = await icAgent.getVectorMetrics() as VectorMetrics;
      return response;
    } catch (error) {
      console.error('Failed to get vector metrics:', error);
      // Return mock data for now until backend endpoints are implemented
      const now = Date.now();
      const timestamps = Array.from({ length: 10 }, (_, i) => 
        new Date(now - (9 - i) * 60 * 60 * 1000).toLocaleTimeString()
      );
      return {
        search_latency: [42, 45, 38, 50, 43, 47, 41, 44, 46, 43],
        index_operations: [12, 15, 10, 18, 14, 16, 11, 13, 17, 15],
        memory_growth: Array.from({ length: 10 }, (_, i) => 
          (7 + i * 0.1) * 1024 * 1024
        ),
        timestamps
      };
    }
  }

  async optimizeVectorIndex(): Promise<void> {
    try {
      await icAgent.optimizeVectorIndex();
    } catch (error) {
      console.error('Failed to optimize vector index:', error);
      throw new Error('Failed to optimize vector index');
    }
  }

  async rebuildVectorIndex(): Promise<void> {
    try {
      await icAgent.rebuildVectorIndex();
    } catch (error) {
      console.error('Failed to rebuild vector index:', error);
      throw new Error('Failed to rebuild vector index');
    }
  }
}

// Export singleton instance
export const openMemoryAPI = new OpenMemoryAPI();

// Export individual functions for convenience
export const {
  initialize,
  getHealth,
  getMemories,
  addMemory,
  updateMemory,
  deleteMemory,
  searchMemories,
  getSuggestions,
  getClusters,
  getCategories,
  suggestCategories,
  login,
  logout,
  isAuthenticated,
  restoreSession,
  getPrincipal,
  setOpenAIKey,
  setOpenRouterKey,
  getConfig,
  updateConfig,
  deleteOpenAIKey,
  createAccessToken,
  listAccessTokens,
  revokeAccessToken,
  getVectorStats,
  getVectorConfig,
  getVectorMetrics,
  optimizeVectorIndex,
  rebuildVectorIndex,
} = openMemoryAPI;

// Also export as 'api' for backward compatibility
export const api = openMemoryAPI;