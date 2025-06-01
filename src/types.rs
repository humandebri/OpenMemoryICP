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

// API Request/Response Types
#[derive(Deserialize)]
pub struct AddMemoryRequest {
    pub content: String,
    pub metadata: Option<HashMap<String, String>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Serialize)]
pub struct AddMemoryResponse {
    pub id: String,
    pub message: String,
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

// Create a wrapper type for user memory lists to implement Storable
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct UserMemoryList(pub Vec<String>);

impl Storable for UserMemoryList {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}