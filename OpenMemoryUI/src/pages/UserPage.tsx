import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Settings, Activity, Zap } from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';

export const UserPage: React.FC = () => {
  const { memories, clusters } = useMemoryStore();

  const userStats = [
    { label: 'Total Memories', value: memories.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Memory Clusters', value: clusters.length, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Days Active', value: '14', icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-8"
      >
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
            <p className="text-lg text-gray-600 mb-4">Manage your OpenMemory account and preferences</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>user@example.com</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Member since December 2024</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {userStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Settings className="w-6 h-6 mr-3 text-primary-600" />
          Account Settings
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="OpenMemory User"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                defaultValue="user@example.com"
                className="input w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="textarea w-full"
              defaultValue="AI enthusiast exploring the frontiers of digital memory and consciousness."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button className="btn-secondary">
              Cancel
            </button>
            <button className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>

      {/* Privacy & Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-3 text-green-600" />
          Privacy & Security
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">Memory Privacy</h3>
              <p className="text-sm text-gray-600">Control who can see your memories</p>
            </div>
            <select className="select">
              <option>Private</option>
              <option>Shared</option>
              <option>Public</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">Data Export</h3>
              <p className="text-sm text-gray-600">Download your memory data</p>
            </div>
            <button className="btn-secondary">
              Export Data
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};