import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Save, FileText, Trash2, Calendar } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  wordCount: number;
}

export const ConversationManager: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentContent, setCurrentContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const saveConversation = async () => {
    if (!currentContent.trim() || !title.trim()) return;

    setIsLoading(true);
    try {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: title.trim(),
        content: currentContent.trim(),
        timestamp: new Date(),
        wordCount: currentContent.trim().split(/\s+/).length,
      };

      setConversations(prev => [newConversation, ...prev]);
      
      // Save to localStorage for persistence
      const updatedConversations = [newConversation, ...conversations];
      localStorage.setItem('openmemory_conversations', JSON.stringify(updatedConversations));
      
      // Clear inputs
      setTitle('');
      setCurrentContent('');
      
      // Auto-download as backup
      downloadConversation(newConversation);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = () => {
    try {
      const saved = localStorage.getItem('openmemory_conversations');
      if (saved) {
        const parsed = JSON.parse(saved).map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }));
        setConversations(parsed);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const downloadConversation = (conversation: Conversation) => {
    const content = `# ${conversation.title}

**Date:** ${conversation.timestamp.toLocaleDateString()}
**Word Count:** ${conversation.wordCount}

---

${conversation.content}

---
*Saved from OpenMemory IDE Integration*`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadConversation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCurrentContent(content);
      setTitle(file.name.replace(/\.(md|txt)$/, ''));
    };
    reader.readAsText(file);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(conv => conv.id !== id);
    setConversations(updated);
    localStorage.setItem('openmemory_conversations', JSON.stringify(updated));
  };

  React.useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-3 text-primary-600" />
          IDE Conversation Manager
        </h2>

        {/* Input Section */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter conversation title..."
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Content
            </label>
            <textarea
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              placeholder="Paste your conversation content here..."
              className="textarea w-full h-64"
            />
            <div className="text-sm text-gray-500 mt-2">
              {currentContent.trim() ? `${currentContent.trim().split(/\s+/).length} words` : '0 words'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <motion.button
            onClick={saveConversation}
            disabled={!title.trim() || !currentContent.trim() || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Download</span>
              </>
            )}
          </motion.button>

          <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".md,.txt"
              onChange={uploadConversation}
              className="hidden"
            />
          </label>
        </div>
      </motion.div>

      {/* Saved Conversations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Saved Conversations ({conversations.length})
        </h3>

        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations saved yet.</p>
            <p className="text-sm">Save your IDE conversations to access them later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{conversation.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {conversation.timestamp.toLocaleDateString()}
                    </span>
                    <span>{conversation.wordCount} words</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => downloadConversation(conversation)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      setTitle(conversation.title);
                      setCurrentContent(conversation.content);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                    title="Load into editor"
                  >
                    <Upload className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => deleteConversation(conversation.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};