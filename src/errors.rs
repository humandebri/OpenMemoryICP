use candid::CandidType;
use serde::{Deserialize, Serialize};
use std::fmt;

/// OpenMemory system errors with structured error handling
#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub enum OpenMemoryError {
    /// Storage-related errors
    Storage {
        message: String,
        operation: String,
    },
    
    /// Authentication and authorization errors
    Authentication {
        message: String,
        auth_type: String,
    },
    
    /// OpenAI API related errors
    OpenAI {
        message: String,
        status_code: Option<u16>,
    },
    
    /// Validation errors for input data
    Validation {
        message: String,
        field: Option<String>,
    },
    
    /// Resource not found errors
    NotFound {
        resource_type: String,
        resource_id: String,
    },
    
    /// Rate limiting errors
    RateLimit {
        message: String,
        retry_after: Option<u64>,
    },
    
    /// Network and HTTP outcall errors
    Network {
        message: String,
        url: Option<String>,
    },
    
    /// Configuration errors
    Configuration {
        message: String,
        config_key: Option<String>,
    },
    
    /// Generic internal server errors
    Internal {
        message: String,
        context: Option<String>,
    },
}

impl OpenMemoryError {
    /// Create a storage error
    pub fn storage(message: impl Into<String>, operation: impl Into<String>) -> Self {
        Self::Storage {
            message: message.into(),
            operation: operation.into(),
        }
    }
    
    /// Create an authentication error
    pub fn authentication(message: impl Into<String>, auth_type: impl Into<String>) -> Self {
        Self::Authentication {
            message: message.into(),
            auth_type: auth_type.into(),
        }
    }
    
    /// Create an OpenAI API error
    pub fn openai(message: impl Into<String>, status_code: Option<u16>) -> Self {
        Self::OpenAI {
            message: message.into(),
            status_code,
        }
    }
    
    /// Create a validation error
    pub fn validation(message: impl Into<String>, field: Option<impl Into<String>>) -> Self {
        Self::Validation {
            message: message.into(),
            field: field.map(|f| f.into()),
        }
    }
    
    /// Create a not found error
    pub fn not_found(resource_type: impl Into<String>, resource_id: impl Into<String>) -> Self {
        Self::NotFound {
            resource_type: resource_type.into(),
            resource_id: resource_id.into(),
        }
    }
    
    /// Create a rate limit error
    pub fn rate_limit(message: impl Into<String>, retry_after: Option<u64>) -> Self {
        Self::RateLimit {
            message: message.into(),
            retry_after,
        }
    }
    
    /// Create a network error
    pub fn network(message: impl Into<String>, url: Option<impl Into<String>>) -> Self {
        Self::Network {
            message: message.into(),
            url: url.map(|u| u.into()),
        }
    }
    
    /// Create a configuration error
    pub fn configuration(message: impl Into<String>, config_key: Option<impl Into<String>>) -> Self {
        Self::Configuration {
            message: message.into(),
            config_key: config_key.map(|k| k.into()),
        }
    }
    
    /// Create an internal error
    pub fn internal(message: impl Into<String>, context: Option<impl Into<String>>) -> Self {
        Self::Internal {
            message: message.into(),
            context: context.map(|c| c.into()),
        }
    }
    
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> u16 {
        match self {
            OpenMemoryError::Storage { .. } => 500,
            OpenMemoryError::Authentication { .. } => 401,
            OpenMemoryError::OpenAI { status_code, .. } => status_code.unwrap_or(500),
            OpenMemoryError::Validation { .. } => 400,
            OpenMemoryError::NotFound { .. } => 404,
            OpenMemoryError::RateLimit { .. } => 429,
            OpenMemoryError::Network { .. } => 502,
            OpenMemoryError::Configuration { .. } => 500,
            OpenMemoryError::Internal { .. } => 500,
        }
    }
    
    /// Get the error category for logging and metrics
    pub fn category(&self) -> &'static str {
        match self {
            OpenMemoryError::Storage { .. } => "storage",
            OpenMemoryError::Authentication { .. } => "authentication",
            OpenMemoryError::OpenAI { .. } => "openai",
            OpenMemoryError::Validation { .. } => "validation",
            OpenMemoryError::NotFound { .. } => "not_found",
            OpenMemoryError::RateLimit { .. } => "rate_limit",
            OpenMemoryError::Network { .. } => "network",
            OpenMemoryError::Configuration { .. } => "configuration",
            OpenMemoryError::Internal { .. } => "internal",
        }
    }
    
    /// Check if this error is retriable
    pub fn is_retriable(&self) -> bool {
        match self {
            OpenMemoryError::Network { .. } => true,
            OpenMemoryError::RateLimit { .. } => true,
            OpenMemoryError::OpenAI { status_code, .. } => {
                matches!(status_code, Some(429) | Some(500) | Some(502) | Some(503) | Some(504))
            }
            _ => false,
        }
    }
}

