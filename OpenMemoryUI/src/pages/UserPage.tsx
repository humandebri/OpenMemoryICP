import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Activity, Zap, Copy, CheckCircle, TrendingUp, Award, BookOpen } from 'lucide-react';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { openMemoryAPI } from '@/services/openmemory-api';

export const UserPage: React.FC = () => {
  const { memories, clusters } = useMemoryStore();
  const [principalId, setPrincipalId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const [memberSince] = useState('December 2024');
  const [displayName] = useState('OpenMemory User');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await openMemoryAPI.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          const principal = openMemoryAPI.getPrincipal();
          if (principal) {
            setPrincipalId(principal.toString());
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    
    checkAuth();
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const userStats = [
    { label: 'Total Memories', value: memories.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', description: 'Memories stored' },
    { label: 'Memory Clusters', value: clusters.length, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100', description: 'Related groups' },
    { label: 'Days Active', value: '14', icon: Calendar, color: 'text-green-600', bg: 'bg-green-100', description: 'Since joining' },
    { label: 'Productivity Score', value: '92', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100', description: 'Weekly average' },
  ];

  const achievements = [
    { title: 'First Memory', description: 'Created your first memory', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', earned: true },
    { title: 'Memory Collector', description: 'Stored 10+ memories', icon: Award, color: 'text-purple-600', bg: 'bg-purple-100', earned: memories.length >= 10 },
    { title: 'Cluster Master', description: 'Created your first cluster', icon: Zap, color: 'text-green-600', bg: 'bg-green-100', earned: clusters.length > 0 },
    { title: 'Active User', description: '7 days of continuous use', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100', earned: true },
  ];

  const recentActivity = [
    { action: 'Created memory', title: 'OpenMemory API Integration', time: '2 hours ago' },
    { action: 'Added cluster', title: 'Development Tasks', time: '1 day ago' },
    { action: 'Updated settings', title: 'AI Configuration', time: '2 days ago' },
    { action: 'Created memory', title: 'Frontend UI Improvements', time: '3 days ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-50 via-purple-50 to-blue-50 rounded-2xl border border-gray-200/50 p-8"
      >
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">プロフィール</h1>
            <p className="text-lg text-gray-600 mb-4">OpenMemoryでのあなたの活動と統計情報</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{displayName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>メンバー開始: {memberSince}</span>
                </div>
              </div>
              
              {/* Principal ID Display */}
              {isAuthenticated && principalId && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-gray-700">Principal ID:</span>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-white/70 rounded text-xs font-mono text-gray-800 border">
                      {principalId.substring(0, 20)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(principalId, 'principal')}
                      className="p-1 hover:bg-white/50 rounded transition-colors"
                      title="Copy Principal ID"
                    >
                      {copied === 'principal' ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
            className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
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
            <p className="text-xs text-gray-600">{stat.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            実績
          </h2>
          
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-center space-x-4 p-3 rounded-xl transition-all ${
                  achievement.earned 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 ${achievement.earned ? achievement.bg : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                  <achievement.icon className={`w-5 h-5 ${achievement.earned ? achievement.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                </div>
                {achievement.earned && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            最近の活動
          </h2>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.action}</span>: {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              すべての活動を表示 →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Memory Usage Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
          メモリ使用状況
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 mb-2">{memories.length}</div>
            <div className="text-sm text-blue-800 font-medium">総メモリ数</div>
            <div className="text-xs text-blue-600 mt-1">今月 +12</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 mb-2">{clusters.length}</div>
            <div className="text-sm text-purple-800 font-medium">クラスター数</div>
            <div className="text-xs text-purple-600 mt-1">今月 +3</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600 mb-2">2.4GB</div>
            <div className="text-sm text-green-800 font-medium">ストレージ使用量</div>
            <div className="text-xs text-green-600 mt-1">残り 7.6GB</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-gray-200/50 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">
            新しいメモリを作成
          </button>
          <button className="btn-secondary">
            メモリを検索
          </button>
          <button className="btn-secondary">
            データをエクスポート
          </button>
          <button className="btn-secondary">
            設定を開く
          </button>
        </div>
      </motion.div>
    </div>
  );
};