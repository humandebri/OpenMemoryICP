# OpenMemory ICP 技術設計書 (HTTP API版)

## エグゼクティブサマリー

Internet Computer Protocol（ICP）上でRustを使用したOpenMemoryインスパイアドAIメモリシステムの設計文書。WebSocketやMCPの複雑さを排除し、**純粋なHTTP API**のみでquery_call/update_callをラップした、シンプルで実用的なアプローチを採用。Kinicベクターデータベースと統合し、既存のHTTPライブラリから簡単に利用可能なAIメモリサービスを構築する。

## 1. システムアーキテクチャ

### 1.1 シンプルHTTPアーキテクチャ

```
AIクライアント/アプリケーション
         ↓ 標準HTTP API (GET/POST/DELETE)
┌───────────────────────────────────────────┐
│          ICP HTTP Gateway                 │
│  • HTTPリクエスト→Canister呼び出し変換     │
│  • GET → query_call (http_request)        │
│  • POST/DELETE → update_call              │
│    (http_request_update)                  │
└─────────────────┬─────────────────────────┘
                  ↓ Candidエンコード
┌─────────────────────────────────────────────┐
│         メモリAPIキャニスター               │
│  ┌─────────────────┐ ┌─────────────────┐  │
│  │  http_request   │ │http_request_    │  │
│  │   (query)       │ │  update         │  │
│  │ • メモリ取得    │ │ • メモリ追加    │  │
│  │ • 検索実行      │ │ • メモリ削除    │  │
│  │ • 統計取得      │ │ • 設定更新      │  │
│  └─────────────────┘ └─────────────────┘  │
└─────────────────┬─────────────────────────┘
                  ↓ キャニスター間呼び出し
┌─────────────────────────────────────────────┐
│        ストレージキャニスター               │
│  • IC-Vectuneベクターデータベース           │
│  • Stable Memory永続化                     │
│  • メタデータ管理                          │
└─────────────────────────────────────────────┘
```

### 1.2 HTTP Gateway自動ルーティング

The HTTP gateway intercepts the request and resolves the canister ID of the request's destination. The request is encoded with Candid and sent in a query call to the destination canister's http_request method

If the canister requests it, the gateway sends the request again via an update call to the canister's http_request_update method

## 2. HTTP API設計

### 2.1 RESTエンドポイント設計

```rust
// 読み取り専用操作 (GET) → query_call (http_request)
GET  /memories                    // メモリ一覧取得
GET  /memories/{id}               // 特定メモリ取得
GET  /memories/search?q={query}   // セマンティック検索
GET  /users/{id}/memories         // ユーザーメモリ一覧
GET  /health                      // ヘルスチェック
GET  /stats                       // システム統計

// 状態変更操作 (POST/DELETE) → update_call (http_request_update)
POST   /memories                  // メモリ追加
DELETE /memories/{id}             // メモリ削除
POST   /memories/bulk             // 一括追加
DELETE /memories/bulk             // 一括削除
POST   /users/{id}/settings       // ユーザー設定更新
```

### 2.2 HTTP リクエスト/レスポンス

```rust
// メモリ追加リクエスト (POST /memories)
{
  "content": "ICPは分散型クラウドコンピューティングプラットフォームです",
  "metadata": {
    "source": "documentation",
    "category": "tech"
  },
  "tags": ["ICP", "blockchain", "tech"]
}

// メモリ検索リクエスト (GET /memories/search?q=ICP特徴&limit=5)
// クエリパラメータで指定

// 検索レスポンス
{
  "results": [
    {
      "id": "mem_123",
      "content": "ICPは分散型クラウド...",
      "similarity_score": 0.95,
      "metadata": {...},
      "tags": ["ICP", "blockchain"],
      "created_at": 1706764800000
    }
  ],
  "total_count": 15,
  "query_time_ms": 45
}
```

## 3. キャニスター実装

### 3.1 HTTPリクエストハンドラー

