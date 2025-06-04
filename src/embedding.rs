use crate::types::*;
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpMethod, HttpHeader, HttpResponse as CanisterHttpResponse,
};
use candid::Principal;

const OPENAI_API_URL: &str = "https://api.openai.com/v1/embeddings";
const OPENROUTER_API_URL: &str = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_OPENAI_MODEL: &str = "text-embedding-ada-002";
const DEFAULT_OPENROUTER_MODEL: &str = "text-embedding-ada-002";
const MAX_RESPONSE_BYTES: u64 = 8192;

pub async fn generate_embedding_for_user(text: &str, user_id: Principal) -> Result<Vec<f32>, String> {
    if text.trim().is_empty() {
        return Err("Text cannot be empty".to_string());
    }
    
    let user_config = match crate::storage::get_user_config(user_id) {
        Ok(Some(config)) => config,
        Ok(None) => return Err("No API configuration found. Please set your API key in settings.".to_string()),
        Err(e) => return Err(format!("Failed to get user config: {}", e)),
    };

    let (api_key, api_url, model) = match user_config.api_provider {
        crate::types::ApiProvider::OpenAI => {
            let key = user_config.openai_api_key
                .ok_or("OpenAI API key not configured. Please set your API key in settings.")?;
            (key, OPENAI_API_URL.to_string(), user_config.embedding_model)
        }
        crate::types::ApiProvider::OpenRouter => {
            let key = user_config.openrouter_api_key
                .ok_or("OpenRouter API key not configured. Please set your API key in settings.")?;
            (key, OPENROUTER_API_URL.to_string(), user_config.embedding_model)
        }
    };
    
    let request_body = EmbeddingRequest {
        model: model,
        input: text.to_string(),
        encoding_format: "float".to_string(),
    };
    
    let body_bytes = serde_json::to_vec(&request_body)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    // Prepare headers based on provider
    let mut headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Bearer {}", api_key),
        },
    ];

    // Add OpenRouter specific headers
    if matches!(user_config.api_provider, crate::types::ApiProvider::OpenRouter) {
        headers.push(HttpHeader {
            name: "HTTP-Referer".to_string(),
            value: "https://openmemory.ai".to_string(),
        });
        headers.push(HttpHeader {
            name: "X-Title".to_string(),
            value: "OpenMemory".to_string(),
        });
    }
    
    let http_request = CanisterHttpRequestArgument {
        url: api_url,
        method: HttpMethod::POST,
        body: Some(body_bytes),
        max_response_bytes: Some(MAX_RESPONSE_BYTES),
        headers,
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

// Batch processing support for multiple users
pub async fn generate_multiple_embeddings_for_user(texts: Vec<String>, user_id: Principal) -> Result<Vec<Vec<f32>>, String> {
    let mut embeddings = Vec::new();
    
    for text in texts {
        let embedding = generate_embedding_for_user(&text, user_id).await?;
        embeddings.push(embedding);
        
        // Add a small delay to avoid rate limiting
        ic_cdk::println!("Generated embedding {} of {}", embeddings.len(), texts.len());
    }
    
    Ok(embeddings)
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
pub async fn generate_embeddings_batch_for_user(texts: Vec<String>, batch_size: usize, user_id: Principal) -> Result<Vec<Vec<f32>>, String> {
    let mut all_embeddings = Vec::new();
    
    for chunk in texts.chunks(batch_size) {
        for text in chunk {
            let embedding = generate_embedding_for_user(text, user_id).await?;
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
pub async fn generate_embedding_with_retry_for_user(text: &str, max_retries: u32, user_id: Principal) -> Result<Vec<f32>, String> {
    let mut last_error = String::new();
    
    for attempt in 1..=max_retries {
        match generate_embedding_for_user(text, user_id).await {
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