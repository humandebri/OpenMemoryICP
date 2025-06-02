import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Sparkles, 
  Zap, 
  Target,
  Brain,
  TrendingUp,
  ChevronDown,
  Calendar,
  Tag,
  Settings2
} from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';

export const SearchPage: React.FC = () => {
  const { 
    searchResults, 
    searchQuery, 
    searchMemories, 
    isLoading,
    categories,
    filters,
    setFilters
  } = useMemoryStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      searchMemories(localQuery);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 rounded-3xl p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-primary-600 to-neural-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Search className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Your 
              <span className="bg-gradient-to-r from-primary-600 to-neural-600 bg-clip-text text-transparent">
                Memories
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI-powered semantic search to find exactly what you're looking for, 
              even when you can't remember the exact words.
            </p>
          </motion.div>
        
          <form onSubmit={handleSearch} className="space-y-6">
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="w-6 h-6 text-primary-500" />
              </div>
              <motion.input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search for memories, ideas, concepts, feelings..."
                whileFocus={{ scale: 1.02 }}
                className="w-full pl-16 pr-6 py-6 text-xl bg-white/80 backdrop-blur-lg border-2 border-white/50 rounded-2xl shadow-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all placeholder-gray-400"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full"
                  />
                </div>
              )}
            </motion.div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <motion.button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all ${
                  showFilters 
                    ? 'bg-primary-100 border-primary-300 text-primary-700' 
                    : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:border-primary-200'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="font-medium">Advanced Filters</span>
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={!localQuery.trim() || isLoading}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>AI Search</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Enhanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-8 pt-8 border-t border-white/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <Tag className="w-4 h-4 mr-2 text-primary-600" />
                      Category
                    </label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                      className="w-full bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-4 py-3 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                      Date Range
                    </label>
                    <select className="w-full bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-4 py-3 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all">
                      <option>All Time</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                    </select>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <Settings2 className="w-4 h-4 mr-2 text-primary-600" />
                      Sort By
                    </label>
                    <select className="w-full bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-4 py-3 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all">
                      <option>Relevance</option>
                      <option>Date (Newest)</option>
                      <option>Date (Oldest)</option>
                    </select>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Enhanced Search Results */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <motion.h2 
              className="text-2xl font-bold text-gray-900 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Target className="w-6 h-6 mr-3 text-primary-600" />
              Search Results
            </motion.h2>
            <motion.div 
              className="flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                {searchResults.total_count} results
              </span>
              <span className="text-xs text-primary-600">
                in {searchResults.processing_time_ms}ms
              </span>
            </motion.div>
          </div>

          {searchResults.results.length > 0 ? (
            <div className="space-y-6">
              {searchResults.results.map((result, index) => (
                <motion.div
                  key={result.memory.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    y: -4, 
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  className="group bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:border-primary-300 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-700">
                          {(result.score * 100).toFixed(1)}%
                        </span>
                      </motion.div>
                      <div className="flex items-center space-x-1 text-xs text-primary-600">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Match</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(result.memory.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-900 text-lg leading-relaxed mb-4 group-hover:text-gray-700 transition-colors">
                    {result.memory.content}
                  </p>
                  
                  {result.explanation && (
                    <motion.div 
                      className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 mb-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-start space-x-2">
                        <Brain className="w-4 h-4 text-blue-600 mt-1" />
                        <p className="text-sm text-blue-800 italic font-medium">
                          {result.explanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center flex-wrap gap-2">
                    {result.memory.category && (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {result.memory.category}
                      </motion.span>
                    )}
                    {result.memory.tags.map((tag) => (
                      <motion.span 
                        key={tag} 
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No memories found</h3>
              <p className="text-gray-500 mb-2">No memories match your current search criteria.</p>
              <p className="text-gray-400 text-sm">
                Try different keywords, adjust your filters, or explore related concepts.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Enhanced Search Tips */}
      {!searchResults && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 p-8"
        >
          <motion.h2 
            className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 mr-3 text-primary-600" />
            </motion.div>
            AI Search Tips & Tricks
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="group p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-4">
                <Brain className="w-8 h-8 text-primary-600 mr-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-primary-900 text-lg">Natural Language</h3>
              </div>
              <p className="text-primary-700 leading-relaxed">
                Search using natural language. Our AI understands context and meaning, 
                not just exact keyword matches. Try "feeling anxious about work".
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="group p-6 bg-gradient-to-br from-neural-50 to-neural-100 rounded-xl border border-neural-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 text-neural-600 mr-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-neural-900 text-lg">Semantic Search</h3>
              </div>
              <p className="text-neural-700 leading-relaxed">
                Find related concepts even if they don't share the same words. 
                Search for "happiness" to find memories about joy, contentment, and bliss.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="group p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-4">
                <Filter className="w-8 h-8 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-green-900 text-lg">Smart Filters</h3>
              </div>
              <p className="text-green-700 leading-relaxed">
                Narrow down results by category, date range, or other criteria 
                to find exactly what you're looking for quickly and efficiently.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-4">
                <Zap className="w-8 h-8 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-purple-900 text-lg">Context Matters</h3>
              </div>
              <p className="text-purple-700 leading-relaxed">
                The more context you provide in your search, the better the results. 
                Try describing the situation, emotion, or specific details you remember.
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-gray-600 mr-2" />
              <span className="text-sm font-semibold text-gray-700">Pro Tip</span>
            </div>
            <p className="text-gray-600">
              Our AI learns from your memory patterns. The more memories you add, 
              the better it becomes at understanding your unique way of thinking and remembering.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};