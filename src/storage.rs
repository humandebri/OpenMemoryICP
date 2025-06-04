use crate::types::*;
use candid::Principal;
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl, memory_manager::{MemoryId, MemoryManager, VirtualMemory}};
use std::cell::RefCell;

// Memory management using IC's stable structures with unique memory IDs
type VMem = VirtualMemory<DefaultMemoryImpl>;
type MemoryMap = StableBTreeMap<String, crate::types::Memory, VMem>;
type UserMemoryMap = StableBTreeMap<Principal, UserMemoryList, VMem>;
type ConversationMap = StableBTreeMap<String, Conversation, VMem>;
type UserConversationMap = StableBTreeMap<Principal, UserConversationList, VMem>;
type UserConfigMap = StableBTreeMap<Principal, UserConfig, VMem>;
type AccessTokenMap = StableBTreeMap<String, AccessToken, VMem>;

const MEMORY_ID_MEMORIES: MemoryId = MemoryId::new(0);
const MEMORY_ID_USER_MEMORIES: MemoryId = MemoryId::new(1);  
const MEMORY_ID_CONVERSATIONS: MemoryId = MemoryId::new(2);
const MEMORY_ID_USER_CONVERSATIONS: MemoryId = MemoryId::new(3);
const MEMORY_ID_USER_CONFIG: MemoryId = MemoryId::new(4);
const MEMORY_ID_ACCESS_TOKENS: MemoryId = MemoryId::new(5);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static MEMORIES: RefCell<Option<MemoryMap>> = RefCell::new(None);
    static USER_MEMORIES: RefCell<Option<UserMemoryMap>> = RefCell::new(None);
    static CONVERSATIONS: RefCell<Option<ConversationMap>> = RefCell::new(None);
    static USER_CONVERSATIONS: RefCell<Option<UserConversationMap>> = RefCell::new(None);
    static USER_CONFIG: RefCell<Option<UserConfigMap>> = RefCell::new(None);
    static ACCESS_TOKENS: RefCell<Option<AccessTokenMap>> = RefCell::new(None);
    static STORAGE_INITIALIZED: RefCell<bool> = RefCell::new(false);
}

pub async fn init_storage() {
    MEMORY_MANAGER.with(|mm| {
        let memory_manager = mm.borrow();
        
        MEMORIES.with(|m| {
            *m.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_MEMORIES)));
        });
        
        USER_MEMORIES.with(|um| {
            *um.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_USER_MEMORIES)));
        });
        
        CONVERSATIONS.with(|c| {
            *c.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_CONVERSATIONS)));
        });
        
        USER_CONVERSATIONS.with(|uc| {
            *uc.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_USER_CONVERSATIONS)));
        });
        
        USER_CONFIG.with(|config| {
            *config.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_USER_CONFIG)));
        });
        
        ACCESS_TOKENS.with(|tokens| {
            *tokens.borrow_mut() = Some(StableBTreeMap::init(memory_manager.get(MEMORY_ID_ACCESS_TOKENS)));
        });
    });
    
    STORAGE_INITIALIZED.with(|init| {
        *init.borrow_mut() = true;
    });
    
    ic_cdk::println!("Storage initialized successfully");
}

pub fn pre_upgrade() {
    // Stable structures automatically handle pre-upgrade persistence
    ic_cdk::println!("Pre-upgrade: Storage data will be preserved");
}

pub async fn post_upgrade() {
    // Reinitialize the storage structures after upgrade
    init_storage().await;
    ic_cdk::println!("Post-upgrade: Storage restored");
}

