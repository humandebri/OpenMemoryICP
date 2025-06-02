import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, CheckCircle, AlertCircle, Settings, Code, ExternalLink } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed?: string;
}

const ApiSettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io');

  useEffect(() => {
    // 既存のAPIキーを読み込み（ローカルストレージから）
    const savedKeys = localStorage.getItem('openmemory-api-keys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }

    // カスタムAPIベースURLを読み込み
    const savedBaseUrl = localStorage.getItem('openmemory-api-base-url');
    if (savedBaseUrl) {
      setBaseUrl(savedBaseUrl);
    }
  }, []);

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'om_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createApiKey = () => {
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      key: generateApiKey(),
      created: new Date().toISOString()
    };

    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    localStorage.setItem('openmemory-api-keys', JSON.stringify(updatedKeys));
    setNewKeyName('');
    setShowNewKey(false);
  };

  const deleteApiKey = (id: string) => {
    const updatedKeys = apiKeys.filter(key => key.id !== id);
    setApiKeys(updatedKeys);
    localStorage.setItem('openmemory-api-keys', JSON.stringify(updatedKeys));
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const updateBaseUrl = () => {
    localStorage.setItem('openmemory-api-base-url', baseUrl);
  };

  const resetToDefault = () => {
    const defaultUrl = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
    setBaseUrl(defaultUrl);
    localStorage.setItem('openmemory-api-base-url', defaultUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">API設定</h1>
          </div>
          <p className="text-gray-600">
            OpenMemory APIを外部アプリケーションから利用するための設定を管理できます。
          </p>
        </div>

        {/* API Base URL設定 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Base URL
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ベースURL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-canister-id.raw.icp0.io"
                />
                <button
                  onClick={updateBaseUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={resetToDefault}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  デフォルト
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                カスタムデプロイメントを使用する場合は、ここでAPIのベースURLを変更できます。
              </p>
            </div>
          </div>
        </motion.div>

        {/* APIキー管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5" />
              APIキー管理
            </h2>
            <button
              onClick={() => setShowNewKey(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              新しいキーを作成
            </button>
          </div>

          {/* 新しいAPIキー作成フォーム */}
          {showNewKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 mb-6"
            >
              <h3 className="font-medium text-gray-900 mb-3">新しいAPIキーを作成</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="キー名を入力 (例: Claude Code統合)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && createApiKey()}
                />
                <button
                  onClick={createApiKey}
                  disabled={!newKeyName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  作成
                </button>
                <button
                  onClick={() => {
                    setShowNewKey(false);
                    setNewKeyName('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          )}

          {/* APIキーリスト */}
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>APIキーが作成されていません。</p>
                <p className="text-sm">「新しいキーを作成」ボタンから始めてください。</p>
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {apiKey.key.substring(0, 12)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="コピー"
                        >
                          {copiedKey === apiKey.id ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        作成日: {new Date(apiKey.created).toLocaleDateString('ja-JP')}
                        {apiKey.lastUsed && (
                          <span className="ml-2">
                            最終使用: {new Date(apiKey.lastUsed).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                    >
                      削除
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* クイックスタートガイド */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            クイックスタート
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. APIキーを作成</h4>
              <p className="text-sm text-gray-600 mb-3">
                上記の「新しいキーを作成」ボタンからAPIキーを作成します。
              </p>
              
              <h4 className="font-medium text-gray-900 mb-2">2. APIエンドポイント例</h4>
              <div className="bg-gray-900 rounded-lg p-3 text-sm">
                <code className="text-green-400">
                  POST {baseUrl}/conversations
                </code>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. 認証ヘッダー</h4>
              <div className="bg-gray-900 rounded-lg p-3 text-sm mb-3">
                <code className="text-blue-400">
                  X-API-Key: your_api_key_here
                </code>
              </div>
              
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <a
                  href="#api-documentation"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  詳細なAPI仕様を見る
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiSettings;