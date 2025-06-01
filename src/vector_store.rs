use crate::types::*;
use std::collections::HashMap;
use std::cell::RefCell;
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl, Storable};
use std::borrow::Cow;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

// Vector storage using stable memory
type VectorMemory = DefaultMemoryImpl;
type VectorMap = StableBTreeMap<String, VectorEntry, VectorMemory>;
type VectorIndexMap = StableBTreeMap<u64, VectorIndexList, VectorMemory>;

thread_local! {
    static VECTORS: RefCell<Option<VectorMap>> = RefCell::new(None);
    static VECTOR_INDEX: RefCell<Option<VectorIndexMap>> = RefCell::new(None);
    static VECTOR_CONFIG: RefCell<VectorStoreConfig> = RefCell::new(VectorStoreConfig::default());
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VectorEntry {
    pub id: String,
    pub vector: Vec<f32>,
    pub metadata: HashMap<String, String>,
    pub created_at: u64,
    pub norm: f32, // Pre-computed vector norm for faster cosine similarity
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VectorStoreConfig {
    pub dimension: usize,
    pub similarity_function: SimilarityFunction,
    pub max_vectors: usize,
    pub index_threshold: f32, // Minimum similarity threshold for indexing
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum SimilarityFunction {
    Cosine,
    Euclidean,
    DotProduct,
}

impl Default for VectorStoreConfig {
    fn default() -> Self {
        VectorStoreConfig {
            dimension: 1536, // OpenAI embedding dimension
            similarity_function: SimilarityFunction::Cosine,
            max_vectors: 1_000_000,
            index_threshold: 0.7,
        }
    }
}

// Implement Storable for VectorEntry
impl Storable for VectorEntry {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

// Wrapper type for vector index to implement Storable
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct VectorIndexList(pub Vec<String>);

impl Storable for VectorIndexList {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

pub struct AdvancedVectorStore;

impl AdvancedVectorStore {
    pub fn init() -> Result<(), String> {
        VECTORS.with(|v| {
            *v.borrow_mut() = Some(StableBTreeMap::init(DefaultMemoryImpl::default()));
        });
        
        VECTOR_INDEX.with(|vi| {
            *vi.borrow_mut() = Some(StableBTreeMap::init(DefaultMemoryImpl::default()));
        });
        
        ic_cdk::println!("Advanced Vector Store initialized");
        Ok(())
    }

    pub fn add_vector(id: String, vector: Vec<f32>) -> Result<(), String> {
        let config = VECTOR_CONFIG.with(|c| c.borrow().clone());
        
        if vector.len() != config.dimension {
            return Err(format!(
                "Vector dimension {} does not match expected dimension {}", 
                vector.len(), 
                config.dimension
            ));
        }

        let norm = compute_norm(&vector);
        let entry = VectorEntry {
            id: id.clone(),
            vector,
            metadata: HashMap::new(),
            created_at: ic_cdk::api::time(),
            norm,
        };

        VECTORS.with(|v| {
            if let Some(ref mut vectors) = *v.borrow_mut() {
                vectors.insert(id.clone(), entry.clone());
                Ok(())
            } else {
                Err("Vector store not initialized".to_string())
            }
        })?;

        // Update vector index for efficient similarity search
        Self::update_vector_index(&id, &entry.vector)?;

        ic_cdk::println!("Vector added: {}", id);
        Ok(())
    }

    pub fn remove_vector(id: &str) -> Result<bool, String> {
        let removed = VECTORS.with(|v| {
            if let Some(ref mut vectors) = *v.borrow_mut() {
                vectors.remove(&id.to_string()).is_some()
            } else {
                false
            }
        });

        if removed {
            Self::remove_from_index(id)?;
            ic_cdk::println!("Vector removed: {}", id);
        }

        Ok(removed)
    }

    pub fn search_similar(
        query_vector: &[f32], 
        limit: usize, 
        threshold: Option<f32>
    ) -> Result<Vec<(String, f32)>, String> {
        let config = VECTOR_CONFIG.with(|c| c.borrow().clone());
        let threshold = threshold.unwrap_or(config.index_threshold);

        if query_vector.len() != config.dimension {
            return Err(format!(
                "Query vector dimension {} does not match expected dimension {}", 
                query_vector.len(), 
                config.dimension
            ));
        }

        let mut similarities = Vec::new();
        let query_norm = compute_norm(query_vector);

        VECTORS.with(|v| {
            if let Some(ref vectors) = *v.borrow() {
                for (id, entry) in vectors.iter() {
                    let similarity = match config.similarity_function {
                        SimilarityFunction::Cosine => {
                            cosine_similarity_normalized(query_vector, &entry.vector, query_norm, entry.norm)
                        }
                        SimilarityFunction::Euclidean => {
                            1.0 / (1.0 + euclidean_distance(query_vector, &entry.vector))
                        }
                        SimilarityFunction::DotProduct => {
                            dot_product(query_vector, &entry.vector)
                        }
                    };

                    if similarity >= threshold {
                        similarities.push((id, similarity));
                    }
                }
            }
        });

        // Sort by similarity (highest first)
        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Limit results
        similarities.truncate(limit);

        Ok(similarities)
    }

    pub fn get_vector(id: &str) -> Result<Option<VectorEntry>, String> {
        VECTORS.with(|v| {
            if let Some(ref vectors) = *v.borrow() {
                Ok(vectors.get(&id.to_string()))
            } else {
                Err("Vector store not initialized".to_string())
            }
        })
    }

    pub fn get_vector_count() -> usize {
        VECTORS.with(|v| {
            if let Some(ref vectors) = *v.borrow() {
                vectors.len() as usize
            } else {
                0
            }
        })
    }

    pub fn update_config(config: VectorStoreConfig) -> Result<(), String> {
        VECTOR_CONFIG.with(|c| {
            *c.borrow_mut() = config;
        });
        Ok(())
    }

    pub fn get_config() -> VectorStoreConfig {
        VECTOR_CONFIG.with(|c| c.borrow().clone())
    }

    // Advanced indexing for faster search
    fn update_vector_index(id: &str, vector: &[f32]) -> Result<(), String> {
        // Simple hash-based indexing
        // In production, this could use more sophisticated indexing like LSH or HNSW
        let hash = Self::vector_hash(vector);
        
        VECTOR_INDEX.with(|vi| {
            if let Some(ref mut index) = *vi.borrow_mut() {
                let mut bucket = index.get(&hash).unwrap_or_default();
                if !bucket.0.contains(&id.to_string()) {
                    bucket.0.push(id.to_string());
                    index.insert(hash, bucket);
                }
                Ok(())
            } else {
                Err("Vector index not initialized".to_string())
            }
        })
    }

    fn remove_from_index(id: &str) -> Result<(), String> {
        VECTOR_INDEX.with(|vi| {
            if let Some(ref mut index) = *vi.borrow_mut() {
                // Remove from all buckets (inefficient but simple)
                let keys: Vec<u64> = index.iter().map(|(k, _)| k).collect();
                for key in keys {
                    if let Some(mut bucket) = index.get(&key) {
                        bucket.0.retain(|item| item != id);
                        if bucket.0.is_empty() {
                            index.remove(&key);
                        } else {
                            index.insert(key, bucket);
                        }
                    }
                }
                Ok(())
            } else {
                Err("Vector index not initialized".to_string())
            }
        })
    }

    fn vector_hash(vector: &[f32]) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        // Hash first few dimensions for bucketing
        for &val in vector.iter().take(10) {
            ((val * 1000.0) as i32).hash(&mut hasher);
        }
        hasher.finish()
    }

    // Batch operations for efficiency
    pub fn add_vectors_batch(vectors: Vec<(String, Vec<f32>)>) -> Result<Vec<Result<(), String>>, String> {
        let mut results = Vec::new();
        
        for (id, vector) in vectors {
            let result = Self::add_vector(id, vector);
            results.push(result);
        }
        
        Ok(results)
    }

    // Statistical analysis
    pub fn get_statistics() -> VectorStoreStats {
        let config = VECTOR_CONFIG.with(|c| c.borrow().clone());
        let count = Self::get_vector_count();
        
        let (avg_norm, min_norm, max_norm) = VECTORS.with(|v| {
            if let Some(ref vectors) = *v.borrow() {
                let norms: Vec<f32> = vectors.iter().map(|(_, entry)| entry.norm).collect();
                if norms.is_empty() {
                    (0.0, 0.0, 0.0)
                } else {
                    let sum: f32 = norms.iter().sum();
                    let avg = sum / norms.len() as f32;
                    let min = norms.iter().fold(f32::INFINITY, |a, &b| a.min(b));
                    let max = norms.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
                    (avg, min, max)
                }
            } else {
                (0.0, 0.0, 0.0)
            }
        });

        VectorStoreStats {
            total_vectors: count,
            dimension: config.dimension,
            similarity_function: config.similarity_function,
            avg_norm,
            min_norm,
            max_norm,
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VectorStoreStats {
    pub total_vectors: usize,
    pub dimension: usize,
    pub similarity_function: SimilarityFunction,
    pub avg_norm: f32,
    pub min_norm: f32,
    pub max_norm: f32,
}

// Similarity computation functions
fn compute_norm(vector: &[f32]) -> f32 {
    vector.iter().map(|x| x * x).sum::<f32>().sqrt()
}

fn cosine_similarity_normalized(a: &[f32], b: &[f32], norm_a: f32, norm_b: f32) -> f32 {
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    let dot = dot_product(a, b);
    dot / (norm_a * norm_b)
}

fn dot_product(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f32>()
        .sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let norm_a = compute_norm(&a);
        let norm_b = compute_norm(&b);
        
        assert!((cosine_similarity_normalized(&a, &b, norm_a, norm_b) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_euclidean_distance() {
        let a = vec![0.0, 0.0];
        let b = vec![3.0, 4.0];
        assert!((euclidean_distance(&a, &b) - 5.0).abs() < 1e-6);
    }

    #[test]
    fn test_vector_norm() {
        let v = vec![3.0, 4.0];
        assert!((compute_norm(&v) - 5.0).abs() < 1e-6);
    }
}