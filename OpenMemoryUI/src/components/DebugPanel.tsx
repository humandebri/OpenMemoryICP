import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Server, Database, RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react';
import { openMemoryAPI } from '@/services/openmemory-api';
import { useMemoryStore } from '@/stores/useMemoryStore';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const { memories, addToast, fetchMemories } = useMemoryStore();

  const addDebugResult = (result: any) => {
    setDebugResults(prev => [...prev, { 
      ...result, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const testBackendConnection = async () => {
    addDebugResult({ type: 'info', message: '🔍 Testing backend connection...' });
    
    try {
      const health = await openMemoryAPI.getHealth();
      addDebugResult({ 
        type: 'success', 
        message: '✅ Backend connection successful',
        data: health
      });
      return true;
    } catch (error) {
      addDebugResult({ 
        type: 'error', 
        message: '❌ Backend connection failed',
        data: error
      });
      return false;
    }
  };

  const testAuthentication = async () => {
    addDebugResult({ type: 'info', message: '🔐 Testing authentication...' });
    
    try {
      const isAuth = await openMemoryAPI.isAuthenticated();
      const principal = openMemoryAPI.getPrincipal();
      
      addDebugResult({ 
        type: isAuth ? 'success' : 'warning', 
        message: isAuth ? '✅ User authenticated' : '⚠️ User not authenticated',
        data: { authenticated: isAuth, principal: principal?.toString() }
      });
      return isAuth;
    } catch (error) {
      addDebugResult({ 
        type: 'error', 
        message: '❌ Authentication check failed',
        data: error
      });
      return false;
    }
  };

  const testMemoryCreation = async () => {
    addDebugResult({ type: 'info', message: '📝 Testing memory creation...' });
    
    const testContent = `Debug Test Memory - ${new Date().toISOString()}`;
    
    try {
      const result = await openMemoryAPI.addMemory(
        testContent,
        'debug',
        ['test', 'debug', 'verification']
      );
      
      addDebugResult({ 
        type: 'success', 
        message: '✅ Memory created successfully',
        data: result
      });
      
      // Refresh memories list
      await fetchMemories();
      
      addToast({
        type: 'success',
        title: 'Debug Success',
        message: 'Test memory created and memories refreshed'
      });
      
      return true;
    } catch (error) {
      addDebugResult({ 
        type: 'error', 
        message: '❌ Memory creation failed',
        data: error
      });
      
      addToast({
        type: 'error',
        title: 'Debug Error',
        message: `Memory creation failed: ${error}`
      });
      
      return false;
    }
  };

  const testMemoryRetrieval = async () => {
    addDebugResult({ type: 'info', message: '📊 Testing memory retrieval...' });
    
    try {
      const memories = await openMemoryAPI.getMemories(10, 0);
      
      addDebugResult({ 
        type: 'success', 
        message: `✅ Retrieved ${memories.length} memories`,
        data: { count: memories.length, memories: memories.slice(0, 3) }
      });
      return true;
    } catch (error) {
      addDebugResult({ 
        type: 'error', 
        message: '❌ Memory retrieval failed',
        data: error
      });
      return false;
    }
  };

  const runFullDiagnostic = async () => {
    setIsDebugging(true);
    clearResults();
    
    addDebugResult({ type: 'info', message: '🚀 Starting full diagnostic...' });
    
    // Test sequence
    const connectionOk = await testBackendConnection();
    
    if (connectionOk) {
      const authOk = await testAuthentication();
      
      if (authOk) {
        await testMemoryCreation();
        await testMemoryRetrieval();
      } else {
        addDebugResult({ 
          type: 'warning', 
          message: '⚠️ Skipping memory tests due to authentication issues' 
        });
      }
    } else {
      addDebugResult({ 
        type: 'error', 
        message: '❌ Skipping tests due to connection failure' 
      });
    }
    
    addDebugResult({ type: 'info', message: '🎯 Diagnostic complete' });
    setIsDebugging(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <Info className="w-4 h-4 text-yellow-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* Debug Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Bug className="w-6 h-6 mr-3 text-gray-700" />
                  OpenMemory Debug Panel
                </h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  ✕
                </motion.button>
              </div>

              {/* Control Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <motion.button
                  onClick={testBackendConnection}
                  disabled={isDebugging}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                  <Server className="w-4 h-4" />
                  <span>Connection</span>
                </motion.button>

                <motion.button
                  onClick={testAuthentication}
                  disabled={isDebugging}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Auth</span>
                </motion.button>

                <motion.button
                  onClick={testMemoryCreation}
                  disabled={isDebugging}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>Create</span>
                </motion.button>

                <motion.button
                  onClick={runFullDiagnostic}
                  disabled={isDebugging}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors"
                >
                  {isDebugging ? (
                    <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Full Test</span>
                </motion.button>
              </div>

              {/* Info Panel */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Frontend Memories:</span>
                    <span className="ml-2 text-gray-900">{memories.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Environment:</span>
                    <span className="ml-2 text-gray-900">IC Mainnet</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Backend:</span>
                    <span className="ml-2 text-gray-900 text-xs">77fv5...soea-cai</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Frontend:</span>
                    <span className="ml-2 text-gray-900 text-xs">7yetj...oeq-cai</span>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Debug Results</h3>
                  <motion.button
                    onClick={clearResults}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </motion.button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                  {debugResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Click any button above to start debugging
                    </p>
                  ) : (
                    debugResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border ${getResultColor(result.type)}`}
                      >
                        <div className="flex items-start space-x-2">
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {result.message}
                              </p>
                              <span className="text-xs text-gray-500">
                                {result.timestamp}
                              </span>
                            </div>
                            {result.data && (
                              <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};