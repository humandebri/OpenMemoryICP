use crate::types::*;
use crate::storage::*;
use std::collections::{HashMap, HashSet};
use std::cell::RefCell;
use candid::Principal;

// Real-time search suggestions system
thread_local! {
    static SEARCH_HISTORY: RefCell<HashMap<Principal, Vec<SearchQuery>>> = RefCell::new(HashMap::new());
    static POPULAR_QUERIES: RefCell<Vec<PopularQuery>> = RefCell::new(Vec::new());
    static TAG_SUGGESTIONS: RefCell<HashSet<String>> = RefCell::new(HashSet::new());
    static CONTENT_KEYWORDS: RefCell<HashMap<String, u32>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug)]
pub struct SearchQuery {
    pub query: String,
    pub timestamp: u64,
    pub result_count: usize,
    pub clicked_results: Vec<String>, // Memory IDs that were clicked
}

#[derive(Clone, Debug)]
pub struct PopularQuery {
    pub query: String,
    pub search_count: u32,
    pub avg_result_count: f32,
    pub last_searched: u64,
}

#[derive(serde::Serialize)]
pub struct SearchSuggestion {
    pub text: String,
    pub suggestion_type: SuggestionType,
    pub score: f32,
    pub metadata: HashMap<String, String>,
}

#[derive(serde::Serialize)]
pub enum SuggestionType {
    RecentSearch,
    PopularQuery,
    TagSuggestion,
    ContentKeyword,
    AutoComplete,
    Similar,
}

// Real-time suggestions engine
pub struct SuggestionsEngine;

impl SuggestionsEngine {
    pub fn record_search(
        user: Principal,
        query: &str,
        result_count: usize,
    ) {
        let search_query = SearchQuery {
            query: query.to_string(),
            timestamp: ic_cdk::api::time(),
            result_count,
            clicked_results: Vec::new(),
        };

        // Record in user's search history
        SEARCH_HISTORY.with(|sh| {
            let mut history = sh.borrow_mut();
            let user_queries = history.entry(user).or_insert_with(Vec::new);
            user_queries.push(search_query);
            
            // Keep only last 100 searches per user
            if user_queries.len() > 100 {
                user_queries.drain(0..user_queries.len() - 100);
            }
        });

        // Update popular queries
        Self::update_popular_queries(query, result_count);
        
        // Extract and index keywords
        Self::extract_and_index_keywords(query);
    }

    pub fn record_click(user: Principal, query: &str, memory_id: String) {
        SEARCH_HISTORY.with(|sh| {
            let mut history = sh.borrow_mut();
            if let Some(user_queries) = history.get_mut(&user) {
                // Find the most recent matching query and add the click
                for search_query in user_queries.iter_mut().rev() {
                    if search_query.query == query {
                        search_query.clicked_results.push(memory_id);
                        break;
                    }
                }
            }
        });
    }

    pub fn get_suggestions(
        user: Option<Principal>,
        partial_query: &str,
        limit: usize,
    ) -> Vec<SearchSuggestion> {
        let mut suggestions = Vec::new();
        let query_lower = partial_query.to_lowercase();

        // 1. Recent searches (if user provided)
        if let Some(user_id) = user {
            suggestions.extend(Self::get_recent_search_suggestions(user_id, &query_lower, 3));
        }

        // 2. Popular queries
        suggestions.extend(Self::get_popular_query_suggestions(&query_lower, 3));

        // 3. Tag suggestions
        suggestions.extend(Self::get_tag_suggestions(&query_lower, 3));

        // 4. Content keyword suggestions
        suggestions.extend(Self::get_keyword_suggestions(&query_lower, 3));

        // 5. Auto-complete suggestions
        suggestions.extend(Self::get_autocomplete_suggestions(&query_lower, 3));

        // Sort by score and limit
        suggestions.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        suggestions.truncate(limit);

        suggestions
    }

    fn get_recent_search_suggestions(
        user: Principal,
        partial_query: &str,
        limit: usize,
    ) -> Vec<SearchSuggestion> {
        SEARCH_HISTORY.with(|sh| {
            let history = sh.borrow();
            if let Some(user_queries) = history.get(&user) {
                let mut suggestions = Vec::new();
                
                for query in user_queries.iter().rev().take(20) {
                    if query.query.to_lowercase().contains(partial_query) && 
                       query.query.len() > partial_query.len() {
                        
                        let score = Self::calculate_recency_score(query.timestamp) +
                                   Self::calculate_success_score(query.result_count, &query.clicked_results);
                        
                        let mut metadata = HashMap::new();
                        metadata.insert("result_count".to_string(), query.result_count.to_string());
                        metadata.insert("last_searched".to_string(), query.timestamp.to_string());
                        
                        suggestions.push(SearchSuggestion {
                            text: query.query.clone(),
                            suggestion_type: SuggestionType::RecentSearch,
                            score,
                            metadata,
                        });
                        
                        if suggestions.len() >= limit {
                            break;
                        }
                    }
                }
                
                suggestions
            } else {
                Vec::new()
            }
        })
    }

