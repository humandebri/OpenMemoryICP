use crate::errors::{OpenMemoryError, Result};
use crate::types::*;
use candid::Principal;

/// Maximum content size for memories (10KB)
pub const MAX_MEMORY_CONTENT_SIZE: usize = 10 * 1024;

/// Maximum number of memories per user
pub const MAX_MEMORIES_PER_USER: usize = 10_000;

/// Maximum number of tags per memory
pub const MAX_TAGS_PER_MEMORY: usize = 20;

/// Maximum tag length
pub const MAX_TAG_LENGTH: usize = 50;

/// Maximum metadata key length
pub const MAX_METADATA_KEY_LENGTH: usize = 100;

/// Maximum metadata value length
pub const MAX_METADATA_VALUE_LENGTH: usize = 500;

/// Maximum number of metadata entries per memory
pub const MAX_METADATA_ENTRIES: usize = 20;

/// Maximum conversation content size (100KB)
pub const MAX_CONVERSATION_CONTENT_SIZE: usize = 100 * 1024;

/// Maximum conversation title length
pub const MAX_CONVERSATION_TITLE_LENGTH: usize = 200;

/// Validation for add memory requests
pub fn validate_add_memory_request(req: &AddMemoryRequest) -> Result<()> {
    // Validate content
    if req.content.trim().is_empty() {
        return Err(OpenMemoryError::validation(
            "Content cannot be empty",
            Some("content")
        ));
    }
    
    if req.content.len() > MAX_MEMORY_CONTENT_SIZE {
        return Err(OpenMemoryError::validation(
            format!("Content too large (max {} bytes)", MAX_MEMORY_CONTENT_SIZE),
            Some("content")
        ));
    }
    
    // Validate tags
    if let Some(ref tags) = req.tags {
        if tags.len() > MAX_TAGS_PER_MEMORY {
            return Err(OpenMemoryError::validation(
                format!("Too many tags (max {})", MAX_TAGS_PER_MEMORY),
                Some("tags")
            ));
        }
        
        for tag in tags {
            if tag.trim().is_empty() {
                return Err(OpenMemoryError::validation(
                    "Tag cannot be empty",
                    Some("tags")
                ));
            }
            
            if tag.len() > MAX_TAG_LENGTH {
                return Err(OpenMemoryError::validation(
                    format!("Tag too long (max {} characters)", MAX_TAG_LENGTH),
                    Some("tags")
                ));
            }
            
            if !is_valid_tag(tag) {
                return Err(OpenMemoryError::validation(
                    format!("Invalid tag '{}': must contain only alphanumeric characters, hyphens, and underscores", tag),
                    Some("tags")
                ));
            }
        }
    }
    
    // Validate metadata
    if let Some(ref metadata) = req.metadata {
        if metadata.len() > MAX_METADATA_ENTRIES {
            return Err(OpenMemoryError::validation(
                format!("Too many metadata entries (max {})", MAX_METADATA_ENTRIES),
                Some("metadata")
            ));
        }
        
        for (key, value) in metadata {
            if key.trim().is_empty() {
                return Err(OpenMemoryError::validation(
                    "Metadata key cannot be empty",
                    Some("metadata")
                ));
            }
            
            if key.len() > MAX_METADATA_KEY_LENGTH {
                return Err(OpenMemoryError::validation(
                    format!("Metadata key too long (max {} characters)", MAX_METADATA_KEY_LENGTH),
                    Some("metadata")
                ));
            }
            
            if value.len() > MAX_METADATA_VALUE_LENGTH {
                return Err(OpenMemoryError::validation(
                    format!("Metadata value too long (max {} characters)", MAX_METADATA_VALUE_LENGTH),
                    Some("metadata")
                ));
            }
        }
    }
    
    Ok(())
}

