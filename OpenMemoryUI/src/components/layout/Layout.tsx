import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddMemoryModal } from '@/components/ui/AddMemoryModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addMemoryModalOpen, setAddMemoryModalOpen] = useState(false);
  
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key closes sidebar and modals
      if (event.key === 'Escape') {
        if (addMemoryModalOpen) {
          setAddMemoryModalOpen(false);
        } else if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, addMemoryModalOpen]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Navigation Sidebar */}
      <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
        <nav 
          className="h-full w-full"
          role="navigation"
          aria-label="Main navigation"
        >
          <Sidebar 
            onClose={() => setSidebarOpen(false)}
            onAddMemory={() => setAddMemoryModalOpen(true)}
          />
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <motion.nav
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : -320,
          }}
          className="fixed inset-y-0 left-0 z-50 w-80"
          role="navigation"
          aria-label="Main navigation"
        >
          <Sidebar 
            onClose={() => setSidebarOpen(false)}
            onAddMemory={() => setAddMemoryModalOpen(true)}
          />
        </motion.nav>
      </div>

      {/* Main Application Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Application Header */}
        <header role="banner">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </header>
        
        {/* Primary Content Area */}
        <main 
          className="flex-1 overflow-y-auto" 
          role="main"
          aria-label="Main content"
        >
          <div className="page-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Global Add Memory Modal */}
      <AddMemoryModal 
        isOpen={addMemoryModalOpen}
        onClose={() => setAddMemoryModalOpen(false)}
      />
    </div>
  );
};