import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tags, BarChart3, TrendingUp, Hash, LogIn, AlertCircle } from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { icAgent } from '@/services/ic-agent';

export const CategoriesPage: React.FC = () => {
  const { memories, categories, isLoading, fetchCategories } = useMemoryStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await icAgent.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          fetchCategories();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [fetchCategories]);

  // Calculate category statistics
  const categoryStats = categories.map(category => {
    const categoryMemories = memories.filter(memory => memory.category === category);
    return {
      name: category,
      count: categoryMemories.length,
      percentage: memories.length > 0 ? (categoryMemories.length / memories.length) * 100 : 0,
      recentMemories: categoryMemories.slice(0, 3),
    };
  }).sort((a, b) => b.count - a.count);

  const uncategorizedCount = memories.filter(memory => !memory.category).length;

  const handleLogin = async () => {
    try {
      const success = await icAgent.login();
      if (success) {
        setIsAuthenticated(true);
        fetchCategories();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">
            Please login with Internet Identity to access your categories.
          </p>
          <motion.button
            onClick={handleLogin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <LogIn className="w-4 h-4" />
            <span>Login with Internet Identity</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600">
              Organize and explore your memories by category
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Tags className="w-8 h-8 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Hash className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorized</p>
              <p className="text-3xl font-bold text-gray-900">
                {memories.length - uncategorizedCount}
              </p>
            </div>
            <Tags className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uncategorized</p>
              <p className="text-3xl font-bold text-gray-900">{uncategorizedCount}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Popular</p>
              <p className="text-lg font-bold text-gray-900">
                {categoryStats.length > 0 ? categoryStats[0].name : 'None'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </motion.div>

      {/* Category List */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : categoryStats.length > 0 ? (
        <div className="space-y-4">
          {categoryStats.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {category.count} memories
                    </span>
                    <span className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}% of total
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Tags className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* Recent Memories Preview */}
              {category.recentMemories.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm">Recent Memories</h4>
                  <div className="grid gap-2">
                    {category.recentMemories.map((memory) => (
                      <div
                        key={memory.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {memory.content}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {category.count > 3 && (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View all {category.count} memories →
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {/* Uncategorized Memories */}
          {uncategorizedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryStats.length * 0.1 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    Uncategorized Memories
                  </h3>
                  <p className="text-orange-700">
                    {uncategorizedCount} memories don't have a category yet
                  </p>
                </div>
                <button className="btn-primary">
                  Categorize Now
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
        >
          <Tags className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No Categories Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start categorizing your memories to organize them better. 
            Categories help you find related memories quickly.
          </p>
          <button className="btn-primary">
            Add Categories
          </button>
        </motion.div>
      )}

      {/* Category Management Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Category Management Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Smart Suggestions</h4>
            <p className="text-gray-600 text-sm">
              Our AI can suggest categories for your memories based on their content. 
              This helps maintain consistency and discover new organizational patterns.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Keep It Simple</h4>
            <p className="text-gray-600 text-sm">
              Use broad, intuitive categories that make sense to you. 
              Avoid creating too many specific categories that might overlap.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};