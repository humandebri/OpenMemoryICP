use ic_agent::identity::{BasicIdentity, Identity};
use std::path::PathBuf;
use std::fs;
use candid::Principal;

#[derive(Debug)]
pub struct LocalIdentityManager {
    identity_path: PathBuf,
}

impl LocalIdentityManager {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .expect("Failed to get config directory");
        
        let path = config_dir
            .join("openmemory")
            .join("identity.pem");
        
        Self { identity_path: path }
    }
    
    pub fn with_custom_path(path: PathBuf) -> Self {
        Self { identity_path: path }
    }
    
    pub fn get_or_create_identity(&self) -> Result<BasicIdentity, String> {
        if self.identity_path.exists() {
            // 既存のidentityを読み込む
            BasicIdentity::from_pem_file(&self.identity_path)
                .map_err(|e| format!("Failed to load identity: {}", e))
        } else {
            // ディレクトリが存在しない場合は作成
            if let Some(parent) = self.identity_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create directory: {}", e))?;
            }
            
            // 新しいidentityを生成
            let identity = BasicIdentity::new();
            
            // PEMファイルとして保存
            identity.to_pem_file(&self.identity_path)
                .map_err(|e| format!("Failed to save identity: {}", e))?;
            
            // 権限を600に設定（所有者のみ読み書き可能）
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(&self.identity_path)
                    .map_err(|e| format!("Failed to get file metadata: {}", e))?
                    .permissions();
                perms.set_mode(0o600);
                fs::set_permissions(&self.identity_path, perms)
                    .map_err(|e| format!("Failed to set file permissions: {}", e))?;
            }
            
            println!("Created new identity at: {:?}", self.identity_path);
            
            Ok(identity)
        }
    }
    
    pub fn get_principal(&self) -> Result<Principal, String> {
        let identity = self.get_or_create_identity()?;
        identity.sender()
            .map_err(|e| format!("Failed to get principal: {}", e))
    }
    
    pub fn delete_identity(&self) -> Result<(), String> {
        if self.identity_path.exists() {
            fs::remove_file(&self.identity_path)
                .map_err(|e| format!("Failed to delete identity: {}", e))?;
            println!("Deleted identity at: {:?}", self.identity_path);
        }
        Ok(())
    }
    
    pub fn exists(&self) -> bool {
        self.identity_path.exists()
    }
    
    pub fn get_path(&self) -> &PathBuf {
        &self.identity_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_create_new_identity() {
        let temp_dir = TempDir::new().unwrap();
        let identity_path = temp_dir.path().join("test_identity.pem");
        
        let manager = LocalIdentityManager::with_custom_path(identity_path.clone());
        
        assert!(!manager.exists());
        
        let identity = manager.get_or_create_identity().unwrap();
        assert!(manager.exists());
        
        // Principalが取得できることを確認
        let principal = identity.sender().unwrap();
        assert!(!principal.as_slice().is_empty());
    }
    
    #[test]
    fn test_load_existing_identity() {
        let temp_dir = TempDir::new().unwrap();
        let identity_path = temp_dir.path().join("test_identity.pem");
        
        let manager = LocalIdentityManager::with_custom_path(identity_path.clone());
        
        // 最初のidentityを作成
        let identity1 = manager.get_or_create_identity().unwrap();
        let principal1 = identity1.sender().unwrap();
        
        // 同じパスから再度読み込む
        let identity2 = manager.get_or_create_identity().unwrap();
        let principal2 = identity2.sender().unwrap();
        
        // 同じPrincipalであることを確認
        assert_eq!(principal1, principal2);
    }
    
    #[test]
    fn test_delete_identity() {
        let temp_dir = TempDir::new().unwrap();
        let identity_path = temp_dir.path().join("test_identity.pem");
        
        let manager = LocalIdentityManager::with_custom_path(identity_path);
        
        manager.get_or_create_identity().unwrap();
        assert!(manager.exists());
        
        manager.delete_identity().unwrap();
        assert!(!manager.exists());
    }
}