```rust
use ic_cdk_macros::{init, query, update};
use ic_cdk::api::management_canister::http_request::{HttpRequest, HttpResponse};
use serde_json::{json, Value};
use std::collections::HashMap;

// 読み取り専用操作 (GET requests)
#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let method = req.method.to_uppercase();
    
    // CORSヘッダー追加
    let mut headers = vec![
        ("Access-Control-Allow-Origin".to_string(), "*".to_string()),
        ("Content-Type".to_string(), "application/json".to_string()),
    ];
    
    match (method.as_str(), path.as_str()) {
        ("GET", "/health") => handle_health_check(),
        ("GET", "/stats") => handle_stats(),
        ("GET", path) if path.starts_with("/memories/search") => {
            handle_search_query(&req)
        },
        ("GET", path) if path.starts_with("/memories/") => {
            handle_get_memory(&req)
        },
        ("GET", "/memories") => handle_list_memories(&req),
        ("OPTIONS", _) => {
            // CORS preflight
            headers.extend([
                ("Access-Control-Allow-Methods".to_string(), "GET, POST, DELETE, OPTIONS".to_string()),
                ("Access-Control-Allow-Headers".to_string(), "Content-Type, Authorization".to_string()),
            ]);
            HttpResponse {
                status_code: 200,
                headers,
                body: vec![],
                upgrade: Some(false), // query callのまま
            }
        },
        _ => HttpResponse {
            status_code: 404,
            headers,
            body: json!({"error": "Not found"}).to_string().into_bytes(),
            upgrade: Some(false),
        }
    }
}

// 状態変更操作 (POST/DELETE requests)
#[update]
async fn http_request_update(req: HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let method = req.method.to_uppercase();
    
    // 認証チェック
    let user = match authenticate_request(&req).await {
        Ok(user) => user,
        Err(e) => return error_response(401, &format!("Authentication failed: {}", e)),
    };
    
    let headers = vec![
        ("Access-Control-Allow-Origin".to_string(), "*".to_string()),
        ("Content-Type".to_string(), "application/json".to_string()),
    ];
    
    match (method.as_str(), path.as_str()) {
        ("POST", "/memories") => handle_add_memory(&req, user).await,
        ("DELETE", path) if path.starts_with("/memories/") => {
            handle_delete_memory(&req, user).await
        },
        ("POST", "/memories/bulk") => handle_bulk_add(&req, user).await,
        ("DELETE", "/memories/bulk") => handle_bulk_delete(&req, user).await,
        ("POST", path) if path.starts_with("/users/") && path.ends_with("/settings") => {
            handle_update_settings(&req, user).await
        },
        _ => HttpResponse {
            status_code: 404,
            headers,
            body: json!({"error": "Not found"}).to_string().into_bytes(),
            upgrade: None,
        }
    }
}

fn handle_health_check() -> HttpResponse {
    HttpResponse {
        status_code: 200,
        headers: vec![("Content-Type".to_string(), "application/json".to_string())],
        body: json!({
            "status": "healthy",
            "timestamp": ic_cdk::api::time(),
            "version": "1.0.0"
        }).to_string().into_bytes(),
        upgrade: Some(false), // query callのまま
    }
}

fn handle_search_query(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let query = match query_params.get("q") {
        Some(q) => q,
        None => return error_response(400, "Missing 'q' parameter"),
    };
    
    let limit: usize = query_params.get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(10);
    
    let tags: Option<Vec<String>> = query_params.get("tags")
        .map(|t| t.split(',').map(|s| s.to_string()).collect());
    
    // ストレージキャニスターで検索実行
    match perform_search(query, limit, tags) {
        Ok(results) => HttpResponse {
            status_code: 200,
            headers: vec![("Content-Type".to_string(), "application/json".to_string())],
            body: serde_json::to_vec(&results).unwrap(),
            upgrade: Some(false),
        },
        Err(e) => error_response(500, &format!("Search failed: {}", e)),
    }
}

async fn handle_add_memory(req: &HttpRequest, user: Principal) -> HttpResponse {
    let request: AddMemoryRequest = match serde_json::from_slice(&req.body) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };
    
    // 埋め込みベクター生成
    let embedding = match generate_embedding(&request.content).await {
        Ok(emb) => emb,
        Err(e) => return error_response(500, &format!("Failed to generate embedding: {}", e)),
    };
    
    // メモリオブジェクト作成
    let memory = Memory {
        id: generate_uuid(),
        user_id: user,
        content: request.content,
        embedding,
        metadata: request.metadata.unwrap_or_default(),
        tags: request.tags.unwrap_or_default(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    // ストレージキャニスターに保存
    match store_memory(memory.clone()).await {
        Ok(_) => HttpResponse {
            status_code: 201,
            headers: vec![("Content-Type".to_string(), "application/json".to_string())],
            body: json!({
                "id": memory.id,
                "message": "Memory created successfully"
            }).to_string().into_bytes(),
            upgrade: None,
        },
        Err(e) => error_response(500, &format!("Failed to store memory: {}", e)),
    }
}
```

