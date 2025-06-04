use crate::types::*;
use crate::errors::*;
use url::Url;
use std::collections::HashMap;
use std::cell::RefCell;
use ic_cdk::api::time;
use sha2::{Sha256, Digest};

thread_local! {
    static UUID_COUNTER: RefCell<u64> = RefCell::new(0);
}

pub fn extract_path(url: &str) -> String {
    if let Ok(parsed_url) = Url::parse(&format!("http://localhost{}", url)) {
        parsed_url.path().to_string()
    } else if url.starts_with('/') {
        url.split('?').next().unwrap_or(url).to_string()
    } else {
        format!("/{}", url.split('?').next().unwrap_or(url))
    }
}

pub fn parse_query_params(url: &str) -> HashMap<String, String> {
    let mut params = HashMap::new();
    
    if let Some(query_start) = url.find('?') {
        let query = &url[query_start + 1..];
        for param in query.split('&') {
            if let Some((key, value)) = param.split_once('=') {
                params.insert(
                    urlencoding::decode(key).unwrap_or_default().to_string(),
                    urlencoding::decode(value).unwrap_or_default().to_string(),
                );
            }
        }
    }
    
    params
}

pub fn extract_path_param(path: &str, pattern: &str) -> Option<String> {
    let path_parts: Vec<&str> = path.split('/').collect();
    let pattern_parts: Vec<&str> = pattern.split('/').collect();
    
    if path_parts.len() != pattern_parts.len() {
        return None;
    }
    
    for (i, pattern_part) in pattern_parts.iter().enumerate() {
        if pattern_part.starts_with('{') && pattern_part.ends_with('}') {
            return Some(path_parts[i].to_string());
        }
    }
    
    None
}

pub fn generate_uuid() -> String {
    // Create a unique ID using time, counter, and caller for uniqueness
    let counter = UUID_COUNTER.with(|c| {
        let mut count = c.borrow_mut();
        *count = count.wrapping_add(1);
        *count
    });
    
    let time_ns = time();
    let caller = ic_cdk::caller();
    
    // Create a unique string by combining time, counter, and caller principal
    let mut hasher = Sha256::new();
    hasher.update(&time_ns.to_be_bytes());
    hasher.update(&counter.to_be_bytes());
    hasher.update(caller.as_slice());
    
    let result = hasher.finalize();
    
    // Format as a UUID-like string for better readability
    format!(
        "{:08x}-{:04x}-{:04x}-{:04x}-{:012x}",
        u32::from_be_bytes([result[0], result[1], result[2], result[3]]),
        u16::from_be_bytes([result[4], result[5]]),
        u16::from_be_bytes([result[6], result[7]]),
        u16::from_be_bytes([result[8], result[9]]),
        u64::from_be_bytes([result[10], result[11], result[12], result[13], result[14], result[15], 0, 0]) >> 16
    )
}

pub fn get_current_time() -> u64 {
    time()
}

pub fn create_cors_headers() -> Vec<(String, String)> {
    vec![
        ("Access-Control-Allow-Origin".to_string(), "*".to_string()),
        ("Access-Control-Allow-Methods".to_string(), "GET, POST, PUT, DELETE, OPTIONS".to_string()),
        ("Access-Control-Allow-Headers".to_string(), "Content-Type, Authorization, X-API-Key, X-Requested-With".to_string()),
        ("Access-Control-Expose-Headers".to_string(), "Content-Length, Date, Server".to_string()),
        ("Access-Control-Max-Age".to_string(), "86400".to_string()),
        ("Content-Type".to_string(), "application/json".to_string()),
    ]
}

pub fn error_response(status_code: u16, message: &str) -> HttpResponse {
    let error = crate::errors::ErrorResponse {
        error: message.to_string(),
        code: status_code,
        category: "unknown".to_string(),
        retry_after: None,
        context: None,
    };
    
    HttpResponse {
        status_code,
        headers: create_cors_headers(),
        body: serde_json::to_vec(&error).unwrap_or_default(),
        upgrade: None,
    }
}

pub fn error_response_from_error(error: OpenMemoryError) -> HttpResponse {
    let status_code = error.status_code();
    let error_response = crate::errors::ErrorResponse::from(error);
    
    HttpResponse {
        status_code,
        headers: create_cors_headers(),
        body: serde_json::to_vec(&error_response).unwrap_or_default(),
        upgrade: None,
    }
}

pub fn success_response<T: serde::Serialize>(data: &T, status_code: u16) -> HttpResponse {
    HttpResponse {
        status_code,
        headers: create_cors_headers(),
        body: serde_json::to_vec(data).unwrap_or_default(),
        upgrade: None,
    }
}

pub fn extract_bearer_token(headers: &[(String, String)]) -> Option<String> {
    for (name, value) in headers {
        if name.to_lowercase() == "authorization" {
            if let Some(token) = value.strip_prefix("Bearer ") {
                return Some(token.to_string());
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_path() {
        assert_eq!(extract_path("/memories"), "/memories");
        assert_eq!(extract_path("/memories?q=test"), "/memories");
        assert_eq!(extract_path("memories/123"), "/memories/123");
    }

    #[test]
    fn test_parse_query_params() {
        let params = parse_query_params("/search?q=test&limit=5");
        assert_eq!(params.get("q"), Some(&"test".to_string()));
        assert_eq!(params.get("limit"), Some(&"5".to_string()));
    }

    #[test]
    fn test_extract_path_param() {
        assert_eq!(
            extract_path_param("/memories/123", "/memories/{id}"),
            Some("123".to_string())
        );
        assert_eq!(
            extract_path_param("/users/abc/memories", "/users/{id}/memories"),
            Some("abc".to_string())
        );
    }
}