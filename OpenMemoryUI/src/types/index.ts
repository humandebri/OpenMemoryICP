// Core memory types
export interface Memory {
  id: string;
  content: string;
  timestamp: number;
  category?: string;
  tags: string[];
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
  user_id: string;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
  explanation?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  category_filter?: string;
  min_score?: number;
}

export interface SearchResponse {
  results: MemorySearchResult[];
  total_count: number;
  processing_time_ms: number;
}

// Cluster types
export interface MemoryCluster {
  id: string;
  theme: string;
  description: string;
  memory_ids: string[];
  centroid?: number[];
  created_at: number;
}

export interface ClusterResponse {
  clusters: MemoryCluster[];
  total_clusters: number;
  unclustered_memories: number;
}

// Category types
export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export interface CategoryResponse {
  suggestions: CategorySuggestion[];
  memory_id: string;
}

// Suggestion types
export interface MemorySuggestion {
  id: string;
  content: string;
  relevance_score: number;
  reason: string;
}

export interface SuggestionResponse {
  suggestions: MemorySuggestion[];
  context: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Health check
export interface HealthStatus {
  status: string;
  memory_count: number;
  categories: string[];
  clusters: number;
  uptime_seconds: number;
}

// UI specific types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedMemory: Memory | null;
  searchQuery: string;
  filters: {
    category?: string;
    dateRange?: [Date, Date];
    tags?: string[];
  };
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}