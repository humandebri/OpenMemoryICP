import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, Settings, Menu, LogIn, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { icAgent } from '@/services/ic-agent';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, searchMemories, isLoading } = useMemoryStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await icAgent.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userPrincipal = icAgent.getPrincipal();
        setPrincipal(userPrincipal?.toString() || null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
      setPrincipal(null);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const success = await icAgent.login();
      if (success) {
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await icAgent.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/search':
        return 'Search Memories';
      case '/clusters':
        return 'Memory Clusters';
      case '/categories':
        return 'Categories';
      case '/settings':
        return 'Settings';
      case '/user':
        return 'User Profile';
      default:
        return 'OpenMemory';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMemories(searchQuery);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <motion.button
            onClick={onMenuClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <motion.h1 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={location.pathname}
          >
            {getPageTitle()}
          </motion.h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <motion.input
                type="text"
                placeholder="Search your memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                whileFocus={{ scale: 1.02 }}
                className="search-input w-80 max-w-sm bg-gray-50/80 backdrop-blur-sm border-gray-200/50 focus:bg-white"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </form>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Bell className="w-5 h-5" />
          </motion.button>

          {/* Settings */}
          <motion.button
            onClick={() => navigate('/settings')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => navigate('/user')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Connected</div>
                  {principal && (
                    <div className="text-xs text-gray-500">
                      {principal.slice(0, 8)}...{principal.slice(-4)}
                    </div>
                  )}
                </div>
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleLogin}
              disabled={isLoggingIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Connecting...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Login with Internet Identity</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};