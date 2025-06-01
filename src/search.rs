use crate::types::*;
use crate::storage::*;
use candid::Principal;

// This module will contain embedding-based search functionality
// For now, it provides a placeholder for future vector search implementation

pub async fn semantic_search(
    query_embedding: Vec<f32>,
    limit: usize,
    user_filter: Option<Principal>,
    tags: Option<Vec<String>>,
) -> Result<Vec<SearchResult>, String> {
    // Use advanced vector store for semantic search
    let similar_ids = crate::vector_store::AdvancedVectorStore::search_similar(
        &query_embedding, 
        limit * 2, // Get more results to filter by user/tags
        None
    )?;
    
    let mut results = Vec::new();
    
    for (memory_id, similarity_score) in similar_ids {
        // Get memory details
        if let Ok(Some(memory)) = crate::storage::get_memory(&memory_id) {
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
            
            // Calculate enhanced relevance score
            let enhanced_score = calculate_relevance_score(&memory, "", similarity_score);
            
            results.push(SearchResult {
                memory,
                similarity_score: enhanced_score,
            });
            
            // Stop when we have enough results
            if results.len() >= limit {
                break;
            }
        }
    }
    
    Ok(results)
}

pub async fn generate_embedding_and_search(
    query: &str,
    limit: usize,
    user_filter: Option<Principal>,
    tags: Option<Vec<String>>,
) -> Result<Vec<SearchResult>, String> {
    // Generate embedding for query
    match crate::embedding::generate_embedding(query).await {
        Ok(query_embedding) => {
            // Perform semantic search
            semantic_search(query_embedding, limit, user_filter, tags).await
        }
        Err(e) => {
            ic_cdk::println!("Failed to generate embedding for search: {}", e);
            // Fallback to simple text search
            crate::storage::search_memories_simple(query, limit, tags, user_filter)
        }
    }
}

pub async fn generate_query_embedding(query: &str) -> Result<Vec<f32>, String> {
    // TODO: Implement OpenAI API call to generate embeddings
    // This will be implemented in the embedding module
    Err(format!("Embedding generation not implemented yet for query: {}", query))
}

// Placeholder for vector store operations
pub struct VectorStore {
    // TODO: Integrate IC-Vectune
}

impl VectorStore {
    pub fn new() -> Result<Self, String> {
        // TODO: Initialize IC-Vectune vector store
        Err("Vector store not implemented yet".to_string())
    }
    
    pub fn add_vector(&mut self, _id: String, _embedding: Vec<f32>) -> Result<(), String> {
        // TODO: Add vector to IC-Vectune store
        Ok(())
    }
    
    pub fn remove_vector(&mut self, _id: &str) -> Result<(), String> {
        // TODO: Remove vector from IC-Vectune store
        Ok(())
    }
    
    pub fn search(&self, _query_embedding: &[f32], _limit: usize, _threshold: f32) -> Vec<(String, f32)> {
        // TODO: Perform vector similarity search
        Vec::new()
    }
    
    pub fn get_vector_count(&self) -> usize {
        // TODO: Return vector count from IC-Vectune
        0
    }
}

// Search relevance scoring
pub fn calculate_relevance_score(
    memory: &Memory,
    query: &str,
    similarity_score: f32,
) -> f32 {
    let mut score = similarity_score;
    
    // Boost score based on metadata matches
    let query_lower = query.to_lowercase();
    for (key, value) in &memory.metadata {
        if key.to_lowercase().contains(&query_lower) || 
           value.to_lowercase().contains(&query_lower) {
            score += 0.1;
        }
    }
    
    // Boost score based on tag matches
    for tag in &memory.tags {
        if tag.to_lowercase().contains(&query_lower) {
            score += 0.2;
        }
    }
    
    // Recency boost (newer memories get slight boost)
    let age_factor = calculate_recency_factor(memory.created_at);
    score *= age_factor;
    
    // Ensure score doesn't exceed 1.0
    score.min(1.0)
}

fn calculate_recency_factor(created_at: u64) -> f32 {
    let current_time = ic_cdk::api::time();
    let age_seconds = (current_time - created_at) / 1_000_000_000;
    
    // Give a small boost to newer memories
    // Memories older than 30 days get no boost
    const THIRTY_DAYS: u64 = 30 * 24 * 60 * 60;
    
    if age_seconds <= THIRTY_DAYS {
        1.0 + (0.1 * (1.0 - (age_seconds as f32 / THIRTY_DAYS as f32)))
    } else {
        1.0
    }
}

// Query preprocessing
pub fn preprocess_query(query: &str) -> String {
    query
        .trim()
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
}

// Advanced search filters
pub struct SearchFilters {
    pub user_filter: Option<Principal>,
    pub tags: Option<Vec<String>>,
    pub metadata_filters: Option<HashMap<String, String>>,
    pub date_range: Option<(u64, u64)>, // (start, end) timestamps
    pub min_similarity: Option<f32>,
}

pub fn apply_search_filters(
    memories: Vec<SearchResult>,
    filters: &SearchFilters,
) -> Vec<SearchResult> {
    memories
        .into_iter()
        .filter(|result| {
            // Apply user filter
            if let Some(user) = filters.user_filter {
                if result.memory.user_id != user {
                    return false;
                }
            }
            
            // Apply tag filter
            if let Some(ref required_tags) = filters.tags {
                let has_required_tags = required_tags.iter().any(|tag| {
                    result.memory.tags.iter().any(|memory_tag| 
                        memory_tag.to_lowercase().contains(&tag.to_lowercase())
                    )
                });
                if !has_required_tags {
                    return false;
                }
            }
            
            // Apply metadata filters
            if let Some(ref metadata_filters) = filters.metadata_filters {
                for (key, value) in metadata_filters {
                    if let Some(memory_value) = result.memory.metadata.get(key) {
                        if !memory_value.to_lowercase().contains(&value.to_lowercase()) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
            
            // Apply date range filter
            if let Some((start, end)) = filters.date_range {
                if result.memory.created_at < start || result.memory.created_at > end {
                    return false;
                }
            }
            
            // Apply minimum similarity filter
            if let Some(min_sim) = filters.min_similarity {
                if result.similarity_score < min_sim {
                    return false;
                }
            }
            
            true
        })
        .collect()
}

use std::collections::HashMap;

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_preprocess_query() {
        assert_eq!(preprocess_query("  Hello, World!  "), "hello world");
        assert_eq!(preprocess_query("Test@#$%Query"), "testquery");
        assert_eq!(preprocess_query("multiple   spaces"), "multiple spaces");
    }
    
    #[test]
    fn test_calculate_recency_factor() {
        let current_time = ic_cdk::api::time();
        
        // Recent memory should get a boost
        let recent_time = current_time - (5 * 24 * 60 * 60 * 1_000_000_000); // 5 days ago
        assert!(calculate_recency_factor(recent_time) > 1.0);
        
        // Old memory should get no boost
        let old_time = current_time - (35 * 24 * 60 * 60 * 1_000_000_000); // 35 days ago
        assert_eq!(calculate_recency_factor(old_time), 1.0);
    }
}