pub async fn store_memory(memory: crate::types::Memory) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let memory_id = memory.id.clone();
    let user_id = memory.user_id;
    
    // Store the memory
    MEMORIES.with(|m| {
        if let Some(ref mut memories) = *m.borrow_mut() {
            memories.insert(memory_id.clone(), memory.clone());
            Ok(())
        } else {
            Err("Memory storage not available".to_string())
        }
    })?;
    
    // Add to vector store if embedding exists
    if !memory.embedding.is_empty() {
        if let Err(e) = crate::vector_store::AdvancedVectorStore::add_vector(
            memory_id.clone(), 
            memory.embedding.clone()
        ) {
            ic_cdk::println!("Failed to add vector to store: {}", e);
            // Continue anyway - memory is still stored even if vector indexing fails
        }
    }
    
    // Update user's memory index
    USER_MEMORIES.with(|um| {
        if let Some(ref mut user_memories) = *um.borrow_mut() {
            let mut user_memory_list = user_memories.get(&user_id).unwrap_or_default();
            if !user_memory_list.0.contains(&memory_id) {
                user_memory_list.0.push(memory_id.clone());
                user_memories.insert(user_id, user_memory_list);
            }
            Ok(())
        } else {
            Err("User memory index not available".to_string())
        }
    })?;
    
    // Index memory content for suggestions
    crate::suggestions::SuggestionsEngine::index_memory_content(&memory);
    
    ic_cdk::println!("Memory stored successfully: {}", memory_id);
    Ok(())
}

pub fn store_memory_sync(memory: crate::types::Memory) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let memory_id = memory.id.clone();
    
    // Store in main memory map
    MEMORIES.with(|m| {
        if let Some(ref mut memories) = *m.borrow_mut() {
            memories.insert(memory.id.clone(), memory.clone());
        } else {
            return Err("Memory storage not available".to_string());
        }
        Ok(())
    })?;
    
    // Store in user memory map
    USER_MEMORIES.with(|um| {
        if let Some(ref mut user_memories) = *um.borrow_mut() {
            // Get or create user memory list
            let mut user_memory_list = user_memories.get(&memory.user_id).unwrap_or_default();
            user_memory_list.0.push(memory.id.clone());
            user_memories.insert(memory.user_id, user_memory_list);
        } else {
            return Err("User memory storage not available".to_string());
        }
        Ok(())
    })?;
    
    // Update suggestions engine
    crate::suggestions::SuggestionsEngine::index_memory_content(&memory);
    
    ic_cdk::println!("Memory stored synchronously: {}", memory_id);
    Ok(())
}

pub fn get_memory(id: &str) -> Result<Option<crate::types::Memory>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    MEMORIES.with(|m| {
        if let Some(ref memories) = *m.borrow() {
            Ok(memories.get(&id.to_string()))
        } else {
            Err("Memory storage not available".to_string())
        }
    })
}

pub async fn delete_memory(id: &str, user_id: Principal) -> Result<bool, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    // First, check if the memory exists and user has permission
    let memory = match get_memory(id)? {
        Some(memory) => memory,
        None => return Ok(false), // Memory doesn't exist
    };
    
    if memory.user_id != user_id {
        return Err("Permission denied".to_string());
    }
    
    // Remove from memory storage
    let removed = MEMORIES.with(|m| {
        if let Some(ref mut memories) = *m.borrow_mut() {
            memories.remove(&id.to_string()).is_some()
        } else {
            false
        }
    });
    
    if removed {
        // Remove from vector store
        if let Err(e) = crate::vector_store::AdvancedVectorStore::remove_vector(id) {
            ic_cdk::println!("Failed to remove vector from store: {}", e);
        }
        
        // Remove from user's memory index
        USER_MEMORIES.with(|um| {
            if let Some(ref mut user_memories) = *um.borrow_mut() {
                if let Some(mut user_memory_list) = user_memories.get(&user_id) {
                    user_memory_list.0.retain(|mid| mid != id);
                    user_memories.insert(user_id, user_memory_list);
                }
            }
        });
        
        ic_cdk::println!("Memory deleted successfully: {}", id);
    }
    
    Ok(removed)
}

pub fn list_memories(offset: usize, limit: usize, user_filter: Option<Principal>) -> Result<Vec<crate::types::Memory>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let mut memories = Vec::new();
    
    MEMORIES.with(|m| {
        if let Some(ref memory_map) = *m.borrow() {
            let mut count = 0;
            let mut skipped = 0;
            
            for (_, memory) in memory_map.iter() {
                // Apply user filter if specified
                if let Some(user) = user_filter {
                    if memory.user_id != user {
                        continue;
                    }
                }
                
                // Skip items for pagination
                if skipped < offset {
                    skipped += 1;
                    continue;
                }
                
                // Add to results
                memories.push(memory);
                count += 1;
                
                // Stop when limit is reached
                if count >= limit {
                    break;
                }
            }
        }
    });
    
    // Sort by creation time (newest first)
    memories.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(memories)
}

