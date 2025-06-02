import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Brain, 
  Layers, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Activity,
  ArrowRight,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { 
    memories, 
    clusters,
    categories,
    isLoading, 
    fetchMemories, 
    createMemory, 
    fetchClusters, 
    fetchCategories 
  } = useMemoryStore();
  
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    // Load initial data
    fetchMemories();
    fetchClusters();
    fetchCategories();
  }, [fetchMemories, fetchClusters, fetchCategories]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;

    setIsAddingMemory(true);
    try {
      await createMemory(newMemoryContent);
      setNewMemoryContent('');
      setShowQuickAdd(false);
    } finally {
      setIsAddingMemory(false);
    }
  };

  const recentMemories = memories.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 rounded-3xl p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        <div className="relative z-10 text-center">
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 via-primary-500 to-neural-500 rounded-3xl flex items-center justify-center shadow-xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to 
            <span className="bg-gradient-to-r from-primary-600 to-neural-600 bg-clip-text text-transparent">
              OpenMemory
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your AI-powered memory assistant. Store, search, and discover connections 
            between your thoughts, ideas, and experiences with the power of intelligent clustering.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => setShowQuickAdd(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary btn-lg inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Memory</span>
              <Sparkles className="w-4 h-4" />
            </motion.button>
            
            <Link to="/search">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary btn-lg inline-flex items-center space-x-2"
              >
                <span>Explore Memories</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-16 h-16 bg-primary-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 right-10 w-20 h-20 bg-neural-200/30 rounded-full blur-xl"
        />
      </motion.div>

      {/* Enhanced Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setShowQuickAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 p-8 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-6 h-6 mr-3 text-primary-600" />
                  </motion.div>
                  Capture Your Memory
                </h2>
                <motion.button
                  onClick={() => setShowQuickAdd(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  ✕
                </motion.button>
              </div>
              
              <form onSubmit={handleAddMemory} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={newMemoryContent}
                    onChange={(e) => setNewMemoryContent(e.target.value)}
                    placeholder="What would you like to remember? Share your thoughts, ideas, experiences, or insights..."
                    className="textarea w-full h-40 p-6 text-lg leading-relaxed"
                    disabled={isAddingMemory}
                    autoFocus
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                    {newMemoryContent.length} characters
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>AI will automatically categorize and connect this memory</span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowQuickAdd(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-secondary"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={!newMemoryContent.trim() || isAddingMemory}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                    >
                      {isAddingMemory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          <span>Save Memory</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700 mb-1">Total Memories</p>
              <p className="text-4xl font-bold text-primary-900 mb-2">{memories.length}</p>
              <div className="flex items-center text-xs text-primary-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Growing collection</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-neural-50 to-neural-100 border-neural-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neural-700 mb-1">Memory Clusters</p>
              <p className="text-4xl font-bold text-neural-900 mb-2">{clusters.length}</p>
              <div className="flex items-center text-xs text-neural-600">
                <Activity className="w-3 h-3 mr-1" />
                <span>AI-organized groups</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-neural-500 to-neural-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
            >
              <Layers className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Categories</p>
              <p className="text-4xl font-bold text-green-900 mb-2">{categories.length}</p>
              <div className="flex items-center text-xs text-green-600">
                <BookOpen className="w-3 h-3 mr-1" />
                <span>Smart classification</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ rotate: -360 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingUp className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Recent Memories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            className="text-2xl font-bold text-gray-900 flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-6 h-6 mr-3 text-primary-600" />
            </motion.div>
            Recent Memories
          </motion.h2>
          {memories.length > 5 && (
            <Link to="/search">
              <motion.button 
                whileHover={{ scale: 1.05, x: 4 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i} 
                className="skeleton p-6 rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </motion.div>
            ))}
          </div>
        ) : recentMemories.length > 0 ? (
          <div className="space-y-4">
            {recentMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  delay: 0.8 + index * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  y: -4, 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
                className="group memory-card bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:border-primary-300 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-gray-900 text-lg leading-relaxed flex-1 group-hover:text-gray-700 transition-colors">
                    {memory.content}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    className="ml-4 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </motion.div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
                  </div>
                  {memory.category && (
                    <motion.span 
                      whileHover={{ scale: 1.1 }}
                      className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-xs font-medium"
                    >
                      {memory.category}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
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
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No memories yet</h3>
            <p className="text-gray-500 mb-6">Start building your AI-powered memory collection!</p>
            <motion.button
              onClick={() => setShowQuickAdd(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Memory</span>
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};