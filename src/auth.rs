use crate::types::*;
use crate::utils::*;
use candid::Principal;
use ic_cdk::api::time;

pub async fn authenticate_request(req: &HttpRequest) -> Result<Principal, String> {
    let token = extract_bearer_token(&req.headers)
        .ok_or("Missing Authorization header")?;
    
    verify_token(&token).await
}

pub async fn verify_token(token: &str) -> Result<Principal, String> {
    // Simple token verification for development
    // In production, this should integrate with Internet Identity or proper JWT verification
    
    match token {
        "test-token" => {
            // Return a test principal for development
            Ok(Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai")
                .map_err(|e| format!("Invalid principal: {}", e))?)
        }
        "demo-user" => {
            Ok(Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai")
                .map_err(|e| format!("Invalid principal: {}", e))?)
        }
        _ => {
            // For now, any other token is considered invalid
            // TODO: Implement proper token verification with Internet Identity
            Err("Invalid token".to_string())
        }
    }
}

pub fn generate_auth_token(user_id: Principal) -> AuthToken {
    AuthToken {
        token: generate_uuid(),
        user_id,
        expires_at: time() + (24 * 60 * 60 * 1_000_000_000), // 24 hours in nanoseconds
    }
}

pub fn is_token_expired(token: &AuthToken) -> bool {
    time() > token.expires_at
}

pub fn get_caller_principal() -> Principal {
    ic_cdk::caller()
}

pub fn is_anonymous(principal: Principal) -> bool {
    principal == Principal::anonymous()
}

// TODO: Implement Internet Identity integration
pub async fn verify_internet_identity_token(_token: &str) -> Result<Principal, String> {
    Err("Internet Identity integration not implemented yet".to_string())
}

// TODO: Implement JWT token verification
pub fn verify_jwt_token(_token: &str) -> Result<Principal, String> {
    Err("JWT verification not implemented yet".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verify_token() {
        // Test with valid test token
        let future = verify_token("test-token");
        // Note: In actual tests, you'd need to use an async runtime
        
        // Test with invalid token
        let future = verify_token("invalid-token");
        // This should return an error
    }

    #[test]
    fn test_is_token_expired() {
        let token = AuthToken {
            token: "test".to_string(),
            user_id: Principal::anonymous(),
            expires_at: time() - 1000, // Expired
        };
        assert!(is_token_expired(&token));
        
        let token = AuthToken {
            token: "test".to_string(),
            user_id: Principal::anonymous(),
            expires_at: time() + 1000, // Not expired
        };
        assert!(!is_token_expired(&token));
    }

    #[test]
    fn test_is_anonymous() {
        assert!(is_anonymous(Principal::anonymous()));
        assert!(!is_anonymous(Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap()));
    }
}