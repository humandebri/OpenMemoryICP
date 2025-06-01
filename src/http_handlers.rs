use crate::types::*;
use crate::utils::*;
use crate::auth::*;
use crate::storage::*;
use serde_json::json;
use ic_cdk::api::time;

pub fn handle_http_request(req: HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    let method = req.method.to_uppercase();
    
    ic_cdk::println!("HTTP Request: {} {}", method, path);
    
    match (method.as_str(), path.as_str()) {
        ("GET", "/health") => handle_health_check(),
        ("GET", "/stats") => handle_stats(),
        ("GET", path) if path.starts_with("/memories/search") => handle_search_query(&req),
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
    
    // Authenticate user for all update operations
    let user = match authenticate_request(&req).await {
        Ok(user) => user,
        Err(e) => return error_response(401, &format!("Authentication failed: {}", e)),
    };
    
    match (method.as_str(), path.as_str()) {
        ("POST", "/memories") => handle_add_memory(&req, user).await,
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

fn handle_search_query(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let query = match query_params.get("q") {
        Some(q) if !q.is_empty() => q,
        _ => return error_response(400, "Missing or empty 'q' parameter"),
    };
    
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(10);
    
    if limit > 100 {
        return error_response(400, "Limit cannot exceed 100");
    }
    
    let tags: Option<Vec<String>> = query_params
        .get("tags")
        .map(|t| t.split(',').map(|s| s.trim().to_string()).collect());
    
    let user_filter = query_params
        .get("user")
        .and_then(|u| candid::Principal::from_text(u).ok());
    
    // For now, return a simple search without embeddings
    // This will be enhanced when we implement the embedding search
    match search_memories_simple(query, limit, tags, user_filter) {
        Ok(results) => {
            let response = SearchResponse {
                results,
                total_count: 0, // Will be implemented later
                query_time_ms: 0, // Will be implemented later
            };
            success_response(&response, 200)
        }
        Err(e) => error_response(500, &format!("Search failed: {}", e)),
    }
}

fn handle_get_memory(req: &HttpRequest) -> HttpResponse {
    let path = extract_path(&req.url);
    
    if let Some(memory_id) = extract_path_param(&path, "/memories/{id}") {
        match get_memory(&memory_id) {
            Ok(Some(memory)) => success_response(&memory, 200),
            Ok(None) => error_response(404, "Memory not found"),
            Err(e) => error_response(500, &format!("Failed to get memory: {}", e)),
        }
    } else {
        error_response(400, "Invalid memory ID")
    }
}

fn handle_list_memories(req: &HttpRequest) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let offset: usize = query_params
        .get("offset")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0);
    
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(20);
    
    if limit > 100 {
        return error_response(400, "Limit cannot exceed 100");
    }
    
    let user_filter = query_params
        .get("user")
        .and_then(|u| candid::Principal::from_text(u).ok());
    
    match list_memories(offset, limit, user_filter) {
        Ok(memories) => {
            let response = ListMemoriesResponse {
                memories: memories.clone(),
                total_count: memories.len(), // Will be improved later
                offset,
                limit,
            };
            success_response(&response, 200)
        }
        Err(e) => error_response(500, &format!("Failed to list memories: {}", e)),
    }
}

async fn handle_add_memory(req: &HttpRequest, user: candid::Principal) -> HttpResponse {
    let request: AddMemoryRequest = match serde_json::from_slice(&req.body) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };
    
    if request.content.trim().is_empty() {
        return error_response(400, "Content cannot be empty");
    }
    
    if request.content.len() > 10000 {
        return error_response(400, "Content too large (max 10000 characters)");
    }
    
    // Generate embedding for the content
    let embedding = match crate::embedding::generate_embedding(&request.content).await {
        Ok(emb) => emb,
        Err(e) => {
            ic_cdk::println!("Failed to generate embedding: {}", e);
            // For now, continue without embedding. In production, you might want to fail the request
            Vec::new()
        }
    };
    
    let memory = Memory {
        id: generate_uuid(),
        user_id: user,
        content: request.content,
        embedding,
        metadata: request.metadata.unwrap_or_default(),
        tags: request.tags.unwrap_or_default(),
        created_at: time(),
        updated_at: time(),
    };
    
    match store_memory(memory.clone()).await {
        Ok(_) => {
            let response = AddMemoryResponse {
                id: memory.id,
                message: "Memory created successfully".to_string(),
            };
            success_response(&response, 201)
        }
        Err(e) => error_response(500, &format!("Failed to store memory: {}", e)),
    }
}

async fn handle_delete_memory(req: &HttpRequest, user: candid::Principal) -> HttpResponse {
    let path = extract_path(&req.url);
    
    if let Some(memory_id) = extract_path_param(&path, "/memories/{id}") {
        match delete_memory(&memory_id, user).await {
            Ok(true) => {
                let response = json!({
                    "deleted": true,
                    "message": "Memory deleted successfully"
                });
                success_response(&response, 200)
            }
            Ok(false) => error_response(404, "Memory not found or permission denied"),
            Err(e) => error_response(500, &format!("Failed to delete memory: {}", e)),
        }
    } else {
        error_response(400, "Invalid memory ID")
    }
}

async fn handle_bulk_add(_req: &HttpRequest, _user: candid::Principal) -> HttpResponse {
    // TODO: Implement bulk add functionality
    error_response(501, "Bulk add not implemented yet")
}

async fn handle_bulk_delete(_req: &HttpRequest, _user: candid::Principal) -> HttpResponse {
    // TODO: Implement bulk delete functionality
    error_response(501, "Bulk delete not implemented yet")
}

async fn handle_update_settings(_req: &HttpRequest, _user: candid::Principal) -> HttpResponse {
    // TODO: Implement user settings update
    error_response(501, "User settings update not implemented yet")
}

fn handle_cors_preflight() -> HttpResponse {
    HttpResponse {
        status_code: 204,
        headers: create_cors_headers(),
        body: Vec::new(),
        upgrade: Some(false),
    }
}