/// Validation for save conversation requests
pub fn validate_save_conversation_request(req: &SaveConversationRequest) -> Result<()> {
    // Validate title
    if req.title.trim().is_empty() {
        return Err(OpenMemoryError::validation(
            "Title cannot be empty",
            Some("title")
        ));
    }
    
    if req.title.len() > MAX_CONVERSATION_TITLE_LENGTH {
        return Err(OpenMemoryError::validation(
            format!("Title too long (max {} characters)", MAX_CONVERSATION_TITLE_LENGTH),
            Some("title")
        ));
    }
    
    // Validate content
    if req.content.trim().is_empty() {
        return Err(OpenMemoryError::validation(
            "Content cannot be empty",
            Some("content")
        ));
    }
    
    if req.content.len() > MAX_CONVERSATION_CONTENT_SIZE {
        return Err(OpenMemoryError::validation(
            format!("Content too large (max {} bytes)", MAX_CONVERSATION_CONTENT_SIZE),
            Some("content")
        ));
    }
    
    // Validate metadata if present
    if let Some(ref metadata) = req.metadata {
        if metadata.len() > MAX_METADATA_ENTRIES {
            return Err(OpenMemoryError::validation(
                format!("Too many metadata entries (max {})", MAX_METADATA_ENTRIES),
                Some("metadata")
            ));
        }
        
        for (key, value) in metadata {
            if key.len() > MAX_METADATA_KEY_LENGTH {
                return Err(OpenMemoryError::validation(
                    format!("Metadata key too long (max {} characters)", MAX_METADATA_KEY_LENGTH),
                    Some("metadata")
                ));
            }
            
            if value.len() > MAX_METADATA_VALUE_LENGTH {
                return Err(OpenMemoryError::validation(
                    format!("Metadata value too long (max {} characters)", MAX_METADATA_VALUE_LENGTH),
                    Some("metadata")
                ));
            }
        }
    }
    
    Ok(())
}

/// Validation for search requests
pub fn validate_search_request(req: &SearchRequest) -> Result<()> {
    if req.query.trim().is_empty() {
        return Err(OpenMemoryError::validation(
            "Search query cannot be empty",
            Some("query")
        ));
    }
    
    if req.query.len() > 1000 {
        return Err(OpenMemoryError::validation(
            "Search query too long (max 1000 characters)",
            Some("query")
        ));
    }
    
    if let Some(limit) = req.limit {
        if limit == 0 {
            return Err(OpenMemoryError::validation(
                "Limit must be greater than 0",
                Some("limit")
            ));
        }
        
        if limit > 100 {
            return Err(OpenMemoryError::validation(
                "Limit too large (max 100)",
                Some("limit")
            ));
        }
    }
    
    // Validate tags if present
    if let Some(ref tags) = req.tags {
        if tags.len() > MAX_TAGS_PER_MEMORY {
            return Err(OpenMemoryError::validation(
                format!("Too many filter tags (max {})", MAX_TAGS_PER_MEMORY),
                Some("tags")
            ));
        }
        
        for tag in tags {
            if !is_valid_tag(tag) {
                return Err(OpenMemoryError::validation(
                    format!("Invalid filter tag '{}': must contain only alphanumeric characters, hyphens, and underscores", tag),
                    Some("tags")
                ));
            }
        }
    }
    
    Ok(())
}

/// Validation for pagination parameters
pub fn validate_pagination(limit: Option<usize>, offset: Option<usize>) -> Result<(usize, usize)> {
    let validated_limit = match limit {
        Some(l) => {
            if l == 0 {
                return Err(OpenMemoryError::validation(
                    "Limit must be greater than 0",
                    Some("limit")
                ));
            }
            if l > 100 {
                return Err(OpenMemoryError::validation(
                    "Limit too large (max 100)",
                    Some("limit")
                ));
            }
            l
        }
        None => 20, // Default limit
    };
    
    let validated_offset = offset.unwrap_or(0);
    
    Ok((validated_limit, validated_offset))
}

/// Validation for user quota limits
pub fn validate_user_quota(user_id: Principal, memory_count: usize) -> Result<()> {
    if memory_count >= MAX_MEMORIES_PER_USER {
        return Err(OpenMemoryError::validation(
            format!("Memory limit exceeded (max {} memories per user)", MAX_MEMORIES_PER_USER),
            Some("user_quota")
        ));
    }
    
    Ok(())
}

/// Validation for token creation requests
pub fn validate_create_token_request(req: &CreateTokenRequest) -> Result<()> {
    if let Some(ref description) = req.description {
        if description.trim().is_empty() {
            return Err(OpenMemoryError::validation(
                "Token description cannot be empty",
                Some("description")
            ));
        }
        
        if description.len() > 200 {
            return Err(OpenMemoryError::validation(
                "Token description too long (max 200 characters)",
                Some("description")
            ));
        }
    }
    
    if let Some(expires_in_days) = req.expires_in_days {
        if expires_in_days == 0 {
            return Err(OpenMemoryError::validation(
                "Token expiration must be at least 1 day",
                Some("expires_in_days")
            ));
        }
        
        if expires_in_days > 365 {
            return Err(OpenMemoryError::validation(
                "Token expiration too long (max 365 days)",
                Some("expires_in_days")
            ));
        }
    }
    
    Ok(())
}