    fn get_popular_query_suggestions(
        partial_query: &str,
        limit: usize,
    ) -> Vec<SearchSuggestion> {
        POPULAR_QUERIES.with(|pq| {
            let queries = pq.borrow();
            let mut suggestions = Vec::new();
            
            for popular in queries.iter().take(50) {
                if popular.query.to_lowercase().contains(partial_query) &&
                   popular.query.len() > partial_query.len() {
                    
                    let score = (popular.search_count as f32).log10() + 
                               (popular.avg_result_count / 10.0);
                    
                    let mut metadata = HashMap::new();
                    metadata.insert("search_count".to_string(), popular.search_count.to_string());
                    metadata.insert("avg_results".to_string(), popular.avg_result_count.to_string());
                    
                    suggestions.push(SearchSuggestion {
                        text: popular.query.clone(),
                        suggestion_type: SuggestionType::PopularQuery,
                        score,
                        metadata,
                    });
                    
                    if suggestions.len() >= limit {
                        break;
                    }
                }
            }
            
            suggestions
        })
    }

    fn get_tag_suggestions(partial_query: &str, limit: usize) -> Vec<SearchSuggestion> {
        TAG_SUGGESTIONS.with(|ts| {
            let tags = ts.borrow();
            let mut suggestions = Vec::new();
            
            for tag in tags.iter() {
                if tag.to_lowercase().contains(partial_query) && tag.len() > partial_query.len() {
                    let score = 2.0 + Self::calculate_tag_popularity(tag);
                    
                    let mut metadata = HashMap::new();
                    metadata.insert("type".to_string(), "tag".to_string());
                    
                    suggestions.push(SearchSuggestion {
                        text: format!("tag:{}", tag),
                        suggestion_type: SuggestionType::TagSuggestion,
                        score,
                        metadata,
                    });
                    
                    if suggestions.len() >= limit {
                        break;
                    }
                }
            }
            
            suggestions
        })
    }

    fn get_keyword_suggestions(partial_query: &str, limit: usize) -> Vec<SearchSuggestion> {
        CONTENT_KEYWORDS.with(|ck| {
            let keywords = ck.borrow();
            let mut suggestions = Vec::new();
            
            for (keyword, frequency) in keywords.iter() {
                if keyword.to_lowercase().contains(partial_query) && 
                   keyword.len() > partial_query.len() &&
                   *frequency > 2 {
                    
                    let score = (*frequency as f32).log10() + 1.0;
                    
                    let mut metadata = HashMap::new();
                    metadata.insert("frequency".to_string(), frequency.to_string());
                    
                    suggestions.push(SearchSuggestion {
                        text: keyword.clone(),
                        suggestion_type: SuggestionType::ContentKeyword,
                        score,
                        metadata,
                    });
                    
                    if suggestions.len() >= limit {
                        break;
                    }
                }
            }
            
            suggestions
        })
    }

    fn get_autocomplete_suggestions(partial_query: &str, limit: usize) -> Vec<SearchSuggestion> {
        if partial_query.len() < 2 {
            return Vec::new();
        }

        let mut suggestions = Vec::new();
        
        // Common search patterns and completions
        let patterns = vec![
            ("how to", "how to use", "tutorial"),
            ("what is", "what is the purpose of", "definition"),
            ("when", "when should I", "timing"),
            ("why", "why does", "explanation"),
            ("where", "where can I find", "location"),
        ];

        for (prefix, completion, category) in patterns {
            if prefix.starts_with(partial_query) && prefix.len() > partial_query.len() {
                let mut metadata = HashMap::new();
                metadata.insert("category".to_string(), category.to_string());
                
                suggestions.push(SearchSuggestion {
                    text: completion.to_string(),
                    suggestion_type: SuggestionType::AutoComplete,
                    score: 1.5,
                    metadata,
                });
                
                if suggestions.len() >= limit {
                    break;
                }
            }
        }

        suggestions
    }

