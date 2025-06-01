use crate::types::*;
use candid::Principal;
use ic_cdk::api::time;
use std::collections::HashMap;
use std::cell::RefCell;
use sha2::{Digest, Sha256};
use base64::{Engine, engine::general_purpose};

// Internet Identity session management
thread_local! {
    static II_SESSIONS: RefCell<HashMap<String, IISession>> = RefCell::new(HashMap::new());
    static II_DELEGATION_CACHE: RefCell<HashMap<Principal, IIDelegation>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug)]
pub struct IISession {
    pub user_principal: Principal,
    pub session_key: String,
    pub created_at: u64,
    pub expires_at: u64,
    pub delegation_chain: Vec<IIDelegation>,
}

#[derive(Clone, Debug)]
pub struct IIDelegation {
    pub delegation: String, // base64 encoded delegation
    pub signature: String,  // base64 encoded signature
    pub public_key: String, // base64 encoded public key
    pub expiration: u64,
}

#[derive(serde::Deserialize)]
pub struct IIAuthRequest {
    pub delegation_chain: Vec<IIDelegationData>,
    pub user_public_key: String,
}

#[derive(serde::Deserialize)]
pub struct IIDelegationData {
    pub delegation: String,
    pub signature: String,
}

// Internet Identity authentication
pub async fn authenticate_with_ii(auth_data: &str) -> Result<Principal, String> {
    let auth_request: IIAuthRequest = serde_json::from_str(auth_data)
        .map_err(|e| format!("Invalid II auth data: {}", e))?;
    
    // Verify delegation chain
    let principal = verify_delegation_chain(&auth_request.delegation_chain, &auth_request.user_public_key)?;
    
    // Create session
    let session = create_ii_session(principal, auth_request.delegation_chain)?;
    
    // Cache the session
    II_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session.session_key.clone(), session);
    });
    
    Ok(principal)
}

pub fn verify_ii_session(session_key: &str) -> Result<Principal, String> {
    II_SESSIONS.with(|sessions| {
        let sessions_map = sessions.borrow();
        match sessions_map.get(session_key) {
            Some(session) => {
                let current_time = time();
                if current_time > session.expires_at {
                    Err("Session expired".to_string())
                } else {
                    Ok(session.user_principal)
                }
            }
            None => Err("Invalid session".to_string())
        }
    })
}

fn verify_delegation_chain(
    delegation_chain: &[IIDelegationData], 
    _user_public_key: &str
) -> Result<Principal, String> {
    if delegation_chain.is_empty() {
        return Err("Empty delegation chain".to_string());
    }
    
    // For now, implement basic validation
    // In production, this should verify cryptographic signatures
    // and check delegation expiration times
    
    // Extract principal from the delegation chain
    // This is a simplified implementation
    let delegation_data = &delegation_chain[0];
    let delegation_bytes = general_purpose::STANDARD.decode(&delegation_data.delegation)
        .map_err(|e| format!("Invalid delegation encoding: {}", e))?;
    
    // Parse delegation to extract principal
    // This should use proper CBOR decoding in production
    let principal_str = extract_principal_from_delegation(&delegation_bytes)?;
    let principal = Principal::from_text(&principal_str)
        .map_err(|e| format!("Invalid principal: {}", e))?;
    
    Ok(principal)
}

fn extract_principal_from_delegation(delegation_bytes: &[u8]) -> Result<String, String> {
    // Simplified principal extraction
    // In production, this should properly parse the CBOR delegation
    
    // For now, return a placeholder principal based on delegation hash
    let hash = Sha256::digest(delegation_bytes);
    let hash_hex = hex::encode(&hash[..10]); // Use first 10 bytes
    
    // Generate a valid principal-like string
    Ok(format!("2vxsx-fae-{}", hash_hex))
}

fn create_ii_session(
    principal: Principal, 
    delegation_chain: Vec<IIDelegationData>
) -> Result<IISession, String> {
    let session_key = generate_session_key();
    let current_time = time();
    let expires_at = current_time + (24 * 60 * 60 * 1_000_000_000); // 24 hours
    
    let delegations: Vec<IIDelegation> = delegation_chain
        .into_iter()
        .map(|d| IIDelegation {
            delegation: d.delegation,
            signature: d.signature,
            public_key: "".to_string(), // Extract from delegation in production
            expiration: expires_at,
        })
        .collect();
    
    Ok(IISession {
        user_principal: principal,
        session_key,
        created_at: current_time,
        expires_at,
        delegation_chain: delegations,
    })
}

fn generate_session_key() -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(time().to_string());
    hasher.update(ic_cdk::caller().to_string());
    let result = hasher.finalize();
    hex::encode(result)
}

// Enhanced authentication function that supports both Bearer tokens and II
pub async fn authenticate_request_enhanced(req: &HttpRequest) -> Result<Principal, String> {
    // Check for Internet Identity session first
    if let Some(session_key) = extract_ii_session(req) {
        return verify_ii_session(&session_key);
    }
    
    // Check for Authorization header (Bearer token)
    if let Some(auth_header) = req.headers.iter()
        .find(|(name, _)| name.to_lowercase() == "authorization")
        .map(|(_, value)| value) {
        
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            return crate::auth::verify_token(token).await;
        }
    }
    
    // Check for II authentication in request body (for login endpoints)
    if !req.body.is_empty() {
        let body_str = String::from_utf8_lossy(&req.body);
        if body_str.contains("delegation_chain") {
            return authenticate_with_ii(&body_str).await;
        }
    }
    
    Err("No valid authentication found".to_string())
}

pub fn extract_ii_session(req: &HttpRequest) -> Option<String> {
    // Check for session in headers
    for (name, value) in &req.headers {
        if name.to_lowercase() == "x-ii-session" {
            return Some(value.clone());
        }
    }
    
    // Check for session in cookies
    for (name, value) in &req.headers {
        if name.to_lowercase() == "cookie" {
            if let Some(session) = extract_session_from_cookie(value) {
                return Some(session);
            }
        }
    }
    
    None
}

fn extract_session_from_cookie(cookie_header: &str) -> Option<String> {
    for cookie in cookie_header.split(';') {
        let cookie = cookie.trim();
        if cookie.starts_with("ii_session=") {
            return Some(cookie.strip_prefix("ii_session=").unwrap_or("").to_string());
        }
    }
    None
}

// Session management functions
pub fn list_active_sessions() -> Vec<IISession> {
    II_SESSIONS.with(|sessions| {
        let current_time = time();
        sessions.borrow()
            .values()
            .filter(|session| session.expires_at > current_time)
            .cloned()
            .collect()
    })
}

pub fn revoke_session(session_key: &str) -> bool {
    II_SESSIONS.with(|sessions| {
        sessions.borrow_mut().remove(session_key).is_some()
    })
}

pub fn cleanup_expired_sessions() {
    let current_time = time();
    II_SESSIONS.with(|sessions| {
        let mut sessions_map = sessions.borrow_mut();
        sessions_map.retain(|_, session| session.expires_at > current_time);
    });
}

// Helper function to add hex dependency
use hex;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_key_generation() {
        let key1 = generate_session_key();
        let key2 = generate_session_key();
        assert_ne!(key1, key2);
        assert_eq!(key1.len(), 64); // SHA256 hex string length
    }

    #[test]
    fn test_extract_session_from_cookie() {
        let cookie = "theme=dark; ii_session=abc123; lang=en";
        assert_eq!(extract_session_from_cookie(cookie), Some("abc123".to_string()));
        
        let cookie_no_session = "theme=dark; lang=en";
        assert_eq!(extract_session_from_cookie(cookie_no_session), None);
    }
}