impl fmt::Display for OpenMemoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OpenMemoryError::Storage { message, operation } => {
                write!(f, "Storage error in '{}': {}", operation, message)
            }
            OpenMemoryError::Authentication { message, auth_type } => {
                write!(f, "Authentication error ({}): {}", auth_type, message)
            }
            OpenMemoryError::OpenAI { message, status_code } => {
                match status_code {
                    Some(code) => write!(f, "OpenAI API error ({}): {}", code, message),
                    None => write!(f, "OpenAI API error: {}", message),
                }
            }
            OpenMemoryError::Validation { message, field } => {
                match field {
                    Some(field) => write!(f, "Validation error in '{}': {}", field, message),
                    None => write!(f, "Validation error: {}", message),
                }
            }
            OpenMemoryError::NotFound { resource_type, resource_id } => {
                write!(f, "{} '{}' not found", resource_type, resource_id)
            }
            OpenMemoryError::RateLimit { message, retry_after } => {
                match retry_after {
                    Some(retry) => write!(f, "Rate limit exceeded: {} (retry after {}s)", message, retry),
                    None => write!(f, "Rate limit exceeded: {}", message),
                }
            }
            OpenMemoryError::Network { message, url } => {
                match url {
                    Some(url) => write!(f, "Network error for '{}': {}", url, message),
                    None => write!(f, "Network error: {}", message),
                }
            }
            OpenMemoryError::Configuration { message, config_key } => {
                match config_key {
                    Some(key) => write!(f, "Configuration error for '{}': {}", key, message),
                    None => write!(f, "Configuration error: {}", message),
                }
            }
            OpenMemoryError::Internal { message, context } => {
                match context {
                    Some(context) => write!(f, "Internal error in '{}': {}", context, message),
                    None => write!(f, "Internal error: {}", message),
                }
            }
        }
    }
}

impl std::error::Error for OpenMemoryError {}

/// Result type alias for OpenMemory operations
pub type Result<T> = std::result::Result<T, OpenMemoryError>;

/// Convert from storage string errors
impl From<String> for OpenMemoryError {
    fn from(s: String) -> Self {
        if s.contains("not found") || s.contains("Not found") {
            OpenMemoryError::not_found("resource", s)
        } else if s.contains("auth") || s.contains("token") || s.contains("unauthorized") {
            OpenMemoryError::authentication(s, "unknown")
        } else if s.contains("storage") || s.contains("Storage") {
            OpenMemoryError::storage(s, "unknown")
        } else {
            OpenMemoryError::internal(s, None::<String>)
        }
    }
}

/// HTTP response error structure for API endpoints
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: u16,
    pub category: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,
}

impl From<OpenMemoryError> for ErrorResponse {
    fn from(err: OpenMemoryError) -> Self {
        let retry_after = match &err {
            OpenMemoryError::RateLimit { retry_after, .. } => *retry_after,
            _ => None,
        };
        
        let context = match &err {
            OpenMemoryError::Storage { operation, .. } => Some(operation.clone()),
            OpenMemoryError::Authentication { auth_type, .. } => Some(auth_type.clone()),
            OpenMemoryError::Validation { field, .. } => field.clone(),
            OpenMemoryError::NotFound { resource_type, .. } => Some(resource_type.clone()),
            OpenMemoryError::Network { url, .. } => url.clone(),
            OpenMemoryError::Configuration { config_key, .. } => config_key.clone(),
            OpenMemoryError::Internal { context, .. } => context.clone(),
            _ => None,
        };
        
        Self {
            error: err.to_string(),
            code: err.status_code(),
            category: err.category().to_string(),
            retry_after,
            context,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_creation() {
        let storage_err = OpenMemoryError::storage("Database connection failed", "save_memory");
        assert_eq!(storage_err.status_code(), 500);
        assert_eq!(storage_err.category(), "storage");
        assert!(!storage_err.is_retriable());
        
        let auth_err = OpenMemoryError::authentication("Invalid token", "bearer");
        assert_eq!(auth_err.status_code(), 401);
        assert_eq!(auth_err.category(), "authentication");
        
        let not_found_err = OpenMemoryError::not_found("memory", "mem_123");
        assert_eq!(not_found_err.status_code(), 404);
        assert_eq!(not_found_err.category(), "not_found");
    }
    
    #[test]
    fn test_retriable_errors() {
        let network_err = OpenMemoryError::network("Connection timeout", Some("https://api.openai.com"));
        assert!(network_err.is_retriable());
        
        let rate_limit_err = OpenMemoryError::rate_limit("Too many requests", Some(60));
        assert!(rate_limit_err.is_retriable());
        
        let openai_err = OpenMemoryError::openai("Service unavailable", Some(503));
        assert!(openai_err.is_retriable());
    }
    
    #[test]
    fn test_error_display() {
        let err = OpenMemoryError::validation("Content too long", Some("content"));
        assert_eq!(err.to_string(), "Validation error in 'content': Content too long");
        
        let err = OpenMemoryError::not_found("memory", "mem_123");
        assert_eq!(err.to_string(), "memory 'mem_123' not found");
    }
}