### 3.2 ストレージキャニスター

```rust
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl};
use ic_vectune::{VectorStore, Config, SimilarityFunction};

thread_local! {
    static MEMORIES: RefCell<StableBTreeMap<String, Memory, DefaultMemoryImpl>> = 
        RefCell::new(StableBTreeMap::init(DefaultMemoryImpl::default()));
    
    static USER_MEMORIES: RefCell<StableBTreeMap<Principal, Vec<String>, DefaultMemoryImpl>> = 
        RefCell::new(StableBTreeMap::init(DefaultMemoryImpl::default()));
    
    static VECTOR_STORE: RefCell<Option<VectorStore>> = RefCell::new(None);
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct Memory {
    pub id: String,
    pub user_id: Principal,
    pub content: String,
    pub embedding: Vec<f32>,
    pub metadata: HashMap<String, String>,
    pub tags: Vec<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[init]
async fn init() {
    // IC-Vectuneベクターストア初期化
    let config = Config {
        dimension: 1536,              // OpenAI embedding次元
        similarity_function: SimilarityFunction::Cosine,
        max_vectors: 1_000_000,
        memory_allocation: 512 * 1024 * 1024, // 512MB
    };
    
    let vector_store = VectorStore::new(config).unwrap();
    VECTOR_STORE.with(|vs| {
        *vs.borrow_mut() = Some(vector_store);
    });
}

#[update]
async fn store_memory(memory: Memory) -> Result<(), String> {
    let memory_id = memory.id.clone();
    
    // メタデータ保存
    MEMORIES.with(|m| {
        m.borrow_mut().insert(memory_id.clone(), memory.clone())
    });
    
    // ベクターインデックス追加
    VECTOR_STORE.with(|vs| {
        if let Some(ref mut store) = *vs.borrow_mut() {
            store.add_vector(memory_id.clone(), memory.embedding.clone())?;
        }
        Ok(())
    })?;
    
    // ユーザーメモリインデックス更新
    USER_MEMORIES.with(|um| {
        let mut user_memories = um.borrow_mut();
        let mut memories = user_memories.get(&memory.user_id).unwrap_or_default();
        memories.push(memory_id);
        user_memories.insert(memory.user_id, memories);
    });
    
    Ok(())
}

#[query]
fn search_memories(
    query_embedding: Vec<f32>, 
    limit: usize, 
    user_filter: Option<Principal>
) -> Result<Vec<SearchResult>, String> {
    // ベクター検索
    let similar_ids = VECTOR_STORE.with(|vs| {
        if let Some(ref store) = *vs.borrow() {
            store.search(&query_embedding, limit, 0.7)
        } else {
            Vec::new()
        }
    });
    
    // メモリ詳細取得とフィルタリング
    let mut results = Vec::new();
    MEMORIES.with(|m| {
        let memories = m.borrow();
        for (id, similarity) in similar_ids {
            if let Some(memory) = memories.get(&id) {
                // ユーザーフィルタ適用
                if let Some(user) = user_filter {
                    if memory.user_id != user {
                        continue;
                    }
                }
                
                results.push(SearchResult {
                    memory: memory.clone(),
                    similarity_score: similarity,
                });
            }
        }
    });
    
    Ok(results)
}

#[query]
fn get_memory(id: String) -> Result<Option<Memory>, String> {
    MEMORIES.with(|m| {
        Ok(m.borrow().get(&id).cloned())
    })
}

#[query]
fn list_user_memories(user_id: Principal, offset: usize, limit: usize) -> Result<Vec<Memory>, String> {
    USER_MEMORIES.with(|um| {
        let user_memories = um.borrow();
        if let Some(memory_ids) = user_memories.get(&user_id) {
            let mut memories = Vec::new();
            
            MEMORIES.with(|m| {
                let memory_map = m.borrow();
                for id in memory_ids.iter().skip(offset).take(limit) {
                    if let Some(memory) = memory_map.get(id) {
                        memories.push(memory);
                    }
                }
            });
            
            Ok(memories)
        } else {
            Ok(Vec::new())
        }
    })
}

#[update]
async fn delete_memory(id: String, user_id: Principal) -> Result<bool, String> {
    // 権限チェック
    let memory = MEMORIES.with(|m| m.borrow().get(&id).cloned());
    
    let memory = match memory {
        Some(m) => m,
        None => return Ok(false), // メモリが存在しない
    };
    
    if memory.user_id != user_id {
        return Err("Permission denied".to_string());
    }
    
    // メタデータ削除
    MEMORIES.with(|m| {
        m.borrow_mut().remove(&id)
    });
    
    // ベクターインデックス削除
    VECTOR_STORE.with(|vs| {
        if let Some(ref mut store) = *vs.borrow_mut() {
            store.remove_vector(&id)?;
        }
        Ok(())
    })?;
    
    // ユーザーメモリインデックス更新
    USER_MEMORIES.with(|um| {
        let mut user_memories = um.borrow_mut();
        if let Some(mut memories) = user_memories.get(&user_id) {
            memories.retain(|mid| mid != &id);
            user_memories.insert(user_id, memories);
        }
    });
    
    Ok(true)
}
```