/// Check if a tag is valid (alphanumeric, hyphens, underscores only)
fn is_valid_tag(tag: &str) -> bool {
    if tag.is_empty() {
        return false;
    }
    
    tag.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Sanitize text content by removing control characters and limiting length
pub fn sanitize_content(content: &str, max_length: usize) -> String {
    let sanitized: String = content
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .take(max_length)
        .collect();
    
    sanitized.trim().to_string()
}

/// Sanitize metadata by removing invalid characters and limiting lengths
pub fn sanitize_metadata(metadata: &std::collections::HashMap<String, String>) -> std::collections::HashMap<String, String> {
    metadata
        .iter()
        .take(MAX_METADATA_ENTRIES)
        .map(|(k, v)| {
            let clean_key = sanitize_content(k, MAX_METADATA_KEY_LENGTH);
            let clean_value = sanitize_content(v, MAX_METADATA_VALUE_LENGTH);
            (clean_key, clean_value)
        })
        .filter(|(k, _)| !k.is_empty())
        .collect()
}

/// Sanitize tags by removing invalid characters and limiting count
pub fn sanitize_tags(tags: &[String]) -> Vec<String> {
    tags
        .iter()
        .take(MAX_TAGS_PER_MEMORY)
        .map(|tag| {
            tag.chars()
                .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
                .take(MAX_TAG_LENGTH)
                .collect::<String>()
                .to_lowercase()
        })
        .filter(|tag| !tag.is_empty())
        .collect()
}

#[derive(Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub limit: Option<usize>,
    pub tags: Option<Vec<String>>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    
    #[test]
    fn test_validate_add_memory_request() {
        // Valid request
        let valid_req = AddMemoryRequest {
            content: "This is a valid memory".to_string(),
            tags: Some(vec!["tag1".to_string(), "tag-2".to_string()]),
            metadata: None,
        };
        assert!(validate_add_memory_request(&valid_req).is_ok());
        
        // Empty content
        let empty_content = AddMemoryRequest {
            content: "".to_string(),
            tags: None,
            metadata: None,
        };
        assert!(validate_add_memory_request(&empty_content).is_err());
        
        // Content too large
        let large_content = AddMemoryRequest {
            content: "x".repeat(MAX_MEMORY_CONTENT_SIZE + 1),
            tags: None,
            metadata: None,
        };
        assert!(validate_add_memory_request(&large_content).is_err());
        
        // Invalid tag
        let invalid_tag = AddMemoryRequest {
            content: "Valid content".to_string(),
            tags: Some(vec!["invalid tag!".to_string()]),
            metadata: None,
        };
        assert!(validate_add_memory_request(&invalid_tag).is_err());
    }
    
    #[test]
    fn test_is_valid_tag() {
        assert!(is_valid_tag("valid_tag"));
        assert!(is_valid_tag("valid-tag"));
        assert!(is_valid_tag("validtag123"));
        assert!(!is_valid_tag("invalid tag"));
        assert!(!is_valid_tag("invalid@tag"));
        assert!(!is_valid_tag(""));
    }
    
    #[test]
    fn test_sanitize_content() {
        let content = "Hello\x00world\x01with\x02control\x03chars\nand\ttabs";
        let sanitized = sanitize_content(content, 100);
        assert_eq!(sanitized, "Helloworldwithcontrolchars\nand\ttabs");
        
        let long_content = "x".repeat(200);
        let sanitized = sanitize_content(&long_content, 50);
        assert_eq!(sanitized.len(), 50);
    }
    
    #[test]
    fn test_sanitize_tags() {
        let tags = vec![
            "Valid_Tag".to_string(),
            "invalid tag!".to_string(),
            "another-valid".to_string(),
            "".to_string(),
        ];
        
        let sanitized = sanitize_tags(&tags);
        assert_eq!(sanitized, vec!["valid_tag", "invalidtag", "another-valid"]);
    }
}