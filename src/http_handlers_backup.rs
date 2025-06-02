use crate::types::*;
use crate::utils::*;
use crate::auth::*;
use crate::storage::*;
use crate::internet_identity::*;
use serde_json::json;
use ic_cdk::api::time;
use candid::Principal;

pub fn handle_http_request(req: HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let method = req.method.to_uppercase();
    
    ic_cdk::println!("HTTP Request: {} {}", method, path);
    
    match (method.as_str(), path.as_str()) {
        ("GET", "/health") => handle_health_check(),
        ("GET", "/stats") => handle_stats(),
        ("GET", "/stats/vectors") => handle_vector_stats(),
        ("GET", "/auth/sessions") => handle_list_sessions(),
        ("GET", path) if path.starts_with("/suggestions") => handle_get_suggestions(&req),
        ("GET", path) if path.starts_with("/clusters") => handle_get_clusters(&req),
        ("GET", "/categories") => handle_get_categories(),
        ("GET", path) if path.starts_with("/memories/search") => {
            // Semantic search requires async, so return an error for now
            // In a real implementation, this would need to be restructured
            error_response(501, "Use /memories/search via POST for semantic search")
        },
        ("GET", path) if path.starts_with("/memories/") => handle_get_memory(&req),
        ("GET", "/memories") => handle_list_memories(&req),
        ("OPTIONS", _) => handle_cors_preflight(),
        _ => error_response(404, "Not found"),
    }
}

pub async fn handle_http_request_update(req: HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let method = req.method.to_uppercase();
    
    ic_cdk::println!("HTTP Update Request: {} {}", method, path);
    
    // Authenticate user for all update operations (supports both Bearer tokens and Internet Identity)
    let user = match authenticate_request_enhanced(&req).await {
        Ok(user) => user,
        Err(e) => return error_response(401, &format!("Authentication failed: {}", e)),
    };
    
    match (method.as_str(), path.as_str()) {
        ("POST", "/auth/login") => handle_ii_login(&req).await,
        ("POST", "/auth/logout") => handle_ii_logout(&req).await,
        ("POST", "/memories/search") => handle_semantic_search(&req, user).await,
        ("POST", "/clusters") => handle_create_cluster(&req, user).await,
        ("POST", "/memories") => handle_add_memory(&req, user).await,
        ("POST", "/conversations") => handle_save_conversation(&req, user).await,
        ("GET", "/conversations") => handle_list_conversations(&req, user).await,
        ("DELETE", path) if path.starts_with("/memories/") => handle_delete_memory(&req, user).await,
        ("POST", "/memories/bulk") => handle_bulk_add(&req, user).await,
        ("DELETE", "/memories/bulk") => handle_bulk_delete(&req, user).await,
        ("POST", path) if path.starts_with("/users/") && path.ends_with("/settings") => {
            handle_update_settings(&req, user).await
        }
        _ => error_response(404, "Not found"),
    }
}

fn handle_health_check() -> HttpResponse {
    let health = HealthResponse {
        status: "healthy".to_string(),
        timestamp: time(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        memory_count: get_memory_count(),
    };
    
    success_response(&health, 200)
}

fn handle_stats() -> HttpResponse {
    let stats = StatsResponse {
        total_memories: get_memory_count(),
        total_users: get_user_count(),
        avg_memory_size: get_avg_memory_size(),
        uptime_seconds: get_uptime_seconds(),
    };
    
    success_response(&stats, 200)
}

fn handle_vector_stats() -> HttpResponse {
    let vector_stats = crate::vector_store::AdvancedVectorStore::get_statistics();
    let vector_config = crate::vector_store::AdvancedVectorStore::get_config();
    
    let response = json!({
        "vector_statistics": vector_stats,
        "vector_configuration": vector_config,
        "timestamp": time()
    });
    
    success_response(&response, 200)
}

fn handle_get_memory(req: &HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let memory_id = path.strip_prefix("/memories/").unwrap_or("");
    
    if memory_id.is_empty() {
        return error_response(400, "Memory ID is required");
    }
    
    match get_memory(memory_id) {
        Ok(Some(memory)) => success_response(&memory, 200),
        Ok(None) => error_response(404, "Memory not found"),
        Err(e) => error_response(500, &format!("Failed to get memory: {}", e)),
    }
}

fn handle_list_memories(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(50)
        .min(100); // Max 100 memories per request
        
    let offset: usize = query_params
        .get("offset")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0);
    
    let memories = get_all_memories(limit, offset);
    
    let response = json!({
        "memories": memories,
        "limit": limit,
        "offset": offset,
        "total_count": get_memory_count()
    });
    
    success_response(&response, 200)
}

fn handle_cors_preflight() -> HttpResponse {
    HttpResponse {
        status_code: 200,
        headers: create_cors_headers(),
        body: Vec::new(),
        upgrade: Some(false),
    }
}

fn handle_list_sessions() -> HttpResponse {
    // Return empty sessions for now
    let response = json!({
        "sessions": [],
        "count": 0
    });
    
    success_response(&response, 200)
}