### 3.3 埋め込みベクター生成

```rust
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpMethod, HttpHeader
};

async fn generate_embedding(text: &str) -> Result<Vec<f32>, String> {
    let request_body = json!({
        "model": "text-embedding-ada-002",
        "input": text,
        "encoding_format": "float"
    });
    
    let http_request = CanisterHttpRequestArgument {
        url: "https://api.openai.com/v1/embeddings".to_string(),
        method: HttpMethod::POST,
        body: Some(request_body.to_string().into_bytes()),
        max_response_bytes: Some(8192),
        headers: vec![
            HttpHeader {
                name: "Authorization".to_string(),
                value: format!("Bearer {}", get_openai_api_key()),
            },
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            }
        ],
        transform: None,
    };
    
    let (response,) = ic_cdk::call(
        Principal::management_canister(),
        "http_request",
        (http_request,),
    ).await.map_err(|e| format!("HTTP request failed: {:?}", e))?;
    
    let embedding_response: EmbeddingResponse = 
        serde_json::from_slice(&response.body)
            .map_err(|e| format!("JSON parse error: {}", e))?;
    
    Ok(embedding_response.data[0].embedding.clone())
}

#[derive(Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

fn get_openai_api_key() -> String {
    // 実装：セキュアな方法でAPIキーを取得
    // 環境変数、キャニスター設定、またはInternet Identityベースの暗号化ストレージから
    std::env::var("OPENAI_API_KEY")
        .unwrap_or_else(|_| "your-api-key-here".to_string())
}
```

## 4. クライアント統合例

### 4.1 Pythonクライアント

