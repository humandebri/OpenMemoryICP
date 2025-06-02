import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { icAgent } from '@/services/ic-agent';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ isOpen, onClose }) => {
  const { createMemory, addToast } = useMemoryStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const authenticated = await icAgent.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    try {
      const success = await icAgent.login();
      if (success) {
        setIsAuthenticated(true);
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: 'You can now save memories!',
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: 'Please try again',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createMemory(content);
      setContent('');
      onClose();
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          onClick={handleClose}
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
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                disabled={isSubmitting}
              >
                ✕
              </motion.button>
            </div>
            
            {isCheckingAuth ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : !isAuthenticated ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
                  <p className="text-gray-600">
                    Please login with Internet Identity to save your memories securely.
                  </p>
                </div>
                <motion.button
                  onClick={handleLogin}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login with Internet Identity</span>
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to remember? Share your thoughts, ideas, experiences, or insights..."
                  className="textarea w-full h-40 p-6 text-lg leading-relaxed"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                  {content.length} characters
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
                    onClick={handleClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                  >
                    {isSubmitting ? (
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};