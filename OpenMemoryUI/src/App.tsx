import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ClustersPage } from '@/pages/ClustersPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UserPage } from '@/pages/UserPage';
import { IDEPage } from '@/pages/IDEPage';
import ApiSettings from '@/components/ApiSettings';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { openMemoryAPI } from '@/services/openmemory-api';
import { useMemoryStore } from '@/stores/useMemoryStore';

function App() {
  const { addToast, setError } = useMemoryStore();

  useEffect(() => {
    // Initialize the IC agent and API connection
    const initializeApp = async () => {
      try {
        await openMemoryAPI.initialize();
        
        // Check connection to backend
        const health = await openMemoryAPI.getHealth();
        console.log('OpenMemory backend connected:', health);
        
        addToast({
          type: 'success',
          title: 'Connected',
          message: 'Successfully connected to OpenMemory backend',
          duration: 3000,
        });
      } catch (error) {
        console.warn('Failed to initialize app (running in demo mode):', error);
        console.log('App will continue in demo mode without backend connection');
        
        // Don't set error state so UI still loads
        addToast({
          type: 'warning',
          title: 'Demo Mode',
          message: 'Running in demo mode - backend connection not available.',
          duration: 5000,
        });
      }
    };

    initializeApp();
  }, [addToast, setError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/clusters" element={<ClustersPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/ide" element={<IDEPage />} />
            <Route path="/api-settings" element={<ApiSettings />} />
          </Routes>
        </motion.div>
      </Layout>
      <ToastContainer />
    </div>
  );
}

export default App;