```python
import requests
from typing import List, Dict, Optional

class OpenMemoryClient:
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        if auth_token:
            self.session.headers.update({'Authorization': f'Bearer {auth_token}'})
    
    def add_memory(self, content: str, metadata: Dict = None, tags: List[str] = None) -> str:
        """メモリを追加"""
        payload = {
            'content': content,
            'metadata': metadata or {},
            'tags': tags or []
        }
        
        response = self.session.post(f'{self.base_url}/memories', json=payload)
        response.raise_for_status()
        return response.json()['id']
    
    def search_memories(self, query: str, limit: int = 10, tags: str = None) -> List[Dict]:
        """セマンティック検索"""
        params = {'q': query, 'limit': limit}
        if tags:
            params['tags'] = tags
            
        response = self.session.get(f'{self.base_url}/memories/search', params=params)
        response.raise_for_status()
        return response.json()['results']
    
    def get_memory(self, memory_id: str) -> Dict:
        """特定のメモリを取得"""
        response = self.session.get(f'{self.base_url}/memories/{memory_id}')
        response.raise_for_status()
        return response.json()
    
    def delete_memory(self, memory_id: str) -> bool:
        """メモリを削除"""
        response = self.session.delete(f'{self.base_url}/memories/{memory_id}')
        response.raise_for_status()
        return response.json().get('deleted', False)
    
    def list_memories(self, offset: int = 0, limit: int = 20) -> List[Dict]:
        """メモリ一覧を取得"""
        params = {'offset': offset, 'limit': limit}
        response = self.session.get(f'{self.base_url}/memories', params=params)
        response.raise_for_status()
        return response.json()['memories']
    
    def health_check(self) -> Dict:
        """ヘルスチェック"""
        response = self.session.get(f'{self.base_url}/health')
        response.raise_for_status()
        return response.json()

# 使用例
client = OpenMemoryClient('https://rdmx6-jaaaa-aaaaa-aaadq-cai.ic0.app')

# ヘルスチェック
health = client.health_check()
print(f"Service status: {health['status']}")

# メモリ追加
memory_id = client.add_memory(
    content="ICPは分散型クラウドコンピュータプラットフォームです",
    metadata={"source": "documentation"},
    tags=["ICP", "blockchain"]
)
print(f"Created memory: {memory_id}")

# 検索
results = client.search_memories("ICPの特徴", limit=5)
print(f"Found {len(results)} relevant memories")
for result in results:
    print(f"- {result['content'][:50]}... (score: {result['similarity_score']:.2f})")
```

### 4.2 JavaScript/TypeScript クライアント

```typescript
interface Memory {
  id: string;
  content: string;
  metadata: Record<string, string>;
  tags: string[];
  created_at: number;
  similarity_score?: number;
}

interface SearchResponse {
  results: Memory[];
  total_count: number;
  query_time_ms: number;
}

class OpenMemoryClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = authToken;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${error.error || error.message}`);
    }

    return response;
  }

  async addMemory(
    content: string, 
    metadata?: Record<string, string>, 
    tags?: string[]
  ): Promise<string> {
    const response = await this.request('/memories', {
      method: 'POST',
      body: JSON.stringify({
        content,
        metadata: metadata || {},
        tags: tags || [],
      }),
    });

    const result = await response.json();
    return result.id;
  }

  async searchMemories(
    query: string, 
    options?: { limit?: number; tags?: string }
  ): Promise<Memory[]> {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.tags) params.set('tags', options.tags);

    const response = await this.request(`/memories/search?${params}`);
    const result: SearchResponse = await response.json();
    return result.results;
  }

  async getMemory(id: string): Promise<Memory> {
    const response = await this.request(`/memories/${id}`);
    return response.json();
  }

  async deleteMemory(id: string): Promise<boolean> {
    const response = await this.request(`/memories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    return result.deleted || false;
  }

  async listMemories(offset = 0, limit = 20): Promise<Memory[]> {
    const params = new URLSearchParams({ 
      offset: offset.toString(), 
      limit: limit.toString() 
    });
    
    const response = await this.request(`/memories?${params}`);
    const result = await response.json();
    return result.memories;
  }

  async healthCheck(): Promise<{ status: string; timestamp: number; version: string }> {
    const response = await this.request('/health');
    return response.json();
  }
}

// 使用例
const client = new OpenMemoryClient('https://rdmx6-jaaaa-aaaaa-aaadq-cai.ic0.app');

// メモリ追加
const memoryId = await client.addMemory(
  "Rustは安全で高速なシステムプログラミング言語です",
  { source: "documentation" },
  ["Rust", "programming"]
);

// 検索
const memories = await client.searchMemories("Rustの特徴", { limit: 5 });
console.log(`Found ${memories.length} memories`);

// ヘルスチェック
const health = await client.healthCheck();
console.log(`Service status: ${health.status}`);
```

### 4.3 Claude用カスタム関数

```javascript
// Claude Desktopなどで使用するカスタム関数
async function searchMemory(query, limit = 5) {
  const response = await fetch(
    `https://your-canister.ic0.app/memories/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  const data = await response.json();
  
  return data.results.map(r => ({
    content: r.content,
    score: r.similarity_score,
    tags: r.tags.join(', ')
  }));
}

async function addMemory(content, tags = []) {
  const response = await fetch('https://your-canister.ic0.app/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, tags })
  });
  
  const data = await response.json();
  return data.id;
}
```

## 5. セキュリティ実装

### 5.1 Internet Identity統合

```rust
use ic_cdk::caller;
use candid::Principal;

