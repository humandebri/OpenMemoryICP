use anyhow::{Result, anyhow};
use candid::{CandidType, Decode, Encode, Principal};
use ic_agent::{Agent, Identity};
use ic_utils::interfaces::http_request::{HeaderField, HttpResponse as AgentHttpResponse};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::config::{Config, AuthMethod};
use crate::local_identity::LocalIdentityManager;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Memory {
    pub id: String,
    pub content: String,
    pub tags: Vec<String>,
    pub metadata: HashMap<String, String>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateMemoryRequest {
    content: String,
    tags: Vec<String>,
    metadata: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SearchRequest {
    query: String,
    limit: usize,
}

pub struct OpenMemoryClient {
    agent: Agent,
    canister_id: Principal,
    auth_header: Option<(String, String)>,
}

impl OpenMemoryClient {
    pub async fn new(config: &Config) -> Result<Self> {
        let (agent, auth_header) = match &config.auth_method {
            AuthMethod::LocalIdentity => {
                let manager = LocalIdentityManager::new();
                let identity = manager.get_or_create_identity()?;
                
                let agent = Agent::builder()
                    .with_url(config.get_network_url())
                    .with_identity(identity)
                    .build()?;
                
                if config.network == "local" {
                    agent.fetch_root_key().await?;
                }
                
                (agent, None)
            }
            AuthMethod::ApiKey(api_key) => {
                let agent = Agent::builder()
                    .with_url(config.get_network_url())
                    .build()?;
                
                if config.network == "local" {
                    agent.fetch_root_key().await?;
                }
                
                let auth_header = ("x-api-key".to_string(), api_key.clone());
                (agent, Some(auth_header))
            }
            AuthMethod::AccessToken(token) => {
                let agent = Agent::builder()
                    .with_url(config.get_network_url())
                    .build()?;
                
                if config.network == "local" {
                    agent.fetch_root_key().await?;
                }
                
                let auth_header = ("authorization".to_string(), format!("Bearer {}", token));
                (agent, Some(auth_header))
            }
        };
        
        let canister_id = Principal::from_text(&config.canister_id)?;
        
        Ok(Self {
            agent,
            canister_id,
            auth_header,
        })
    }
    
    async fn make_request(&self, method: &str, path: &str, body: Option<Vec<u8>>) -> Result<HttpResponse> {
        let mut headers = vec![];
        
        if let Some((key, value)) = &self.auth_header {
            headers.push((key.clone(), value.clone()));
        }
        
        headers.push(("Content-Type".to_string(), "application/json".to_string()));
        
        let request = HttpRequest {
            method: method.to_string(),
            url: path.to_string(),
            headers,
            body: body.unwrap_or_default(),
        };
        
        let response = if method == "GET" {
            // Query call for GET requests
            let response_bytes = self.agent
                .query(&self.canister_id, "http_request")
                .with_arg(Encode!(&request)?)
                .call()
                .await?;
            
            Decode!(&response_bytes, HttpResponse)?
        } else {
            // Update call for POST/DELETE requests
            let response_bytes = self.agent
                .update(&self.canister_id, "http_request_update")
                .with_arg(Encode!(&request)?)
                .call()
                .await?;
            
            Decode!(&response_bytes, HttpResponse)?
        };
        
        if response.status_code >= 400 {
            let error_msg = String::from_utf8_lossy(&response.body);
            return Err(anyhow!("API error ({}): {}", response.status_code, error_msg));
        }
        
        Ok(response)
    }
    
    pub async fn add_memory(
        &self,
        content: String,
        tags: Vec<String>,
        metadata: HashMap<String, String>,
    ) -> Result<String> {
        let request = CreateMemoryRequest {
            content,
            tags,
            metadata,
        };
        
        let body = serde_json::to_vec(&request)?;
        let response = self.make_request("POST", "/memories", Some(body)).await?;
        
        let response_data: HashMap<String, serde_json::Value> = 
            serde_json::from_slice(&response.body)?;
        
        response_data.get("id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow!("No memory ID in response"))
    }
    
    pub async fn search(&self, query: &str, limit: usize) -> Result<Vec<Memory>> {
        let request = SearchRequest {
            query: query.to_string(),
            limit,
        };
        
        let body = serde_json::to_vec(&request)?;
        let response = self.make_request("POST", "/memories/search", Some(body)).await?;
        
        let memories: Vec<Memory> = serde_json::from_slice(&response.body)?;
        Ok(memories)
    }
    
    pub async fn list_memories(&self, limit: usize) -> Result<Vec<Memory>> {
        let path = format!("/memories?limit={}", limit);
        let response = self.make_request("GET", &path, None).await?;
        
        let memories: Vec<Memory> = serde_json::from_slice(&response.body)?;
        Ok(memories)
    }
    
    pub async fn delete_memory(&self, id: &str) -> Result<()> {
        let path = format!("/memories/{}", id);
        self.make_request("DELETE", &path, None).await?;
        Ok(())
    }
    
    pub async fn set_openai_key(&self, api_key: &str) -> Result<()> {
        let mut config = HashMap::new();
        config.insert("openai_api_key".to_string(), api_key.to_string());
        
        let body = serde_json::to_vec(&config)?;
        self.make_request("POST", "/config", Some(body)).await?;
        
        Ok(())
    }
    
    // Token management methods
    pub async fn create_access_token(&self, description: Option<String>, expires_in_days: u32) -> Result<(String, u64)> {
        let mut request_body = HashMap::new();
        if let Some(desc) = description {
            request_body.insert("description", serde_json::Value::String(desc));
        }
        request_body.insert("expires_in_days", serde_json::Value::Number(serde_json::Number::from(expires_in_days)));
        
        let body = serde_json::to_vec(&request_body)?;
        let response = self.make_request("POST", "/auth/tokens", Some(body)).await?;
        
        let response_data: HashMap<String, serde_json::Value> = 
            serde_json::from_slice(&response.body)?;
        
        let token = response_data.get("token")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("No token in response"))?
            .to_string();
            
        let expires_at = response_data.get("expires_at")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| anyhow!("No expires_at in response"))?;
        
        Ok((token, expires_at))
    }
    
    pub async fn list_access_tokens(&self) -> Result<Vec<TokenInfo>> {
        let response = self.make_request("GET", "/auth/tokens", None).await?;
        let tokens: Vec<TokenInfo> = serde_json::from_slice(&response.body)?;
        Ok(tokens)
    }
    
    pub async fn revoke_access_token(&self, token: &str) -> Result<()> {
        let path = format!("/auth/tokens/{}", token);
        self.make_request("DELETE", &path, None).await?;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenInfo {
    pub description: Option<String>,
    pub permissions: Vec<String>, // Simplified for CLI
    pub expires_at: u64,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
}