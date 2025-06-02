import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Memory, SearchResponse, MemoryCluster, Toast } from '@/types';
import { openMemoryAPI } from '@/services/openmemory-api';

interface MemoryStore {
  // State
  memories: Memory[];
  searchResults: SearchResponse | null;
  clusters: MemoryCluster[];
  categories: string[];
  selectedMemory: Memory | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  toasts: Toast[];
  
  // Filters
  filters: {
    category?: string;
    dateRange?: [Date, Date];
    tags?: string[];
  };

  // Actions
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  setSearchResults: (results: SearchResponse | null) => void;
  setClusters: (clusters: MemoryCluster[]) => void;
  setCategories: (categories: string[]) => void;
  setSelectedMemory: (memory: Memory | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<MemoryStore['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearError: () => void;

  // Async actions
  fetchMemories: (limit?: number, offset?: number) => Promise<void>;
  createMemory: (content: string, category?: string, tags?: string[]) => Promise<void>;
  searchMemories: (query: string, limit?: number) => Promise<void>;
  fetchClusters: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      memories: [],
      searchResults: null,
      clusters: [],
      categories: [],
      selectedMemory: null,
      searchQuery: '',
      isLoading: false,
      error: null,
      toasts: [],
      filters: {},

      // Basic setters
      setMemories: (memories) => set({ memories }),
      addMemory: (memory) => set((state) => ({ 
        memories: [memory, ...state.memories] 
      })),
      updateMemory: (id, updates) => set((state) => ({
        memories: state.memories.map(memory => 
          memory.id === id ? { ...memory, ...updates } : memory
        )
      })),
      deleteMemory: (id) => set((state) => ({
        memories: state.memories.filter(memory => memory.id !== id)
      })),
      setSearchResults: (searchResults) => set({ searchResults }),
      setClusters: (clusters) => set({ clusters }),
      setCategories: (categories) => set({ categories }),
      setSelectedMemory: (selectedMemory) => set({ selectedMemory }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Toast management
      addToast: (toast) => {
        const id = Date.now().toString();
        const newToast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        
        // Auto-remove toast after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      })),

      // Async actions
      fetchMemories: async (limit = 50, offset = 0) => {
        try {
          set({ isLoading: true, error: null });
          const memories = await openMemoryAPI.getMemories(limit, offset);
          set({ memories, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch memories:', error);
          set({ isLoading: false });
          // Don't show error toast in demo mode - just log the error
        }
      },

      createMemory: async (content, category, tags) => {
        try {
          set({ isLoading: true, error: null });
          const memory = await openMemoryAPI.addMemory(content, category, tags);
          get().addMemory(memory);
          set({ isLoading: false });
          get().addToast({
            type: 'success',
            title: 'Memory Added',
            message: 'Your memory has been successfully saved.',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create memory';
          set({ error: errorMessage, isLoading: false });
          get().addToast({
            type: 'error',
            title: 'Error',
            message: errorMessage,
          });
        }
      },

      searchMemories: async (query, limit = 20) => {
        try {
          set({ isLoading: true, error: null, searchQuery: query });
          const searchResults = await openMemoryAPI.searchMemories({
            query,
            limit,
            category_filter: get().filters.category,
          });
          set({ searchResults, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Search failed';
          set({ error: errorMessage, isLoading: false, searchResults: null });
          get().addToast({
            type: 'error',
            title: 'Search Failed',
            message: errorMessage,
          });
        }
      },

      fetchClusters: async () => {
        try {
          set({ isLoading: true, error: null });
          const clusterResponse = await openMemoryAPI.getClusters();
          set({ clusters: clusterResponse.clusters, isLoading: false });
        } catch (error) {
          console.error('Failed to get memory clusters:', error);
          set({ isLoading: false });
          // Don't show error toast in demo mode - just log the error
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await openMemoryAPI.getCategories();
          set({ categories });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
          // Don't show error toast for categories as it's not critical
        }
      },
    }),
    {
      name: 'memory-store',
    }
  )
);