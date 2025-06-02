import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Brain, 
  Users, 
  ArrowRight, 
  Sparkles,
  Network,
  Target,
  TrendingUp,
  Zap,
  Eye,
  BarChart3,
  Globe,
  Lightbulb,
  Plus
} from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { Link } from 'react-router-dom';

export const ClustersPage: React.FC = () => {
  const { clusters, memories, isLoading, fetchClusters } = useMemoryStore();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid');
  const [sortBy, setSortBy] = useState<'size' | 'date' | 'theme'>('size');

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const getMemoriesForCluster = (memoryIds: string[]) => {
    return memories.filter(memory => memoryIds.includes(memory.id));
  };

  const sortedClusters = [...clusters].sort((a, b) => {
    switch (sortBy) {
      case 'size':
        return b.memory_ids.length - a.memory_ids.length;
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'theme':
        return a.theme.localeCompare(b.theme);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-neural-50 via-purple-50 to-indigo-100 rounded-3xl p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 text-center md:text-left mb-6 md:mb-0">
              <motion.div 
                className="flex items-center justify-center md:justify-start mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-neural-600 via-purple-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-xl mr-4">
                  <Network className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 bg-gradient-to-br from-primary-400 to-neural-400 rounded-full flex items-center justify-center"
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Memory 
                <span className="bg-gradient-to-r from-neural-600 to-primary-600 bg-clip-text text-transparent">
                  Clusters
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 max-w-2xl mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Discover intelligent connections between your memories through 
                AI-powered semantic clustering and relationship mapping.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:border-primary-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('network')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      viewMode === 'network'
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-white/80 border-gray-200 text-gray-600 hover:border-primary-200'
                    }`}
                  >
                    <Network className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-white/80 border-2 border-gray-200 rounded-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="size">Sort by Size</option>
                  <option value="date">Sort by Date</option>
                  <option value="theme">Sort by Theme</option>
                </select>
              </motion.div>
            </div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="w-48 h-48 relative">
                {/* Animated cluster visualization */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-8 h-8 bg-gradient-to-br from-primary-400 to-neural-400 rounded-full"
                      style={{
                        top: `${30 + 40 * Math.sin((i * Math.PI) / 3)}%`,
                        left: `${30 + 40 * Math.cos((i * Math.PI) / 3)}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-neural-600 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Analytics Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-neural-50 to-neural-100 border-neural-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neural-700 mb-1">Total Clusters</p>
              <p className="text-4xl font-bold text-neural-900 mb-2">{clusters.length}</p>
              <div className="flex items-center text-xs text-neural-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>AI-grouped themes</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-neural-500 to-neural-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Layers className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700 mb-1">Clustered Memories</p>
              <p className="text-4xl font-bold text-primary-900 mb-2">
                {clusters.reduce((sum, cluster) => sum + cluster.memory_ids.length, 0)}
              </p>
              <div className="flex items-center text-xs text-primary-600">
                <Target className="w-3 h-3 mr-1" />
                <span>Connected insights</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Avg Cluster Size</p>
              <p className="text-4xl font-bold text-green-900 mb-2">
                {clusters.length > 0 
                  ? Math.round(clusters.reduce((sum, cluster) => sum + cluster.memory_ids.length, 0) / clusters.length)
                  : 0
                }
              </p>
              <div className="flex items-center text-xs text-green-600">
                <BarChart3 className="w-3 h-3 mr-1" />
                <span>Memories per cluster</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ rotate: -360 }}
              transition={{ duration: 0.6 }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          className="card-hover bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Connections</p>
              <p className="text-4xl font-bold text-purple-900 mb-2">
                {clusters.reduce((sum, cluster) => sum + Math.max(0, cluster.memory_ids.length - 1), 0)}
              </p>
              <div className="flex items-center text-xs text-purple-600">
                <Network className="w-3 h-3 mr-1" />
                <span>Memory relationships</span>
              </div>
            </div>
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Cluster Display */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 p-8"
        >
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i} 
                className="skeleton p-8 rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-2/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-gray-300 rounded"></div>
                  <div className="h-24 bg-gray-300 rounded"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : clusters.length > 0 ? (
        <div className="space-y-8">
          {sortedClusters.map((cluster, index) => {
            const clusterMemories = getMemoriesForCluster(cluster.memory_ids);
            const isSelected = selectedCluster === cluster.id;
            
            return (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
                }}
                className="group bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden transition-all duration-300 hover:border-primary-300"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <motion.div
                          className="w-12 h-12 bg-gradient-to-br from-neural-500 to-primary-500 rounded-xl flex items-center justify-center shadow-lg"
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Lightbulb className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                            {cluster.theme}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-neural-100 text-neural-700 rounded-full font-medium">
                              {cluster.memory_ids.length} memories
                            </span>
                            <span>•</span>
                            <span>Created {new Date(cluster.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-lg text-gray-600 leading-relaxed mb-6">{cluster.description}</p>
                    </div>
                    
                    <motion.button
                      onClick={() => setSelectedCluster(isSelected ? null : cluster.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Enhanced Memory Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <motion.h4 
                        className="font-bold text-gray-900 flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Network className="w-5 h-5 mr-2 text-primary-600" />
                        Connected Memories
                      </motion.h4>
                      <motion.button 
                        whileHover={{ scale: 1.05, x: 4 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        <span>Explore All</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      <motion.div 
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        layout
                      >
                        {clusterMemories.slice(0, isSelected ? clusterMemories.length : 3).map((memory, memIndex) => (
                          <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: memIndex * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="group/memory p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <motion.div
                                className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center group-hover/memory:from-primary-200 group-hover/memory:to-primary-300 transition-colors"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                              >
                                <Sparkles className="w-4 h-4 text-primary-600" />
                              </motion.div>
                              <span className="text-xs text-gray-500">
                                {new Date(memory.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed mb-3 group-hover/memory:text-gray-900 transition-colors">
                              {memory.content.length > 100 ? `${memory.content.substring(0, 100)}...` : memory.content}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              {memory.category && (
                                <motion.span 
                                  whileHover={{ scale: 1.05 }}
                                  className="text-xs px-2 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full font-medium"
                                >
                                  {memory.category}
                                </motion.span>
                              )}
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 bg-primary-500 rounded-full"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                    
                    {!isSelected && clusterMemories.length > 3 && (
                      <motion.div 
                        className="text-center pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-sm text-gray-500">
                          and {clusterMemories.length - 3} more memories in this cluster...
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 p-16 text-center"
        >
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Layers className="w-20 h-20 text-gray-400 mx-auto mb-8" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            No Clusters Discovered Yet
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Add more memories to see how they cluster together based on themes and topics. 
            Our AI will automatically group related memories into meaningful clusters.
          </p>
          <Link to="/">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary btn-lg inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Memory</span>
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Enhanced Clustering Info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-br from-neural-50 via-purple-50 to-primary-50 rounded-2xl border border-neural-200 p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-neural-200/30 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <motion.h3 
            className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6 mr-3 text-primary-600" />
            </motion.div>
            How AI Memory Clustering Works
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center group"
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Semantic Analysis</h4>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes the deep semantic meaning of your memories, 
                understanding context, emotions, and conceptual relationships.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="text-center group"
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-neural-500 to-neural-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.1 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Network className="w-8 h-8 text-white" />
              </motion.div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Smart Grouping</h4>
              <p className="text-gray-600 leading-relaxed">
                Memories are automatically grouped by shared themes, topics, 
                and conceptual similarities, revealing hidden connections.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="text-center group"
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.1, rotate: -360 }}
                transition={{ duration: 0.6 }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </motion.div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Dynamic Evolution</h4>
              <p className="text-gray-600 leading-relaxed">
                Clusters evolve and update in real-time as you add new memories, 
                constantly improving pattern recognition and insights.
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-bold text-primary-700">Advanced AI Insight</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The more memories you add, the smarter our clustering becomes. 
              Our AI learns your unique thinking patterns and discovers connections you might never have noticed.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};