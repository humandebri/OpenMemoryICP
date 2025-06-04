import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Key,
  Eye,
  EyeOff,
  Save,
  Trash,
  User,
  Shield,
  Globe,
  Code,
  Copy,
  CheckCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { openMemoryAPI } from '@/services/openmemory-api';

export const SettingsPage: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('account');
  
  // API Key management state
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // General settings state
  const [principalId, setPrincipalId] = useState<string>('');
  const [, setIsAuthenticated] = useState(false);
  const [apiKey] = useState('om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O');
  const [copied, setCopied] = useState<string>('');
  const [displayName, setDisplayName] = useState('OpenMemory User');
  const [bio, setBio] = useState('AI enthusiast exploring the frontiers of digital memory and consciousness.');
  
  // API management state  
  const [baseUrl, setBaseUrl] = useState('https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io');
  const [userApiKeys, setUserApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);

  const [apiKeyConfig, setApiKeyConfig] = useState<{
    has_openai_key: boolean;
    has_openrouter_key: boolean;
    openai_key_preview?: string;
    openrouter_key_preview?: string;
    api_provider: string;
    embedding_model: string;
    available_models: Array<{
      id: string;
      name: string;
      provider: string;
      context_length: number;
      pricing?: {
        prompt: number;
        completion: number;
      };
    }>;
    updated_at?: number;
  } | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'OpenAI' | 'OpenRouter'>('OpenAI');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Available models for enhanced selection
  const [availableModels] = useState<{
    openai: Array<{id: string, name: string, description: string, contextLength: number}>;
    openrouter: Array<{id: string, name: string, description: string, contextLength: number}>;
  }>({
    openai: [
      { id: 'text-embedding-ada-002', name: 'Ada v2', description: 'Most capable embedding model', contextLength: 8191 },
      { id: 'text-embedding-3-small', name: 'Embedding v3 Small', description: 'New improved small model', contextLength: 8191 },
      { id: 'text-embedding-3-large', name: 'Embedding v3 Large', description: 'New improved large model', contextLength: 8191 }
    ],
    openrouter: [
      { id: 'openai/text-embedding-ada-002', name: 'OpenAI Ada v2', description: 'Via OpenRouter', contextLength: 8191 },
      { id: 'openai/text-embedding-3-small', name: 'OpenAI Embedding v3 Small', description: 'Via OpenRouter', contextLength: 8191 },
      { id: 'text-embedding-ada-002', name: 'Generic Ada v2', description: 'Standard embedding model', contextLength: 8191 }
    ]
  });

  // Load all configurations on component mount
  useEffect(() => {
    console.log('SettingsPage mounted - loading configurations');
    loadApiKeyConfig();
    checkAuthStatus();
    loadUserApiKeys();
    loadBaseUrl();
  }, []);
  
  // Update selected values when config loads
  useEffect(() => {
    if (apiKeyConfig) {
      setSelectedProvider(apiKeyConfig.api_provider as 'OpenAI' | 'OpenRouter');
      setSelectedModel(apiKeyConfig.embedding_model);
    }
  }, [apiKeyConfig]);

  const checkAuthStatus = async () => {
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
  
  const loadApiKeyConfig = async () => {
    try {
      console.log('Loading API config...');
      const config = await openMemoryAPI.getConfig();
      console.log('API config loaded:', config);
      setApiKeyConfig(config);
    } catch (error) {
      console.error('Failed to load API key config:', error);
      setApiKeyMessage({ type: 'error', text: `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };
  
  const loadUserApiKeys = () => {
    const savedKeys = localStorage.getItem('openmemory-api-keys');
    if (savedKeys) {
      setUserApiKeys(JSON.parse(savedKeys));
    }
  };
  
  const loadBaseUrl = () => {
    const savedBaseUrl = localStorage.getItem('openmemory-api-base-url');
    if (savedBaseUrl) {
      setBaseUrl(savedBaseUrl);
    }
  };
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'om_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const createUserApiKey = () => {
    if (!newKeyName.trim()) return;

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      key: generateApiKey(),
      created: new Date().toISOString()
    };

    const updatedKeys = [...userApiKeys, newKey];
    setUserApiKeys(updatedKeys);
    localStorage.setItem('openmemory-api-keys', JSON.stringify(updatedKeys));
    setNewKeyName('');
    setShowNewKey(false);
  };
  
  const deleteUserApiKey = (id: string) => {
    const updatedKeys = userApiKeys.filter(key => key.id !== id);
    setUserApiKeys(updatedKeys);
    localStorage.setItem('openmemory-api-keys', JSON.stringify(updatedKeys));
  };
  
  const updateBaseUrl = () => {
    localStorage.setItem('openmemory-api-base-url', baseUrl);
  };
  
  const resetToDefaultUrl = () => {
    const defaultUrl = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
    setBaseUrl(defaultUrl);
    localStorage.setItem('openmemory-api-base-url', defaultUrl);
  };

  const handleSaveConfig = async () => {
    const configUpdate: any = {};
    
    // Validate and add OpenAI key if provided
    if (openaiApiKey.trim()) {
      if (!openaiApiKey.startsWith('sk-')) {
        setApiKeyMessage({ type: 'error', text: 'Invalid OpenAI API key format' });
        return;
      }
      configUpdate.openai_api_key = openaiApiKey;
    }
    
    // Validate and add OpenRouter key if provided
    if (openrouterApiKey.trim()) {
      if (!openrouterApiKey.startsWith('sk-')) {
        setApiKeyMessage({ type: 'error', text: 'Invalid OpenRouter API key format' });
        return;
      }
      configUpdate.openrouter_api_key = openrouterApiKey;
    }
    
    // Add provider and model if changed
    if (selectedProvider !== apiKeyConfig?.api_provider) {
      configUpdate.api_provider = selectedProvider;
    }
    
    if (selectedModel && selectedModel !== apiKeyConfig?.embedding_model) {
      configUpdate.embedding_model = selectedModel;
    }
    
    if (Object.keys(configUpdate).length === 0) {
      setApiKeyMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    setIsSavingConfig(true);
    setApiKeyMessage(null);

    try {
      await openMemoryAPI.updateConfig(configUpdate);
      setOpenaiApiKey('');
      setOpenrouterApiKey('');
      setApiKeyMessage({ type: 'success', text: 'Configuration saved successfully!' });
      await loadApiKeyConfig(); // Reload config
    } catch (error) {
      console.error('Failed to save configuration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiKeyMessage({ type: 'error', text: `Failed to save configuration: ${errorMessage}` });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API keys? This will disable AI features.')) {
      return;
    }

    try {
      await openMemoryAPI.deleteOpenAIKey();
      setApiKeyMessage({ type: 'success', text: 'API keys deleted successfully!' });
      await loadApiKeyConfig(); // Reload config
    } catch (error) {
      console.error('Failed to delete API keys:', error);
      setApiKeyMessage({ type: 'error', text: 'Failed to delete API keys. Please try again.' });
    }
  };

  const tabs = [
    { id: 'account', name: 'アカウント', icon: User },
    { id: 'ai-config', name: 'AI設定', icon: Settings },
    { id: 'api-management', name: 'API管理', icon: Code },
    { id: 'privacy', name: 'プライバシー', icon: Shield },
  ];

  const getModelOptions = () => {
    if (selectedProvider === 'OpenAI') {
      return availableModels.openai;
    } else {
      return availableModels.openrouter;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">設定</h1>
            <p className="text-gray-600">OpenMemoryのアカウント、AI、APIの設定を管理</p>
          </div>
        </div>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-1"
      >
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                プロフィール情報
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Principal ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={principalId || 'Not connected'}
                        readOnly
                        className="input w-full bg-gray-50 text-gray-600"
                      />
                      {principalId && (
                        <button
                          onClick={() => copyToClipboard(principalId, 'profile-principal')}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="Copy Principal ID"
                        >
                          {copied === 'profile-principal' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    バイオ
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="自己紹介を入力してください..."
                    className="textarea w-full"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="btn-secondary">
                    キャンセル
                  </button>
                  <button className="btn-primary">
                    変更を保存
                  </button>
                </div>
              </div>
            </div>

            {/* API Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API情報
              </h2>
              
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary-900">開発用APIキー</h3>
                    <p className="text-sm text-primary-700">Claude Code統合用のAPIキー</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(apiKey, 'apikey')}
                    className="p-2 hover:bg-primary-100 rounded transition-colors"
                    title="Copy API Key"
                  >
                    {copied === 'apikey' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                </div>
                <code className="block mt-2 px-3 py-2 bg-white rounded text-sm font-mono text-gray-800 border">
                  {apiKey}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* AI Configuration Tab */}
        {activeTab === 'ai-config' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              AI設定
            </h2>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">現在の設定</h4>
              {apiKeyConfig ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${apiKeyConfig.has_openai_key ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">OpenAI API Key</span>
                      </div>
                      {apiKeyConfig.has_openai_key && apiKeyConfig.openai_key_preview && (
                        <div className="text-sm text-gray-500 ml-5">
                          {apiKeyConfig.openai_key_preview}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${apiKeyConfig.has_openrouter_key ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">OpenRouter API Key</span>
                      </div>
                      {apiKeyConfig.has_openrouter_key && apiKeyConfig.openrouter_key_preview && (
                        <div className="text-sm text-gray-500 ml-5">
                          {apiKeyConfig.openrouter_key_preview}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <span className="text-sm font-medium text-gray-700">アクティブプロバイダー: </span>
                      <span className="text-sm text-gray-600">{apiKeyConfig.api_provider}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">埋め込みモデル: </span>
                      <span className="text-sm text-gray-600">{apiKeyConfig.embedding_model}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">読み込み中...</div>
              )}
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  APIプロバイダー
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['OpenAI', 'OpenRouter'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setSelectedProvider(provider as 'OpenAI' | 'OpenRouter')}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        selectedProvider === provider
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  埋め込みモデル
                </label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">モデルを選択してください</option>
                  {getModelOptions().map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description} (Context: {model.contextLength})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  選択されたプロバイダー: {selectedProvider}
                </p>
              </div>

              {/* API Keys */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OpenAI API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showOpenaiKey ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* OpenRouter API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenRouter API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenrouterKey ? 'text' : 'password'}
                      value={openrouterApiKey}
                      onChange={(e) => setOpenrouterApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showOpenrouterKey ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingConfig ? '保存中...' : '設定を保存'}
                </button>
              </div>

              {/* Messages */}
              {apiKeyMessage && (
                <div className={`p-3 rounded-lg border ${
                  apiKeyMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {apiKeyMessage.text}
                </div>
              )}

              {/* Delete API Key */}
              {(apiKeyConfig?.has_openai_key || apiKeyConfig?.has_openrouter_key) && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">危険なゾーン</h4>
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-900">APIキーを削除</p>
                      <p className="text-sm text-red-700">APIキーを削除します。AI機能が無効になります。</p>
                    </div>
                    <button
                      onClick={handleDeleteApiKey}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Management Tab */}
        {activeTab === 'api-management' && (
          <div className="space-y-6">
            {/* API Base URL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
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
                      className="flex-1 input"
                      placeholder="https://your-canister-id.raw.icp0.io"
                    />
                    <button
                      onClick={updateBaseUrl}
                      className="btn-primary"
                    >
                      保存
                    </button>
                    <button
                      onClick={resetToDefaultUrl}
                      className="btn-secondary"
                    >
                      デフォルト
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    カスタムデプロイメントを使用する場合は、ここでAPIのベースURLを変更できます。
                  </p>
                </div>
              </div>
            </div>

            {/* User API Keys Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  カスタムAPIキー管理
                </h2>
                <button
                  onClick={() => setShowNewKey(true)}
                  className="btn-primary"
                >
                  <Key className="w-4 h-4 mr-2" />
                  新しいキーを作成
                </button>
              </div>

              {/* New API Key Form */}
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
                      className="flex-1 input"
                      onKeyPress={(e) => e.key === 'Enter' && createUserApiKey()}
                    />
                    <button
                      onClick={createUserApiKey}
                      disabled={!newKeyName.trim()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      作成
                    </button>
                    <button
                      onClick={() => {
                        setShowNewKey(false);
                        setNewKeyName('');
                      }}
                      className="btn-secondary"
                    >
                      キャンセル
                    </button>
                  </div>
                </motion.div>
              )}

              {/* API Keys List */}
              <div className="space-y-4">
                {userApiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>カスタムAPIキーが作成されていません。</p>
                    <p className="text-sm">「新しいキーを作成」ボタンから始めてください。</p>
                  </div>
                ) : (
                  userApiKeys.map((userApiKey) => (
                    <motion.div
                      key={userApiKey.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{userApiKey.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {userApiKey.key.substring(0, 12)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(userApiKey.key, userApiKey.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="コピー"
                            >
                              {copied === userApiKey.id ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            作成日: {new Date(userApiKey.created).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteUserApiKey(userApiKey.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* API Usage Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                API使用ガイド
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">使用例</h4>
                  <div className="bg-gray-900 rounded-lg p-3 text-sm">
                    <code className="text-green-400">
                      POST {baseUrl}/conversations
                    </code>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">認証ヘッダー</h4>
                  <div className="bg-gray-900 rounded-lg p-3 text-sm">
                    <code className="text-blue-400">
                      X-API-Key: your_api_key_here
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              プライバシー・セキュリティ
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">データエクスポート</h3>
                  <p className="text-sm text-gray-600">メモリデータをダウンロード</p>
                </div>
                <button className="btn-secondary">
                  <Download className="w-4 h-4 mr-2" />
                  データをエクスポート
                </button>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-900">データセキュリティ</h3>
                <p className="text-sm text-blue-800 mt-1">
                  あなたのメモリは Internet Computer ブロックチェーン上に安全に保存されています。APIキーは暗号化され、共有されることはありません。
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl">
                <h3 className="font-medium text-green-900">分散型ストレージ</h3>
                <p className="text-sm text-green-800 mt-1">
                  OpenMemoryは分散型アーキテクチャを使用しており、データの所有権はユーザーが保持します。
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};