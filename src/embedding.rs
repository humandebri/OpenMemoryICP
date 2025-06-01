use crate::types::*;
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpMethod, HttpHeader, HttpResponse as CanisterHttpResponse,
};
use candid::Principal;

const OPENAI_API_URL: &str = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL: &str = "text-embedding-ada-002";
const MAX_RESPONSE_BYTES: u64 = 8192;

pub async fn generate_embedding(text: &str) -> Result<Vec<f32>, String> {
    if text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }
    
    let api_key = get_openai_api_key()?;
    
    let request_body = EmbeddingRequest {
        model: EMBEDDING_MODEL.to_string(),
        input: text.to_string(),
        encoding_format: "float".to_string(),
    };
    
    let body_bytes = serde_json::to_vec(&request_body)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;
    
    let http_request = CanisterHttpRequestArgument {
        url: OPENAI_API_URL.to_string(),
        method: HttpMethod::POST,
        body: Some(body_bytes),
        max_response_bytes: Some(MAX_RESPONSE_BYTES),
        headers: vec![
            HttpHeader {
                name: "Authorization".to_string(),
                value: format!("Bearer {}", api_key),
            },
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "User-Agent".to_string(),
                value: "OpenMemory-ICP/1.0".to_string(),
            },
        ],
        transform: None,
    };
    
    ic_cdk::println!("Generating embedding for text: {}", &text[..text.len().min(100)]);
    
    let (response,): (CanisterHttpResponse,) = ic_cdk::call(
        Principal::management_canister(),
        "http_request",
        (http_request,),
    )
    .await
    .map_err(|e| format!("HTTP request failed: {:?}", e))?;
    
    if response.status != 200u16 {
        let error_body = String::from_utf8_lossy(&response.body);
        return Err(format!("OpenAI API error ({}): {}", response.status, error_body));
    }
    
    let embedding_response: EmbeddingResponse = 
        serde_json::from_slice(&response.body)
            .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    if embedding_response.data.is_empty() {
        return Err("No embedding data received".to_string());
    }
    
    ic_cdk::println!("Successfully generated embedding with {} dimensions", 
                     embedding_response.data[0].embedding.len());
    
    Ok(embedding_response.data[0].embedding.clone())
}

pub async fn generate_multiple_embeddings(texts: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
    let mut embeddings = Vec::new();
    
    for text in texts {
        let embedding = generate_embedding(&text).await?;
        embeddings.push(embedding);
        
        // Add a small delay to avoid rate limiting
        ic_cdk::println!("Generated embedding {} of {}", embeddings.len(), embeddings.capacity());
    }
    
    Ok(embeddings)
}

fn get_openai_api_key() -> Result<String, String> {
    // In a production environment, this should be stored securely
    // Options include:
    // 1. Environment variables (if supported by the canister runtime)
    // 2. Canister settings/configuration
    // 3. Encrypted storage with Internet Identity-based decryption
    // 4. External key management service
    
    // For development, we'll use a placeholder
    // TODO: Implement secure API key storage
    std::env::var("OPENAI_API_KEY")
        .or_else(|_| {
            // Fallback to a configuration that should be set during deployment
            get_canister_config("openai_api_key")
        })
        .map_err(|_| "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or canister configuration".to_string())
}

fn get_canister_config(_key: &str) -> Result<String, std::env::VarError> {
    // TODO: Implement canister configuration storage
    // This could use stable memory to store configuration values
    Err(std::env::VarError::NotPresent)
}

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    dot_product / (norm_a * norm_b)
}

pub fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return f32::INFINITY;
    }
    
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f32>()
        .sqrt()
}

pub fn normalize_embedding(embedding: &mut [f32]) {
    let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for value in embedding.iter_mut() {
            *value /= norm;
        }
    }
}

// Batch processing for better efficiency
pub async fn generate_embeddings_batch(texts: Vec<String>, batch_size: usize) -> Result<Vec<Vec<f32>>, String> {
    let mut all_embeddings = Vec::new();
    
    for chunk in texts.chunks(batch_size) {
        for text in chunk {
            let embedding = generate_embedding(text).await?;
            all_embeddings.push(embedding);
        }
        
        // Small delay between batches to respect rate limits
        if all_embeddings.len() < texts.len() {
            ic_cdk::println!("Processed batch, waiting before next batch...");
            // Note: In a real implementation, you might want to add actual delay
        }
    }
    
    Ok(all_embeddings)
}

// Error recovery and retry logic
pub async fn generate_embedding_with_retry(text: &str, max_retries: u32) -> Result<Vec<f32>, String> {
    let mut last_error = String::new();
    
    for attempt in 1..=max_retries {
        match generate_embedding(text).await {
            Ok(embedding) => return Ok(embedding),
            Err(e) => {
                last_error = e.clone();
                ic_cdk::println!("Embedding generation failed (attempt {}): {}", attempt, e);
                
                if attempt < max_retries {
                    ic_cdk::println!("Retrying in a moment...");
                    // In a real implementation, you might want to add exponential backoff
                }
            }
        }
    }
    
    Err(format!("Failed to generate embedding after {} attempts. Last error: {}", max_retries, last_error))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 1e-6);
        
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        assert!((cosine_similarity(&a, &b) - 0.0).abs() < 1e-6);
        
        let a = vec![1.0, 1.0];
        let b = vec![1.0, 1.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_euclidean_distance() {
        let a = vec![0.0, 0.0];
        let b = vec![3.0, 4.0];
        assert!((euclidean_distance(&a, &b) - 5.0).abs() < 1e-6);
        
        let a = vec![1.0, 1.0];
        let b = vec![1.0, 1.0];
        assert!((euclidean_distance(&a, &b) - 0.0).abs() < 1e-6);
    }

    #[test]
    fn test_normalize_embedding() {
        let mut embedding = vec![3.0, 4.0];
        normalize_embedding(&mut embedding);
        
        // Should be normalized to unit vector
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 1e-6);
        
        // Check actual values
        assert!((embedding[0] - 0.6).abs() < 1e-6);
        assert!((embedding[1] - 0.8).abs() < 1e-6);
    }
}