pub fn list_user_memories(user_id: Principal, offset: usize, limit: usize) -> Result<Vec<crate::types::Memory>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    USER_MEMORIES.with(|um| {
        if let Some(ref user_memories) = *um.borrow() {
            if let Some(memory_list) = user_memories.get(&user_id) {
                let mut memories = Vec::new();
                
                MEMORIES.with(|m| {
                    if let Some(ref memory_map) = *m.borrow() {
                        for id in memory_list.0.iter().skip(offset).take(limit) {
                            if let Some(memory) = memory_map.get(id) {
                                memories.push(memory);
                            }
                        }
                    }
                });
                
                // Sort by creation time (newest first)
                memories.sort_by(|a, b| b.created_at.cmp(&a.created_at));
                Ok(memories)
            } else {
                Ok(Vec::new())
            }
        } else {
            Err("User memory index not available".to_string())
        }
    })
}

// Simple text search (without embeddings for now)
pub fn search_memories_simple(
    query: &str, 
    limit: usize, 
    tags: Option<Vec<String>>, 
    user_filter: Option<Principal>
) -> Result<Vec<SearchResult>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();
    
    MEMORIES.with(|m| {
        if let Some(ref memory_map) = *m.borrow() {
            for (_, memory) in memory_map.iter() {
                // Apply user filter
                if let Some(user) = user_filter {
                    if memory.user_id != user {
                        continue;
                    }
                }
                
                // Apply tag filter
                if let Some(ref required_tags) = tags {
                    let has_required_tags = required_tags.iter().any(|tag| {
                        memory.tags.iter().any(|memory_tag| 
                            memory_tag.to_lowercase().contains(&tag.to_lowercase())
                        )
                    });
                    if !has_required_tags {
                        continue;
                    }
                }
                
                // Simple text matching
                let content_lower = memory.content.to_lowercase();
                if content_lower.contains(&query_lower) {
                    // Calculate a simple similarity score based on content match
                    let similarity_score = calculate_simple_similarity(&query_lower, &content_lower);
                    
                    results.push(SearchResult {
                        memory,
                        similarity_score,
                    });
                }
            }
        }
    });
    
    // Sort by similarity score (highest first)
    results.sort_by(|a, b| b.similarity_score.partial_cmp(&a.similarity_score).unwrap_or(std::cmp::Ordering::Equal));
    
    // Limit results
    results.truncate(limit);
    
    Ok(results)
}

fn calculate_simple_similarity(query: &str, content: &str) -> f32 {
    let query_words: Vec<&str> = query.split_whitespace().collect();
    let content_words: Vec<&str> = content.split_whitespace().collect();
    
    let mut matches = 0;
    for query_word in &query_words {
        if content_words.iter().any(|word| word.contains(query_word)) {
            matches += 1;
        }
    }
    
    if query_words.is_empty() {
        0.0
    } else {
        matches as f32 / query_words.len() as f32
    }
}

// Statistics functions
pub fn get_memory_count() -> usize {
    if !is_storage_initialized() {
        return 0;
    }
    
    MEMORIES.with(|m| {
        if let Some(ref memories) = *m.borrow() {
            memories.len() as usize
        } else {
            0
        }
    })
}

pub fn get_user_count() -> usize {
    if !is_storage_initialized() {
        return 0;
    }
    
    USER_MEMORIES.with(|um| {
        if let Some(ref user_memories) = *um.borrow() {
            user_memories.len() as usize
        } else {
            0
        }
    })
}

pub fn get_avg_memory_size() -> f64 {
    if !is_storage_initialized() {
        return 0.0;
    }
    
    let mut total_size = 0;
    let mut count = 0;
    
    MEMORIES.with(|m| {
        if let Some(ref memories) = *m.borrow() {
            for (_, memory) in memories.iter() {
                total_size += memory.content.len();
                count += 1;
            }
        }
    });
    
    if count > 0 {
        total_size as f64 / count as f64
    } else {
        0.0
    }
}

