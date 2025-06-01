use crate::types::*;
use std::collections::{HashMap, HashSet};
use std::cell::RefCell;
use candid::Principal;
use serde::{Deserialize, Serialize};

// Memory clustering and categorization system
thread_local! {
    static CLUSTERS: RefCell<HashMap<String, MemoryCluster>> = RefCell::new(HashMap::new());
    static CATEGORIES: RefCell<HashMap<String, MemoryCategory>> = RefCell::new(HashMap::new());
    static USER_CLUSTERS: RefCell<HashMap<Principal, Vec<String>>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MemoryCluster {
    pub id: String,
    pub name: String,
    pub description: String,
    pub memory_ids: Vec<String>,
    pub centroid: Vec<f32>, // Average embedding vector
    pub tags: HashSet<String>,
    pub created_at: u64,
    pub updated_at: u64,
    pub user_id: Principal,
    pub cluster_type: ClusterType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ClusterType {
    Automatic,     // AI-generated clusters
    Manual,        // User-created clusters
    Category,      // Content category clusters
    Temporal,      // Time-based clusters
    Semantic,      // Semantic similarity clusters
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MemoryCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub keywords: Vec<String>,
    pub confidence_threshold: f32,
    pub memory_count: usize,
    pub parent_category: Option<String>,
    pub subcategories: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ClusteringResult {
    pub clusters: Vec<MemoryCluster>,
    pub unclustered_memories: Vec<String>,
    pub clustering_score: f32,
    pub method_used: ClusteringMethod,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ClusteringMethod {
    KMeans,
    DBSCAN,
    Hierarchical,
    ContentBased,
    TagBased,
    Temporal,
}

pub struct ClusteringEngine;

impl ClusteringEngine {
    // Initialize predefined categories
    pub fn init_categories() {
        let predefined_categories = vec![
            MemoryCategory {
                id: "tech".to_string(),
                name: "Technology".to_string(),
                description: "Technical information, programming, software, and tech concepts".to_string(),
                keywords: vec![
                    "programming".to_string(), "software".to_string(), "technology".to_string(),
                    "code".to_string(), "algorithm".to_string(), "database".to_string(),
                    "API".to_string(), "framework".to_string(), "library".to_string(),
                ],
                confidence_threshold: 0.7,
                memory_count: 0,
                parent_category: None,
                subcategories: vec!["programming".to_string(), "infrastructure".to_string()],
            },
            MemoryCategory {
                id: "business".to_string(),
                name: "Business".to_string(),
                description: "Business concepts, strategy, management, and professional topics".to_string(),
                keywords: vec![
                    "business".to_string(), "strategy".to_string(), "management".to_string(),
                    "marketing".to_string(), "finance".to_string(), "company".to_string(),
                    "revenue".to_string(), "investment".to_string(), "market".to_string(),
                ],
                confidence_threshold: 0.7,
                memory_count: 0,
                parent_category: None,
                subcategories: vec!["strategy".to_string(), "finance".to_string()],
            },
            MemoryCategory {
                id: "personal".to_string(),
                name: "Personal".to_string(),
                description: "Personal notes, thoughts, experiences, and private information".to_string(),
                keywords: vec![
                    "personal".to_string(), "private".to_string(), "diary".to_string(),
                    "thought".to_string(), "idea".to_string(), "reflection".to_string(),
                    "experience".to_string(), "memory".to_string(), "feeling".to_string(),
                ],
                confidence_threshold: 0.6,
                memory_count: 0,
                parent_category: None,
                subcategories: vec!["thoughts".to_string(), "experiences".to_string()],
            },
            MemoryCategory {
                id: "reference".to_string(),
                name: "Reference".to_string(),
                description: "Reference materials, documentation, and factual information".to_string(),
                keywords: vec![
                    "reference".to_string(), "documentation".to_string(), "guide".to_string(),
                    "manual".to_string(), "fact".to_string(), "definition".to_string(),
                    "instruction".to_string(), "tutorial".to_string(), "how-to".to_string(),
                ],
                confidence_threshold: 0.7,
                memory_count: 0,
                parent_category: None,
                subcategories: vec!["docs".to_string(), "tutorials".to_string()],
            },
        ];

        CATEGORIES.with(|c| {
            let mut categories = c.borrow_mut();
            for category in predefined_categories {
                categories.insert(category.id.clone(), category);
            }
        });

        ic_cdk::println!("Initialized {} predefined categories", CATEGORIES.with(|c| c.borrow().len()));
    }

    // Automatic clustering using K-means algorithm
    pub fn cluster_memories_kmeans(
        user_id: Principal,
        memory_ids: Vec<String>,
        k: usize,
    ) -> Result<ClusteringResult, String> {
        if memory_ids.len() < k {
            return Err("Not enough memories for clustering".to_string());
        }

        // Get embeddings for all memories
        let mut embeddings = Vec::new();
        let mut valid_memory_ids = Vec::new();

        for memory_id in memory_ids {
            if let Ok(Some(memory)) = crate::storage::get_memory(&memory_id) {
                if !memory.embedding.is_empty() {
                    embeddings.push(memory.embedding);
                    valid_memory_ids.push(memory_id);
                }
            }
        }

        if embeddings.is_empty() {
            return Err("No memories with embeddings found".to_string());
        }

        // Simple K-means implementation
        let (cluster_assignments, centroids) = Self::kmeans(&embeddings, k)?;
        
        // Create clusters
        let mut clusters = Vec::new();
        for (i, centroid) in centroids.iter().enumerate() {
            let cluster_memory_ids: Vec<String> = cluster_assignments
                .iter()
                .enumerate()
                .filter(|(_, &cluster_id)| cluster_id == i)
                .map(|(idx, _)| valid_memory_ids[idx].clone())
                .collect();

            if !cluster_memory_ids.is_empty() {
                let cluster = MemoryCluster {
                    id: format!("cluster_{}_{}", user_id.to_string(), i),
                    name: format!("Cluster {}", i + 1),
                    description: Self::generate_cluster_description(&cluster_memory_ids),
                    memory_ids: cluster_memory_ids,
                    centroid: centroid.clone(),
                    tags: Self::extract_cluster_tags(&valid_memory_ids, &cluster_assignments, i),
                    created_at: ic_cdk::api::time(),
                    updated_at: ic_cdk::api::time(),
                    user_id,
                    cluster_type: ClusterType::Automatic,
                };
                clusters.push(cluster);
            }
        }

        // Calculate clustering score
        let clustering_score = Self::calculate_clustering_score(&embeddings, &cluster_assignments, &centroids);

        Ok(ClusteringResult {
            clusters,
            unclustered_memories: Vec::new(),
            clustering_score,
            method_used: ClusteringMethod::KMeans,
        })
    }

    // Content-based clustering using categories
    pub fn cluster_by_content(
        user_id: Principal,
        memory_ids: Vec<String>,
    ) -> Result<ClusteringResult, String> {
        let mut category_clusters: HashMap<String, Vec<String>> = HashMap::new();
        let mut unclustered = Vec::new();

        for memory_id in memory_ids {
            if let Ok(Some(memory)) = crate::storage::get_memory(&memory_id) {
                if let Some(category_id) = Self::classify_memory(&memory) {
                    category_clusters.entry(category_id).or_insert_with(Vec::new).push(memory_id);
                } else {
                    unclustered.push(memory_id);
                }
            }
        }

        let mut clusters = Vec::new();
        for (category_id, memory_ids) in category_clusters {
            if let Some(category) = CATEGORIES.with(|c| c.borrow().get(&category_id).cloned()) {
                let cluster = MemoryCluster {
                    id: format!("content_{}_{}", user_id.to_string(), category_id),
                    name: category.name.clone(),
                    description: category.description.clone(),
                    memory_ids: memory_ids.clone(),
                    centroid: Self::calculate_content_centroid(&memory_ids),
                    tags: category.keywords.into_iter().collect(),
                    created_at: ic_cdk::api::time(),
                    updated_at: ic_cdk::api::time(),
                    user_id,
                    cluster_type: ClusterType::Category,
                };
                clusters.push(cluster);
            }
        }

        Ok(ClusteringResult {
            clusters,
            unclustered_memories: unclustered,
            clustering_score: 0.8, // Fixed score for content-based clustering
            method_used: ClusteringMethod::ContentBased,
        })
    }

    // Tag-based clustering
    pub fn cluster_by_tags(
        user_id: Principal,
        memory_ids: Vec<String>,
    ) -> Result<ClusteringResult, String> {
        let mut tag_clusters: HashMap<String, Vec<String>> = HashMap::new();
        let mut unclustered = Vec::new();

        for memory_id in memory_ids {
            if let Ok(Some(memory)) = crate::storage::get_memory(&memory_id) {
                if memory.tags.is_empty() {
                    unclustered.push(memory_id);
                } else {
                    // Use the most common tag for this memory
                    let primary_tag = memory.tags[0].clone();
                    tag_clusters.entry(primary_tag).or_insert_with(Vec::new).push(memory_id);
                }
            }
        }

        let mut clusters = Vec::new();
        for (tag, memory_ids) in tag_clusters {
            let cluster = MemoryCluster {
                id: format!("tag_{}_{}", user_id.to_string(), tag),
                name: format!("#{}", tag),
                description: format!("Memories tagged with '{}'", tag),
                memory_ids: memory_ids.clone(),
                centroid: Self::calculate_content_centroid(&memory_ids),
                tags: vec![tag.clone()].into_iter().collect(),
                created_at: ic_cdk::api::time(),
                updated_at: ic_cdk::api::time(),
                user_id,
                cluster_type: ClusterType::Semantic,
            };
            clusters.push(cluster);
        }

        Ok(ClusteringResult {
            clusters,
            unclustered_memories: unclustered,
            clustering_score: 0.9, // High score for tag-based clustering
            method_used: ClusteringMethod::TagBased,
        })
    }

    // Temporal clustering (group by time periods)
    pub fn cluster_by_time(
        user_id: Principal,
        memory_ids: Vec<String>,
        time_period: TimePeriod,
    ) -> Result<ClusteringResult, String> {
        let mut time_clusters: HashMap<String, Vec<String>> = HashMap::new();

        for memory_id in memory_ids {
            if let Ok(Some(memory)) = crate::storage::get_memory(&memory_id) {
                let time_key = Self::get_time_cluster_key(memory.created_at, &time_period);
                time_clusters.entry(time_key).or_insert_with(Vec::new).push(memory_id);
            }
        }

        let mut clusters = Vec::new();
        for (time_key, memory_ids) in time_clusters {
            let cluster = MemoryCluster {
                id: format!("time_{}_{}", user_id.to_string(), time_key),
                name: Self::format_time_cluster_name(&time_key, &time_period),
                description: format!("Memories from {}", time_key),
                memory_ids: memory_ids.clone(),
                centroid: Self::calculate_content_centroid(&memory_ids),
                tags: HashSet::new(),
                created_at: ic_cdk::api::time(),
                updated_at: ic_cdk::api::time(),
                user_id,
                cluster_type: ClusterType::Temporal,
            };
            clusters.push(cluster);
        }

        Ok(ClusteringResult {
            clusters,
            unclustered_memories: Vec::new(),
            clustering_score: 1.0, // Perfect score for temporal clustering
            method_used: ClusteringMethod::Temporal,
        })
    }

    // Store cluster
    pub fn store_cluster(cluster: MemoryCluster) -> Result<(), String> {
        let cluster_id = cluster.id.clone();
        let user_id = cluster.user_id;

        CLUSTERS.with(|c| {
            c.borrow_mut().insert(cluster_id.clone(), cluster);
        });

        USER_CLUSTERS.with(|uc| {
            let mut user_clusters = uc.borrow_mut();
            let clusters = user_clusters.entry(user_id).or_insert_with(Vec::new);
            if !clusters.contains(&cluster_id) {
                clusters.push(cluster_id);
            }
        });

        Ok(())
    }

    // Get user clusters
    pub fn get_user_clusters(user_id: Principal) -> Vec<MemoryCluster> {
        USER_CLUSTERS.with(|uc| {
            let user_clusters = uc.borrow();
            if let Some(cluster_ids) = user_clusters.get(&user_id) {
                CLUSTERS.with(|c| {
                    let clusters = c.borrow();
                    cluster_ids
                        .iter()
                        .filter_map(|id| clusters.get(id).cloned())
                        .collect()
                })
            } else {
                Vec::new()
            }
        })
    }

    // Classify memory into category
    fn classify_memory(memory: &Memory) -> Option<String> {
        CATEGORIES.with(|c| {
            let categories = c.borrow();
            let content_lower = memory.content.to_lowercase();
            
            for (category_id, category) in categories.iter() {
                let mut score = 0.0;
                let keyword_count = category.keywords.len() as f32;
                
                for keyword in &category.keywords {
                    if content_lower.contains(&keyword.to_lowercase()) {
                        score += 1.0 / keyword_count;
                    }
                }
                
                // Check tags
                for tag in &memory.tags {
                    if category.keywords.contains(&tag.to_lowercase()) {
                        score += 0.5 / keyword_count;
                    }
                }
                
                if score >= category.confidence_threshold {
                    return Some(category_id.clone());
                }
            }
            
            None
        })
    }

    // Helper functions
    fn kmeans(embeddings: &[Vec<f32>], k: usize) -> Result<(Vec<usize>, Vec<Vec<f32>>), String> {
        if embeddings.is_empty() || k == 0 {
            return Err("Invalid input for k-means".to_string());
        }

        let _dim = embeddings[0].len();
        let mut centroids = Self::initialize_centroids(embeddings, k);
        let mut assignments = vec![0; embeddings.len()];
        
        // Simple k-means with fixed iterations
        for _ in 0..10 {
            // Assign points to clusters
            for (i, embedding) in embeddings.iter().enumerate() {
                let mut best_cluster = 0;
                let mut best_distance = f32::INFINITY;
                
                for (j, centroid) in centroids.iter().enumerate() {
                    let distance = Self::euclidean_distance(embedding, centroid);
                    if distance < best_distance {
                        best_distance = distance;
                        best_cluster = j;
                    }
                }
                
                assignments[i] = best_cluster;
            }
            
            // Update centroids
            for j in 0..k {
                let cluster_points: Vec<&Vec<f32>> = embeddings
                    .iter()
                    .enumerate()
                    .filter(|(i, _)| assignments[*i] == j)
                    .map(|(_, embedding)| embedding)
                    .collect();
                
                if !cluster_points.is_empty() {
                    centroids[j] = Self::calculate_centroid(&cluster_points);
                }
            }
        }
        
        Ok((assignments, centroids))
    }

    fn initialize_centroids(embeddings: &[Vec<f32>], k: usize) -> Vec<Vec<f32>> {
        // Simple random initialization
        let mut centroids = Vec::new();
        let step = embeddings.len() / k;
        
        for i in 0..k {
            let idx = (i * step).min(embeddings.len() - 1);
            centroids.push(embeddings[idx].clone());
        }
        
        centroids
    }

    fn calculate_centroid(points: &[&Vec<f32>]) -> Vec<f32> {
        if points.is_empty() {
            return Vec::new();
        }
        
        let dim = points[0].len();
        let mut centroid = vec![0.0; dim];
        
        for point in points {
            for (i, &val) in point.iter().enumerate() {
                centroid[i] += val;
            }
        }
        
        let count = points.len() as f32;
        for val in &mut centroid {
            *val /= count;
        }
        
        centroid
    }

    fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
        a.iter()
            .zip(b.iter())
            .map(|(x, y)| (x - y).powi(2))
            .sum::<f32>()
            .sqrt()
    }

    fn calculate_clustering_score(
        embeddings: &[Vec<f32>], 
        assignments: &[usize], 
        centroids: &[Vec<f32>]
    ) -> f32 {
        let mut total_distance = 0.0;
        let mut count = 0;
        
        for (i, embedding) in embeddings.iter().enumerate() {
            let cluster_id = assignments[i];
            if cluster_id < centroids.len() {
                total_distance += Self::euclidean_distance(embedding, &centroids[cluster_id]);
                count += 1;
            }
        }
        
        if count > 0 {
            1.0 / (1.0 + total_distance / count as f32)
        } else {
            0.0
        }
    }

    fn generate_cluster_description(memory_ids: &[String]) -> String {
        format!("Automatically generated cluster with {} memories", memory_ids.len())
    }

    fn extract_cluster_tags(
        memory_ids: &[String], 
        assignments: &[usize], 
        cluster_id: usize
    ) -> HashSet<String> {
        let mut tags = HashSet::new();
        
        for (i, memory_id) in memory_ids.iter().enumerate() {
            if assignments[i] == cluster_id {
                if let Ok(Some(memory)) = crate::storage::get_memory(memory_id) {
                    for tag in memory.tags {
                        tags.insert(tag);
                    }
                }
            }
        }
        
        tags
    }

    fn calculate_content_centroid(memory_ids: &[String]) -> Vec<f32> {
        let mut embeddings = Vec::new();
        
        for memory_id in memory_ids {
            if let Ok(Some(memory)) = crate::storage::get_memory(memory_id) {
                if !memory.embedding.is_empty() {
                    embeddings.push(memory.embedding);
                }
            }
        }
        
        let embedding_refs: Vec<&Vec<f32>> = embeddings.iter().collect();
        Self::calculate_centroid(&embedding_refs)
    }

    fn get_time_cluster_key(timestamp: u64, period: &TimePeriod) -> String {
        let seconds = timestamp / 1_000_000_000;
        let datetime = seconds;
        
        match period {
            TimePeriod::Day => format!("day_{}", datetime / 86400),
            TimePeriod::Week => format!("week_{}", datetime / 604800),
            TimePeriod::Month => format!("month_{}", datetime / 2592000),
            TimePeriod::Year => format!("year_{}", datetime / 31536000),
        }
    }

    fn format_time_cluster_name(time_key: &str, period: &TimePeriod) -> String {
        match period {
            TimePeriod::Day => format!("Daily memories: {}", time_key),
            TimePeriod::Week => format!("Weekly memories: {}", time_key),
            TimePeriod::Month => format!("Monthly memories: {}", time_key),
            TimePeriod::Year => format!("Yearly memories: {}", time_key),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum TimePeriod {
    Day,
    Week,
    Month,
    Year,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_euclidean_distance() {
        let a = vec![0.0, 0.0];
        let b = vec![3.0, 4.0];
        let distance = ClusteringEngine::euclidean_distance(&a, &b);
        assert!((distance - 5.0).abs() < 1e-6);
    }

    #[test]
    fn test_calculate_centroid() {
        let points = vec![
            &vec![1.0, 2.0],
            &vec![3.0, 4.0],
        ];
        let centroid = ClusteringEngine::calculate_centroid(&points);
        assert_eq!(centroid, vec![2.0, 3.0]);
    }
}