fn handle_get_suggestions(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let query = query_params.get("q").unwrap_or(&String::new()).clone();
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(10)
        .min(20); // Max 20 suggestions
    
    // Extract user from headers if available (for personalized suggestions)
    let user = extract_bearer_token(&req.headers)
        .and_then(|token| {
            // Try to verify token to get user
            futures::executor::block_on(async {
                crate::auth::verify_token(&token).await.ok()
            })
        });
    
    let suggestions = crate::suggestions::SuggestionsEngine::get_suggestions(
        user, 
        &query, 
        limit
    );
    
    let response = json!({
        "suggestions": suggestions,
        "context": query,
        "user_provided": user.is_some()
    });
    
    success_response(&response, 200)
}

fn handle_get_clusters(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let min_cluster_size: usize = query_params
        .get("min_cluster_size")
        .and_then(|s| s.parse().ok())
        .unwrap_or(2);
    
    // Get stored clusters
    let clusters = crate::clustering::ClusteringEngine::get_stored_clusters();
    
    // Filter by minimum size
    let filtered_clusters: Vec<_> = clusters
        .into_iter()
        .filter(|cluster| cluster.memory_ids.len() >= min_cluster_size)
        .collect();
    
    let response = json!({
        "clusters": filtered_clusters,
        "total_clusters": filtered_clusters.len(),
        "min_cluster_size": min_cluster_size
    });
    
    success_response(&response, 200)
}

fn handle_get_categories() -> HttpResponse {
    // Return predefined categories
    let categories = vec![
        "work".to_string(),
        "personal".to_string(),
        "learning".to_string(),
        "ideas".to_string(),
        "research".to_string(),
        "projects".to_string(),
        "meetings".to_string(),
        "notes".to_string(),
        "reminders".to_string(),
        "goals".to_string(),
    ];
    
    let response = json!({
        "categories": categories,
        "count": categories.len()
    });
    
    success_response(&response, 200)
}

async fn handle_add_memory(req: &HttpRequest, user: Principal) -> HttpResponse {
    let body_str = match std::str::from_utf8(&req.body) {
        Ok(s) => s,
        Err(_) => return error_response(400, "Invalid UTF-8 in request body"),
    };

    let request: AddMemoryRequest = match serde_json::from_str(body_str) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };

    if request.content.trim().is_empty() {
        return error_response(400, "Content cannot be empty");
    }

    // Generate embedding for the content
    let embedding = match crate::embedding::EmbeddingService::generate_embedding(&request.content).await {
        Ok(emb) => emb,
        Err(e) => return error_response(500, &format!("Failed to generate embedding: {}", e)),
    };

    let memory_id = crate::utils::generate_id();
    let timestamp = ic_cdk::api::time();

    let memory = Memory {
        id: memory_id.clone(),
        user_id: user,
        content: request.content.trim().to_string(),
        embedding,
        metadata: request.metadata.unwrap_or_default(),
        tags: request.tags.unwrap_or_default(),
        created_at: timestamp,
        updated_at: timestamp,
    };

    match store_memory(memory.clone()).await {
        Ok(_) => {
            // Add to vector store
            if let Err(e) = crate::vector_store::AdvancedVectorStore::add_vector(
                &memory.id,
                memory.embedding.clone()
            ) {
                ic_cdk::println!("Failed to add vector to store: {}", e);
            }
            
            let response = AddMemoryResponse {
                id: memory.id,
                created_at: memory.created_at,
            };
            success_response(&response, 201)
        }
        Err(e) => error_response(500, &format!("Failed to store memory: {}", e)),
    }
}

async fn handle_save_conversation(req: &HttpRequest, user: Principal) -> HttpResponse {
    let body_str = match std::str::from_utf8(&req.body) {
        Ok(s) => s,
        Err(_) => return error_response(400, "Invalid UTF-8 in request body"),
    };

    let request: SaveConversationRequest = match serde_json::from_str(body_str) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };

    if request.title.trim().is_empty() {
        return error_response(400, "Title cannot be empty");
    }

    if request.content.trim().is_empty() {
        return error_response(400, "Content cannot be empty");
    }

    let conversation_id = crate::utils::generate_id();
    let word_count = request.content.split_whitespace().count() as u32;
    let timestamp = ic_cdk::api::time();

    let conversation = Conversation {
        id: conversation_id.clone(),
        user_id: user,
        title: request.title.trim().to_string(),
        content: request.content.trim().to_string(),
        source: request.source.unwrap_or_else(|| "api".to_string()),
        metadata: request.metadata.unwrap_or_default(),
        word_count,
        created_at: timestamp,
        updated_at: timestamp,
    };

    match crate::storage::save_conversation(conversation.clone()).await {
        Ok(_) => {
            let response = json!({
                "id": conversation.id,
                "title": conversation.title,
                "word_count": conversation.word_count,
                "created_at": conversation.created_at,
                "message": "Conversation saved successfully"
            });
            success_response(&response, 201)
        }
        Err(e) => error_response(500, &format!("Failed to save conversation: {}", e)),
    }
}

async fn handle_list_conversations(req: &HttpRequest, user: Principal) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(20)
        .min(100); // Max 100 conversations per request
        
    let offset: usize = query_params
        .get("offset")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0);

    match crate::storage::get_user_conversations(user, limit, offset) {
        Ok(conversations) => {
            let response = json!({
                "conversations": conversations,
                "limit": limit,
                "offset": offset,
                "total_count": conversations.len()
            });
            success_response(&response, 200)
        }
        Err(e) => error_response(500, &format!("Failed to get conversations: {}", e)),
    }
}

// Add other handler functions here as needed...
// (semantic search, clustering, bulk operations, etc.)