pub fn get_uptime_seconds() -> u64 {
    // This is a simplified implementation
    // In a real implementation, you'd track the canister's start time
    ic_cdk::api::time() / 1_000_000_000 // Convert nanoseconds to seconds
}

fn is_storage_initialized() -> bool {
    STORAGE_INITIALIZED.with(|init| *init.borrow())
}

pub fn count_memories_with_tag(tag: &str) -> Result<usize, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let mut count = 0;
    
    MEMORIES.with(|m| {
        if let Some(ref memories) = *m.borrow() {
            for (_, memory) in memories.iter() {
                if memory.tags.contains(&tag.to_string()) {
                    count += 1;
                }
            }
        }
    });
    
    Ok(count)
}

// Conversation storage functions
pub async fn save_conversation(conversation: Conversation) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let conversation_id = conversation.id.clone();
    let user_id = conversation.user_id;
    
    // Store the conversation
    CONVERSATIONS.with(|c| {
        if let Some(ref mut conversations) = *c.borrow_mut() {
            conversations.insert(conversation_id.clone(), conversation.clone());
            Ok(())
        } else {
            Err("Conversation storage not available".to_string())
        }
    })?;
    
    // Add to user's conversation index
    USER_CONVERSATIONS.with(|uc| {
        if let Some(ref mut user_conversations) = *uc.borrow_mut() {
            let mut conversation_list = user_conversations
                .get(&user_id)
                .unwrap_or_else(|| UserConversationList(Vec::new()));
            
            conversation_list.0.push(conversation_id.clone());
            user_conversations.insert(user_id, conversation_list);
        }
    });
    
    ic_cdk::println!("Conversation saved successfully: {}", conversation_id);
    Ok(())
}

pub fn get_conversation(id: &str) -> Result<Option<Conversation>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    CONVERSATIONS.with(|c| {
        if let Some(ref conversations) = *c.borrow() {
            Ok(conversations.get(&id.to_string()))
        } else {
            Err("Conversation storage not available".to_string())
        }
    })
}

pub fn get_user_conversations(user_id: Principal, limit: usize, offset: usize) -> Result<Vec<Conversation>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    USER_CONVERSATIONS.with(|uc| {
        if let Some(ref user_conversations) = *uc.borrow() {
            if let Some(conversation_list) = user_conversations.get(&user_id) {
                let mut conversations = Vec::new();
                
                CONVERSATIONS.with(|c| {
                    if let Some(ref conversation_map) = *c.borrow() {
                        for id in conversation_list.0.iter().skip(offset).take(limit) {
                            if let Some(conversation) = conversation_map.get(id) {
                                conversations.push(conversation);
                            }
                        }
                    }
                });
                
                // Sort by creation time (newest first)
                conversations.sort_by(|a, b| b.created_at.cmp(&a.created_at));
                Ok(conversations)
            } else {
                Ok(Vec::new())
            }
        } else {
            Err("User conversation index not available".to_string())
        }
    })
}

// User configuration functions
pub fn save_user_config(user_id: Principal, openai_api_key: String) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let timestamp = ic_cdk::api::time();
    
    // Get existing config or create new one
    let mut config = get_user_config(user_id)?.unwrap_or_else(|| UserConfig {
        user_id,
        openai_api_key: None,
        openrouter_api_key: None,
        api_provider: crate::types::ApiProvider::OpenAI,
        embedding_model: "text-embedding-ada-002".to_string(),
        created_at: timestamp,
        updated_at: timestamp,
    });
    
    config.openai_api_key = Some(openai_api_key);
    config.updated_at = timestamp;
    
    USER_CONFIG.with(|uc| {
        if let Some(ref mut user_config) = *uc.borrow_mut() {
            user_config.insert(user_id, config);
            Ok(())
        } else {
            Err("User config storage not available".to_string())
        }
    })?;
    
    ic_cdk::println!("User config saved for user: {}", user_id);
    Ok(())
}

pub fn get_user_config(user_id: Principal) -> Result<Option<UserConfig>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let result = USER_CONFIG.with(|uc| {
        if let Some(ref user_config) = *uc.borrow() {
            Ok(user_config.get(&user_id))
        } else {
            Err("User config storage not available".to_string())
        }
    })?;
    
    Ok(result)
}

