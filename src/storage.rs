use crate::types::*;
use candid::Principal;
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl};
use std::cell::RefCell;

// Memory management using IC's stable structures
type MemoryId = DefaultMemoryImpl;
type MemoryMap = StableBTreeMap<String, Memory, MemoryId>;
type UserMemoryMap = StableBTreeMap<Principal, UserMemoryList, MemoryId>;

thread_local! {
    static MEMORIES: RefCell<Option<MemoryMap>> = RefCell::new(None);
    static USER_MEMORIES: RefCell<Option<UserMemoryMap>> = RefCell::new(None);
    static STORAGE_INITIALIZED: RefCell<bool> = RefCell::new(false);
}

pub async fn init_storage() {
    MEMORIES.with(|m| {
        *m.borrow_mut() = Some(StableBTreeMap::init(DefaultMemoryImpl::default()));
    });
    
    USER_MEMORIES.with(|um| {
        *um.borrow_mut() = Some(StableBTreeMap::init(DefaultMemoryImpl::default()));
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

pub async fn store_memory(memory: Memory) -> Result<(), String> {
    if !is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let memory_id = memory.id.clone();
    let user_id = memory.user_id;
    
    // Store the memory
    MEMORIES.with(|m| {
        if let Some(ref mut memories) = *m.borrow_mut() {
            memories.insert(memory_id.clone(), memory);
            Ok(())
        } else {
            Err("Memory storage not available".to_string())
        }
    })?;
    
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
    
    ic_cdk::println!("Memory stored successfully: {}", memory_id);
    Ok(())
}

pub fn get_memory(id: &str) -> Result<Option<Memory>, String> {
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

pub fn list_memories(offset: usize, limit: usize, user_filter: Option<Principal>) -> Result<Vec<Memory>, String> {
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

pub fn list_user_memories(user_id: Principal, offset: usize, limit: usize) -> Result<Vec<Memory>, String> {
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