async fn authenticate_request(req: &HttpRequest) -> Result<Principal, String> {
    // Authorizationヘッダーからトークン取得
    let auth_header = req.headers.iter()
        .find(|(name, _)| name.to_lowercase() == "authorization")
        .map(|(_, value)| value)
        .ok_or("Missing Authorization header")?;
    
    let token = auth_header.strip_prefix("Bearer ")
        .ok_or("Invalid Authorization header format")?;
    
    // Internet IdentityまたはJWTトークン検証
    verify_token(token).await
}

async fn verify_token(token: &str) -> Result<Principal, String> {
    // 実装：Internet IdentityやJWTトークンの検証
    // 簡易版：固定トークンチェック（本番では適切な検証を実装）
    if token == "test-token" {
        Ok(Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap())
    } else {
        Err("Invalid token".to_string())
    }
}
```

## 6. 実装ロードマップ

### フェーズ1: HTTPハンドラー基盤（1-3週目）
- [ ] http_request/http_request_updateメソッド実装
- [ ] 基本的なルーティングシステム
- [ ] HTTPレスポンス生成機能
- [ ] 認証機能実装

### フェーズ2: メモリCRUD操作（4-6週目）
- [ ] メモリ追加/取得/削除API
- [ ] Stable Memory永続化
- [ ] ユーザー別データ分離
- [ ] 基本エラーハンドリング

### フェーズ3: ベクター検索（7-10週目）
- [ ] IC-Vectuneライブラリ統合
- [ ] 埋め込みベクター生成API
- [ ] セマンティック検索実装
- [ ] 検索パフォーマンス最適化

### フェーズ4: クライアントSDK（11-14週目）
- [ ] Python SDKライブラリ
- [ ] JavaScript/TypeScript SDK
- [ ] Claude用カスタム関数
- [ ] ドキュメント整備

### フェーズ5: 本番対応（15-16週目）
- [ ] セキュリティ強化
- [ ] 監視・ログ機能
- [ ] パフォーマンステスト
- [ ] 本番デプロイ

## 7. 技術仕様

### 7.1 依存関係

```toml
[dependencies]
ic-cdk = "0.13"
ic-stable-structures = "0.6"
candid = "0.10"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.6", features = ["v4"] }
ic-vectune = "0.1"
base64 = "0.21"
sha2 = "0.10"
url = "2.4"
```

### 7.2 パフォーマンス目標

- **API レスポンス**: <300ms (読み取り), <1s (書き込み)
- **検索レイテンシ**: <500ms (10K記録)
- **スループット**: >30 requests/sec
- **ストレージ効率**: ~10KB/メモリ
- **同時接続**: >100リクエスト/秒

### 7.3 HTTP仕様

- **CORS**: 適切なヘッダー設定
- **認証**: Bearer token (Internet Identity)
- **エラーハンドリング**: 標準HTTPステータスコード
- **コンテンツ**: JSON形式のみ

## 8. 結論

この設計により、複雑なプロトコルやWebSocketを使わずに、**純粋なHTTP API**でquery_call/update_callをラップした実用的なAIメモリサービスを構築できます。

**主要な利点:**
- **シンプル**: 標準的なHTTP API、既存ツール利用可能
- **実装しやすい**: ICPの仕組みを直接活用
- **高互換性**: あらゆるHTTPクライアントから利用可能
- **高性能**: キャニスター最適化とベクター検索
- **セキュア**: Internet Identityとアクセス制御

**実装の容易さ:**
- プロトコル変換不要
- WebSocket管理不要
- 段階的開発可能
- 豊富なクライアントライブラリ

Claude Codeでの実装準備完了です！