pub fn get_user_openai_key(user_id: Principal) -> Option<String> {
    match get_user_config(user_id) {
        Ok(Some(config)) => config.openai_api_key,
        _ => None,
    }
}

pub fn delete_user_openai_key(user_id: Principal) -> Result<bool, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let result = USER_CONFIG.with(|uc| {
        if let Some(ref mut user_config) = *uc.borrow_mut() {
            if let Some(mut config) = user_config.get(&user_id) {
                config.openai_api_key = None;
                config.updated_at = ic_cdk::api::time();
                user_config.insert(user_id, config);
                Ok(true)
            } else {
                Ok(false)
            }
        } else {
            Err("User config storage not available".to_string())
        }
    })?;
    
    ic_cdk::println!("OpenAI API key deleted for user: {}", user_id);
    Ok(result)
}

// New comprehensive config update function
pub fn update_user_config(
    user_id: Principal, 
    openai_key: Option<String>,
    openrouter_key: Option<String>,
    provider: Option<crate::types::ApiProvider>,
    model: Option<String>
) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let timestamp = ic_cdk::api::time();
    
    // Get existing config or create new one
    let mut config = get_user_config(user_id)?.unwrap_or_else(|| UserConfig {
        user_id,
        openai_api_key: None,
        openrouter_api_key: None,
        api_provider: crate::types::ApiProvider::OpenAI,
        embedding_model: "text-embedding-ada-002".to_string(),
        created_at: timestamp,
        updated_at: timestamp,
    });
    
    // Update fields if provided
    if let Some(key) = openai_key {
        config.openai_api_key = Some(key);
    }
    if let Some(key) = openrouter_key {
        config.openrouter_api_key = Some(key);
    }
    if let Some(p) = provider {
        config.api_provider = p;
    }
    if let Some(m) = model {
        config.embedding_model = m;
    }
    
    config.updated_at = timestamp;
    
    USER_CONFIG.with(|uc| {
        if let Some(ref mut user_config) = *uc.borrow_mut() {
            user_config.insert(user_id, config);
            Ok(())
        } else {
            Err("User config storage not available".to_string())
        }
    })?;
    
    ic_cdk::println!("User config updated for user: {}", user_id);
    Ok(())
}

// Get available models based on provider
pub fn get_available_models(provider: &crate::types::ApiProvider) -> Vec<crate::types::ModelInfo> {
    match provider {
        crate::types::ApiProvider::OpenAI => vec![
            crate::types::ModelInfo {
                id: "text-embedding-ada-002".to_string(),
                name: "text-embedding-ada-002".to_string(),
                provider: "OpenAI".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.0001,
                    completion: 0.0001,
                }),
            },
            crate::types::ModelInfo {
                id: "text-embedding-3-small".to_string(),
                name: "text-embedding-3-small".to_string(),
                provider: "OpenAI".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.00002,
                    completion: 0.00002,
                }),
            },
            crate::types::ModelInfo {
                id: "text-embedding-3-large".to_string(),
                name: "text-embedding-3-large".to_string(),
                provider: "OpenAI".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.00013,
                    completion: 0.00013,
                }),
            },
        ],
        crate::types::ApiProvider::OpenRouter => vec![
            crate::types::ModelInfo {
                id: "text-embedding-ada-002".to_string(),
                name: "OpenAI: text-embedding-ada-002".to_string(),
                provider: "OpenRouter".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.0001,
                    completion: 0.0001,
                }),
            },
            crate::types::ModelInfo {
                id: "text-embedding-3-small".to_string(),
                name: "OpenAI: text-embedding-3-small".to_string(),
                provider: "OpenRouter".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.00002,
                    completion: 0.00002,
                }),
            },
            crate::types::ModelInfo {
                id: "text-embedding-3-large".to_string(),
                name: "OpenAI: text-embedding-3-large".to_string(),
                provider: "OpenRouter".to_string(),
                context_length: 8191,
                pricing: Some(crate::types::ModelPricing {
                    prompt: 0.00013,
                    completion: 0.00013,
                }),
            },
        ],
    }
}