    fn update_popular_queries(query: &str, result_count: usize) {
        POPULAR_QUERIES.with(|pq| {
            let mut queries = pq.borrow_mut();
            
            // Find existing query or create new
            if let Some(popular) = queries.iter_mut().find(|p| p.query == query) {
                popular.search_count += 1;
                popular.avg_result_count = 
                    (popular.avg_result_count * (popular.search_count - 1) as f32 + result_count as f32) / 
                    popular.search_count as f32;
                popular.last_searched = ic_cdk::api::time();
            } else {
                queries.push(PopularQuery {
                    query: query.to_string(),
                    search_count: 1,
                    avg_result_count: result_count as f32,
                    last_searched: ic_cdk::api::time(),
                });
            }
            
            // Sort by search count and keep top 100
            queries.sort_by(|a, b| b.search_count.cmp(&a.search_count));
            queries.truncate(100);
        });
    }

    fn extract_and_index_keywords(query: &str) {
        let words: Vec<&str> = query
            .split_whitespace()
            .filter(|word| word.len() > 2) // Only words longer than 2 characters
            .collect();

        CONTENT_KEYWORDS.with(|ck| {
            let mut keywords = ck.borrow_mut();
            for word in words {
                let word_lower = word.to_lowercase();
                *keywords.entry(word_lower).or_insert(0) += 1;
            }
        });
    }

    pub fn index_memory_content(memory: &Memory) {
        // Extract tags
        TAG_SUGGESTIONS.with(|ts| {
            let mut tags = ts.borrow_mut();
            for tag in &memory.tags {
                tags.insert(tag.clone());
            }
        });

        // Extract keywords from content
        let words: Vec<&str> = memory.content
            .split_whitespace()
            .filter(|word| word.len() > 3) // Only longer words
            .collect();

        CONTENT_KEYWORDS.with(|ck| {
            let mut keywords = ck.borrow_mut();
            for word in words {
                let word_lower = word.to_lowercase();
                *keywords.entry(word_lower).or_insert(0) += 1;
            }
        });
    }

    pub fn cleanup_old_data() {
        let cutoff_time = ic_cdk::api::time() - (30 * 24 * 60 * 60 * 1_000_000_000); // 30 days
        
        // Clean old search history
        SEARCH_HISTORY.with(|sh| {
            let mut history = sh.borrow_mut();
            for user_queries in history.values_mut() {
                user_queries.retain(|query| query.timestamp > cutoff_time);
            }
            
            // Remove users with no recent searches
            history.retain(|_, queries| !queries.is_empty());
        });

        // Clean old popular queries
        POPULAR_QUERIES.with(|pq| {
            let mut queries = pq.borrow_mut();
            queries.retain(|query| query.last_searched > cutoff_time);
        });
    }

    // Helper functions
    fn calculate_recency_score(timestamp: u64) -> f32 {
        let current_time = ic_cdk::api::time();
        let age_hours = (current_time - timestamp) / (60 * 60 * 1_000_000_000);
        
        if age_hours == 0 {
            5.0
        } else {
            5.0 / (age_hours as f32).log10().max(1.0)
        }
    }

    fn calculate_success_score(result_count: usize, clicked_results: &[String]) -> f32 {
        let click_rate = if result_count > 0 {
            clicked_results.len() as f32 / result_count as f32
        } else {
            0.0
        };
        
        click_rate * 2.0 + (result_count as f32).log10().min(2.0)
    }

    fn calculate_tag_popularity(tag: &str) -> f32 {
        // Count how many memories use this tag
        let count = crate::storage::count_memories_with_tag(tag).unwrap_or(0);
        (count as f32).log10().min(2.0)
    }

    // Get trending searches
    pub fn get_trending_searches(limit: usize) -> Vec<PopularQuery> {
        POPULAR_QUERIES.with(|pq| {
            let mut queries = pq.borrow().clone();
            
            // Calculate trending score based on recent activity
            let current_time = ic_cdk::api::time();
            let day_ago = current_time - (24 * 60 * 60 * 1_000_000_000);
            
            queries.retain(|q| q.last_searched > day_ago);
            queries.sort_by(|a, b| {
                let score_a = a.search_count as f32 / ((current_time - a.last_searched) as f32 / 1_000_000_000.0).max(1.0);
                let score_b = b.search_count as f32 / ((current_time - b.last_searched) as f32 / 1_000_000_000.0).max(1.0);
                score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
            });
            
            queries.truncate(limit);
            queries
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_recency_score() {
        let current_time = ic_cdk::api::time();
        let score = SuggestionsEngine::calculate_recency_score(current_time);
        assert!(score > 4.0); // Recent queries should have high score
    }

    #[test]
    fn test_calculate_success_score() {
        let score = SuggestionsEngine::calculate_success_score(10, &vec!["1".to_string(), "2".to_string()]);
        assert!(score > 0.0);
    }
}