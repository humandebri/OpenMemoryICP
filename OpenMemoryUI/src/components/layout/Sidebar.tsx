import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Layers, 
  Tags, 
  Settings, 
  Brain,
  Plus,
  Activity,
  X,
  Sparkles,
  TrendingUp,
  Code,
  Key
} from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & quick actions' },
  { name: 'Search', href: '/search', icon: Search, description: 'Find your memories' },
  { name: 'Clusters', href: '/clusters', icon: Layers, description: 'Organized memory groups' },
  { name: 'Categories', href: '/categories', icon: Tags, description: 'Memory categories' },
  { name: 'IDE Integration', href: '/ide', icon: Code, description: 'Save conversations' },
  { name: 'API Settings', href: '/api-settings', icon: Key, description: 'API keys & configuration' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'App preferences' },
];

interface SidebarProps {
  onClose?: () => void;
  onAddMemory?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, onAddMemory }) => {
  const { memories, clusters } = useMemoryStore();

  return (
    <motion.div 
      className="bg-white/95 backdrop-blur-lg w-80 border-r border-gray-200/50 flex flex-col h-full shadow-lg"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OpenMemory</h1>
              <p className="text-xs text-gray-500 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Memory Assistant
              </p>
            </div>
          </motion.div>
          
          {/* Mobile Close Button */}
          {onClose && (
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="px-6 py-4 border-b border-gray-200/50">
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{memories.length}</div>
            <div className="text-xs text-primary-600 font-medium">Memories</div>
            <TrendingUp className="w-3 h-3 text-primary-500 mx-auto mt-1" />
          </div>
          <div className="bg-gradient-to-br from-neural-50 to-neural-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neural-700">{clusters.length}</div>
            <div className="text-xs text-neural-600 font-medium">Clusters</div>
            <Layers className="w-3 h-3 text-neural-500 mx-auto mt-1" />
          </div>
        </motion.div>
      </div>

      {/* Enhanced Quick Add */}
      <div className="px-6 py-4 border-b border-gray-200/50">
        <motion.button
          onClick={onAddMemory}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Add Memory</span>
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1">
        {navigation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <NavLink
              to={item.href}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex items-center justify-between w-full"
                  whileHover={{ x: isActive ? 0 : 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'group-hover:text-gray-700'}`} />
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className={`text-xs transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-primary-600 rounded-full"
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Enhanced Status */}
      <div className="px-6 py-4 border-t border-gray-200/50">
        <motion.div 
          className="flex items-center justify-between p-3 bg-green-50 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Activity className="w-4 h-4 text-green-600" />
            </motion.div>
            <span className="text-sm font-medium text-green-700">Connected to ICP</span>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};