// Access Token Management Functions
pub fn create_access_token(
    owner_principal: Principal,
    description: Option<String>,
    permissions: Vec<Permission>,
    expires_in_days: u32,
) -> Result<AccessToken, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let timestamp = ic_cdk::api::time();
    let expires_at = timestamp + (expires_in_days as u64 * 24 * 60 * 60 * 1_000_000_000);
    
    // Generate secure token
    let token = format!("om_token_{}", crate::utils::generate_uuid());
    
    let access_token = AccessToken {
        token: token.clone(),
        owner_principal,
        issued_to: description,
        permissions,
        expires_at,
        created_at: timestamp,
        last_used_at: None,
    };
    
    ACCESS_TOKENS.with(|tokens| {
        if let Some(ref mut token_map) = *tokens.borrow_mut() {
            token_map.insert(token.clone(), access_token.clone());
            Ok(access_token)
        } else {
            Err("Access token storage not available".to_string())
        }
    })
}

pub fn verify_access_token(token: &str) -> Result<Principal, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    ACCESS_TOKENS.with(|tokens| {
        if let Some(ref mut token_map) = *tokens.borrow_mut() {
            if let Some(mut access_token) = token_map.get(token) {
                let current_time = ic_cdk::api::time();
                
                // Check if token is expired
                if current_time > access_token.expires_at {
                    // Remove expired token
                    token_map.remove(token);
                    return Err("Token expired".to_string());
                }
                
                // Update last used time
                access_token.last_used_at = Some(current_time);
                token_map.insert(token.to_string(), access_token.clone());
                
                Ok(access_token.owner_principal)
            } else {
                Err("Invalid token".to_string())
            }
        } else {
            Err("Access token storage not available".to_string())
        }
    })
}

pub fn get_user_tokens(user_principal: Principal) -> Result<Vec<TokenInfo>, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    ACCESS_TOKENS.with(|tokens| {
        if let Some(ref token_map) = *tokens.borrow() {
            let mut user_tokens = Vec::new();
            
            for (_, token) in token_map.iter() {
                if token.owner_principal == user_principal {
                    user_tokens.push(TokenInfo {
                        description: token.issued_to.clone(),
                        permissions: token.permissions.clone(),
                        expires_at: token.expires_at,
                        created_at: token.created_at,
                        last_used_at: token.last_used_at,
                    });
                }
            }
            
            Ok(user_tokens)
        } else {
            Err("Access token storage not available".to_string())
        }
    })
}

pub fn revoke_access_token(token: &str, user_principal: Principal) -> Result<bool, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    ACCESS_TOKENS.with(|tokens| {
        if let Some(ref mut token_map) = *tokens.borrow_mut() {
            if let Some(access_token) = token_map.get(token) {
                // Check if user owns this token
                if access_token.owner_principal == user_principal {
                    token_map.remove(token);
                    Ok(true)
                } else {
                    Err("Unauthorized to revoke this token".to_string())
                }
            } else {
                Ok(false) // Token doesn't exist
            }
        } else {
            Err("Access token storage not available".to_string())
        }
    })
}

pub fn cleanup_expired_tokens() -> Result<usize, String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let current_time = ic_cdk::api::time();
    let mut removed_count = 0;
    
    ACCESS_TOKENS.with(|tokens| {
        if let Some(ref mut token_map) = *tokens.borrow_mut() {
            let expired_tokens: Vec<String> = token_map
                .iter()
                .filter(|(_, token)| current_time > token.expires_at)
                .map(|(token_id, _)| token_id)
                .collect();
            
            for token_id in expired_tokens {
                token_map.remove(&token_id);
                removed_count += 1;
            }
            
            Ok(removed_count)
        } else {
            Err("Access token storage not available".to_string())
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_simple_similarity() {
        assert_eq!(calculate_simple_similarity("hello world", "hello world"), 1.0);
        assert_eq!(calculate_simple_similarity("hello", "hello world"), 1.0);
        assert_eq!(calculate_simple_similarity("hello world", "hello"), 0.5);
        assert_eq!(calculate_simple_similarity("", "hello world"), 0.0);
        assert_eq!(calculate_simple_similarity("xyz", "hello world"), 0.0);
    }
}