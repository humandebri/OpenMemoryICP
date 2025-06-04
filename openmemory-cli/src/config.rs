use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum AuthMethod {
    LocalIdentity,
    ApiKey(String),
    AccessToken(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub auth_method: AuthMethod,
    pub network: String,
    pub canister_id: String,
    pub openai_api_key: Option<String>,
}

impl Config {
    pub fn config_dir() -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?
            .join("openmemory");
        
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)?;
        }
        
        Ok(config_dir)
    }
    
    pub fn config_path() -> Result<PathBuf> {
        Ok(Self::config_dir()?.join("config.json"))
    }
    
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;
        
        if !config_path.exists() {
            // Return default config if file doesn't exist
            return Ok(Self::default());
        }
        
        let contents = fs::read_to_string(config_path)?;
        let config = serde_json::from_str(&contents)?;
        Ok(config)
    }
    
    pub fn save(&self) -> Result<()> {
        let config_path = Self::config_path()?;
        let contents = serde_json::to_string_pretty(self)?;
        fs::write(config_path, contents)?;
        Ok(())
    }
    
    pub fn get_network_url(&self) -> &str {
        match self.network.as_str() {
            "local" => "http://localhost:4943",
            "ic" => "https://ic0.app",
            url => url, // Custom URL
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            auth_method: AuthMethod::LocalIdentity,
            network: "ic".to_string(),
            canister_id: "77fv5-oiaaa-aaaal-qsoea-cai".to_string(),
            openai_api_key: None,
        }
    }
}