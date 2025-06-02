import React from 'react';
import { motion } from 'framer-motion';
import { Code, FileText, Download, Upload, Zap } from 'lucide-react';
import { ConversationManager } from '@/components/ide/ConversationManager';

export const IDEPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">IDE Integration</h1>
            <p className="text-gray-600">
              Save and manage your conversations with Claude Code for future reference
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
            <Code className="w-8 h-8 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Save Conversations</h3>
          <p className="text-sm text-gray-600">
            Save important conversations with Claude Code as Markdown files for future reference.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Auto Download</h3>
          <p className="text-sm text-gray-600">
            Automatically download conversations as backup files when saving.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Upload & Restore</h3>
          <p className="text-sm text-gray-600">
            Upload previously saved conversation files to continue working on them.
          </p>
        </div>
      </motion.div>

      {/* How to Use */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6"
      >
        <div className="flex items-center mb-4">
          <Zap className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-indigo-900">How to Use IDE Integration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-indigo-800">
          <div>
            <h4 className="font-medium mb-2">💾 Saving Conversations:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Copy your conversation from Claude Code</li>
              <li>Paste it into the content area below</li>
              <li>Add a descriptive title</li>
              <li>Click "Save & Download" to store it</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium mb-2">📂 Managing Files:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>View all saved conversations in the list</li>
              <li>Download any conversation as a Markdown file</li>
              <li>Load conversations back into the editor</li>
              <li>Delete conversations you no longer need</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Conversation Manager */}
      <ConversationManager />
    </div>
  );
};