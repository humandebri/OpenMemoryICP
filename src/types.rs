use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ic_stable_structures::{Storable, storable::Bound};
use std::borrow::Cow;

// HTTP Types for ICP canister interface
#[derive(CandidType, Deserialize, Clone)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(CandidType, Serialize)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub upgrade: Option<bool>,
}

// Memory Types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
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

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SearchResult {
    pub memory: Memory,
    pub similarity_score: f32,
}

// Conversation Types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Conversation {
    pub id: String,
    pub user_id: Principal,
    pub title: String,
    pub content: String,
    pub source: String, // "claude_code", "manual", etc.
    pub metadata: HashMap<String, String>,
    pub word_count: u32,
    pub created_at: u64,
    pub updated_at: u64,
}

// API Request/Response Types
#[derive(Deserialize)]
pub struct AddMemoryRequest {
    pub content: String,
    pub metadata: Option<HashMap<String, String>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct SaveConversationRequest {
    pub title: String,
    pub content: String,
    pub source: Option<String>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Serialize)]
pub struct AddMemoryResponse {
    pub id: String,
    pub created_at: u64,
}

#[derive(Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total_count: usize,
    pub query_time_ms: u64,
}

#[derive(Serialize)]
pub struct ListMemoriesResponse {
    pub memories: Vec<Memory>,
    pub total_count: usize,
    pub offset: usize,
    pub limit: usize,
}

#[derive(Serialize)]
// Legacy error response (deprecated - use errors::ErrorResponse instead)
pub struct ErrorResponse {
    pub error: String,
    pub code: u16,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: u64,
    pub version: String,
    pub memory_count: usize,
}

#[derive(Serialize)]
pub struct StatsResponse {
    pub total_memories: usize,
    pub total_users: usize,
    pub avg_memory_size: f64,
    pub uptime_seconds: u64,
}

// OpenAI API Types
#[derive(Deserialize)]
pub struct EmbeddingResponse {
    pub data: Vec<EmbeddingData>,
}

#[derive(Deserialize)]
pub struct EmbeddingData {
    pub embedding: Vec<f32>,
}

#[derive(Serialize)]
pub struct EmbeddingRequest {
    pub model: String,
    pub input: String,
    pub encoding_format: String,
}

// Authentication Types
#[derive(Deserialize)]
pub struct AuthToken {
    pub token: String,
    pub user_id: Principal,
    pub expires_at: u64,
}

// Hybrid Token Authentication Types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AccessToken {
    pub token: String,
    pub owner_principal: Principal, // The II Principal
    pub issued_to: Option<String>,  // Description like "CLI on MacBook"
    pub permissions: Vec<Permission>,
    pub expires_at: u64,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum Permission {
    Read,
    Write,
    Delete,
    ManageConfig,
}

#[derive(Deserialize)]
pub struct CreateTokenRequest {
    pub description: Option<String>, // "CLI on MacBook", "Android App", etc.
    pub permissions: Option<Vec<Permission>>,
    pub expires_in_days: Option<u32>, // Default 30 days
}

#[derive(Serialize)]
pub struct CreateTokenResponse {
    pub token: String,
    pub expires_at: u64,
    pub permissions: Vec<Permission>,
}

#[derive(Serialize)]
pub struct TokenInfo {
    pub description: Option<String>,
    pub permissions: Vec<Permission>,
    pub expires_at: u64,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
}

// API Provider Types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ApiProvider {
    OpenAI,
    OpenRouter,
}

impl Default for ApiProvider {
    fn default() -> Self {
        ApiProvider::OpenAI
    }
}

// API Key Configuration Types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserConfig {
    pub user_id: Principal,
    pub openai_api_key: Option<String>,
    pub openrouter_api_key: Option<String>,
    pub api_provider: ApiProvider,
    pub embedding_model: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Deserialize)]
pub struct SetApiKeyRequest {
    pub api_key: String,
    pub provider: Option<String>, // "openai" or "openrouter"
}

#[derive(Deserialize)]
pub struct UpdateConfigRequest {
    pub openai_api_key: Option<String>,
    pub openrouter_api_key: Option<String>,
    pub api_provider: Option<String>, // "openai" or "openrouter"
    pub embedding_model: Option<String>,
}

#[derive(Serialize)]
pub struct ConfigResponse {
    pub has_openai_key: bool,
    pub has_openrouter_key: bool,
    pub openai_key_preview: Option<String>,
    pub openrouter_key_preview: Option<String>,
    pub api_provider: String,
    pub embedding_model: String,
    pub available_models: Vec<ModelInfo>,
    pub updated_at: Option<u64>,
}

#[derive(Serialize, Clone)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub context_length: u32,
    pub pricing: Option<ModelPricing>,
}

#[derive(Serialize, Clone)]
pub struct ModelPricing {
    pub prompt: f64,
    pub completion: f64,
}

// Implement Storable for Memory type
impl Storable for Memory {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

// Implement Storable for Conversation type
impl Storable for Conversation {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

// Create a wrapper type for user memory lists to implement Storable
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct UserMemoryList(pub Vec<String>);

// Create a wrapper type for user conversation lists to implement Storable
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct UserConversationList(pub Vec<String>);

impl Storable for UserMemoryList {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl Storable for UserConversationList {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

// Implement Storable for UserConfig
impl Storable for UserConfig {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

// Implement Storable for AccessToken
impl Storable for AccessToken {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}