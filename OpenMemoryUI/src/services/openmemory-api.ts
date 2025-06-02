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

class OpenMemoryAPI {
  async initialize() {
    await icAgent.initialize();
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

  async isAuthenticated(): Promise<boolean> {
    return await icAgent.isAuthenticated();
  }

  getPrincipal() {
    return icAgent.getPrincipal();
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
  getPrincipal,
} = openMemoryAPI;