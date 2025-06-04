// OpenMemory API Client for saving conversation
const API_KEY = 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O';
const BASE_URL = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';

// Development API key (fallback)
const DEV_API_KEY = 'openmemory-api-key-development';

async function testAPIConnection() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const health = await response.json();
    console.log('✅ API Health Check:', health);
    return true;
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return false;
  }
}

async function saveMemory(content, tags = [], metadata = {}) {
  const memoryData = {
    content,
    tags,
    metadata
  };

  try {
    console.log('📝 Attempting to save memory...');
    
    // Try with custom API key first
    let response = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(memoryData)
    });

    if (!response.ok) {
      console.log('❌ Custom API key failed, trying development key...');
      
      // Fallback to development API key
      response = await fetch(`${BASE_URL}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': DEV_API_KEY
        },
        body: JSON.stringify(memoryData)
      });
    }

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Memory saved successfully:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Failed to save memory:', response.status, error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error saving memory:', error);
    return null;
  }
}

async function saveConversationAsMemory() {
  const conversationSummary = `
OpenMemory ICP Development Session - Complete Implementation

## Phase 1: API設定とドキュメント作成

### ユーザーリクエスト:
フロントエンドでAPIの設定をできる様にしてもらえませんか？　また、APIの使い方をreadmeにまとめて

### 実装内容:

1. **API設定UI実装**
   - API設定画面 (ApiSettings.tsx) の作成
   - APIキー生成・管理機能
   - ベースURL設定機能
   - ナビゲーションへの統合

2. **会話履歴管理システム**
   - POST /conversations エンドポイント
   - GET /conversations エンドポイント
   - Claude Code統合準備

3. **認証システム強化**
   - Bearer Token認証
   - API Key認証 (X-API-Key)
   - CORS設定改善

4. **包括的ドキュメント作成**
   - 完全なAPI仕様書 (README.md)
   - TypeScript/Python/curl使用例
   - エラーハンドリング解説
   - 統合サンプルコード

### メモリ保存エラー修正:
- APIレスポンス形式の不一致解決
- フロントエンド型定義更新
- バックエンドとの互換性確保

### Internet Identity セッション管理:
- 30日間の長期セッション設定
- F5リロード時のログイン維持
- 自動セッション復元機能
- ローカルストレージ連携

### 技術スタック:
- Backend: Rust + IC-CDK (Canister: 77fv5-oiaaa-aaaal-qsoea-cai)
- Frontend: React + TypeScript (Canister: 7yetj-dqaaa-aaaal-qsoeq-cai)
- Authentication: Internet Identity + API Keys
- Storage: IC Stable Structures

### 生成されたAPIキー:
om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O

### デプロイ状況:
- ✅ Backend deployed to IC mainnet
- ✅ Frontend deployed to IC mainnet  
- ✅ API endpoints active
- ✅ GitHub repository updated
- ✅ Documentation complete
`;

  const result = await saveMemory(
    conversationSummary.trim(),
    ['development', 'icp', 'openmemory', 'api', 'claude-code', 'frontend', 'backend'],
    {
      session_type: 'development',
      project: 'OpenMemoryICP',
      phase: 'Phase 1 - API Implementation',
      api_key_generated: 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O',
      repository: 'https://github.com/humandebri/OpenMemoryICP',
      backend_canister: '77fv5-oiaaa-aaaal-qsoea-cai',
      frontend_canister: '7yetj-dqaaa-aaaal-qsoeq-cai',
      deployment_status: 'complete'
    }
  );

  return result;
}

// Main execution
async function main() {
  console.log('🚀 Starting OpenMemory conversation save process...');
  
  // Test API connection
  const connected = await testAPIConnection();
  if (!connected) {
    console.error('❌ Cannot connect to OpenMemory API. Exiting...');
    return;
  }

  // Save the conversation
  const result = await saveConversationAsMemory();
  
  if (result) {
    console.log('🎉 Conversation successfully saved to OpenMemory!');
    console.log('📊 Memory ID:', result.id);
    console.log('🌐 Access at: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io');
  } else {
    console.error('❌ Failed to save conversation to OpenMemory');
  }
}

// Run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

// Export for use as module
if (typeof module !== 'undefined') {
  module.exports = { saveConversationAsMemory, saveMemory, testAPIConnection };
}