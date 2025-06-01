use crate::types::*;
use crate::utils::*;
use crate::auth::*;
use crate::storage::*;
use crate::internet_identity::*;
use serde_json::json;
use ic_cdk::api::time;

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

fn handle_list_sessions() -> HttpResponse {
    let sessions = list_active_sessions();
    let session_info: Vec<serde_json::Value> = sessions.into_iter().map(|s| {
        json!({
            "session_key": s.session_key,
            "user_principal": s.user_principal.to_string(),
            "created_at": s.created_at,
            "expires_at": s.expires_at
        })
    }).collect();
    
    let response = json!({
        "sessions": session_info,
        "count": session_info.len()
    });
    
    success_response(&response, 200)
}

async fn handle_ii_login(req: &HttpRequest) -> HttpResponse {
    let auth_data = match String::from_utf8(req.body.clone()) {
        Ok(data) => data,
        Err(_) => return error_response(400, "Invalid request body"),
    };
    
    match authenticate_with_ii(&auth_data).await {
        Ok(principal) => {
            // Generate session token for frontend use
            let session_info = json!({
                "status": "success",
                "principal": principal.to_string(),
                "message": "Authenticated with Internet Identity"
            });
            success_response(&session_info, 200)
        }
        Err(e) => error_response(401, &format!("Authentication failed: {}", e))
    }
}

async fn handle_ii_logout(req: &HttpRequest) -> HttpResponse {
    if let Some(session_key) = extract_ii_session(req) {
        let revoked = revoke_session(&session_key);
        if revoked {
            let response = json!({
                "status": "success",
                "message": "Session revoked successfully"
            });
            success_response(&response, 200)
        } else {
            error_response(404, "Session not found")
        }
    } else {
        error_response(400, "No session to revoke")
    }
}

async fn handle_semantic_search(req: &HttpRequest, user: candid::Principal) -> HttpResponse {
    #[derive(serde::Deserialize)]
    struct SearchRequest {
        query: String,
        limit: Option<usize>,
        tags: Option<Vec<String>>,
    }
    
    let search_req: SearchRequest = match serde_json::from_slice(&req.body) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };
    
    if search_req.query.trim().is_empty() {
        return error_response(400, "Query cannot be empty");
    }
    
    let limit = search_req.limit.unwrap_or(10).min(100); // Max 100 results
    
    match crate::search::generate_embedding_and_search(
        &search_req.query, 
        limit, 
        Some(user), // Filter by user
        search_req.tags
    ).await {
        Ok(results) => {
            // Record search for suggestions
            crate::suggestions::SuggestionsEngine::record_search(
                user,
                &search_req.query,
                results.len()
            );
            
            let response = SearchResponse {
                results,
                total_count: 0, // TODO: Implement proper counting
                query_time_ms: 0, // TODO: Add timing
            };
            success_response(&response, 200)
        }
        Err(e) => error_response(500, &format!("Search failed: {}", e)),
    }
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
        "query": query,
        "count": suggestions.len()
    });
    
    success_response(&response, 200)
}

fn handle_get_clusters(req: &HttpRequest) -> HttpResponse {
    let _query_params = parse_query_params(&req.url);
    
    // Extract user from headers if available
    let user = extract_bearer_token(&req.headers)
        .and_then(|token| {
            futures::executor::block_on(async {
                crate::auth::verify_token(&token).await.ok()
            })
        });
    
    if let Some(user_id) = user {
        let clusters = crate::clustering::ClusteringEngine::get_user_clusters(user_id);
        
        let response = json!({
            "clusters": clusters,
            "count": clusters.len(),
            "user_id": user_id.to_string()
        });
        
        success_response(&response, 200)
    } else {
        error_response(401, "Authentication required")
    }
}

fn handle_get_categories() -> HttpResponse {
    // Return predefined categories
    let categories = vec![
        json!({
            "id": "tech",
            "name": "Technology",
            "description": "Technical information, programming, software, and tech concepts"
        }),
        json!({
            "id": "business", 
            "name": "Business",
            "description": "Business concepts, strategy, management, and professional topics"
        }),
        json!({
            "id": "personal",
            "name": "Personal", 
            "description": "Personal notes, thoughts, experiences, and private information"
        }),
        json!({
            "id": "reference",
            "name": "Reference",
            "description": "Reference materials, documentation, and factual information"
        })
    ];
    
    let response = json!({
        "categories": categories,
        "count": categories.len()
    });
    
    success_response(&response, 200)
}

async fn handle_create_cluster(req: &HttpRequest, user: candid::Principal) -> HttpResponse {
    #[derive(serde::Deserialize)]
    struct CreateClusterRequest {
        memory_ids: Vec<String>,
        method: Option<String>,
        k: Option<usize>,
        time_period: Option<String>,
        name: Option<String>,
        description: Option<String>,
    }
    
    let cluster_req: CreateClusterRequest = match serde_json::from_slice(&req.body) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format!("Invalid JSON: {}", e)),
    };
    
    if cluster_req.memory_ids.is_empty() {
        return error_response(400, "At least one memory ID is required");
    }
    
    let method = cluster_req.method.unwrap_or_else(|| "content".to_string());
    
    let clustering_result = match method.as_str() {
        "kmeans" => {
            let k = cluster_req.k.unwrap_or(3);
            crate::clustering::ClusteringEngine::cluster_memories_kmeans(
                user,
                cluster_req.memory_ids,
                k
            )
        },
        "content" => {
            crate::clustering::ClusteringEngine::cluster_by_content(
                user,
                cluster_req.memory_ids
            )
        },
        "tags" => {
            crate::clustering::ClusteringEngine::cluster_by_tags(
                user,
                cluster_req.memory_ids
            )
        },
        "time" => {
            let time_period = match cluster_req.time_period.as_deref() {
                Some("day") => crate::clustering::TimePeriod::Day,
                Some("week") => crate::clustering::TimePeriod::Week,
                Some("month") => crate::clustering::TimePeriod::Month,
                Some("year") => crate::clustering::TimePeriod::Year,
                _ => crate::clustering::TimePeriod::Week,
            };
            crate::clustering::ClusteringEngine::cluster_by_time(
                user,
                cluster_req.memory_ids,
                time_period
            )
        },
        _ => {
            return error_response(400, "Invalid clustering method. Use: kmeans, content, tags, or time");
        }
    };
    
    match clustering_result {
        Ok(result) => {
            // Store the clusters
            for cluster in &result.clusters {
                if let Err(e) = crate::clustering::ClusteringEngine::store_cluster(cluster.clone()) {
                    ic_cdk::println!("Failed to store cluster: {}", e);
                }
            }
            
            let response = json!({
                "status": "success",
                "clusters": result.clusters,
                "unclustered_memories": result.unclustered_memories,
                "clustering_score": result.clustering_score,
                "method_used": result.method_used,
                "message": format!("Created {} clusters using {} method", result.clusters.len(), method)
            });
            
            success_response(&response, 201)
        },
        Err(e) => error_response(500, &format!("Clustering failed: {}", e))
    }
}