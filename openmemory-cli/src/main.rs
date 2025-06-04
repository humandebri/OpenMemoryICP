use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use dialoguer::{Input, Password, Select};
use ic_agent::Agent;
use candid::{Encode, Decode, CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

mod local_identity;
mod config;
mod api_client;

use local_identity::LocalIdentityManager;
use config::{Config, AuthMethod};
use api_client::OpenMemoryClient;

#[derive(Parser)]
#[command(name = "openmemory")]
#[command(about = "OpenMemory CLI - Personal AI memory system on Internet Computer", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
    
    #[arg(short, long, global = true)]
    /// Use specific network (local, ic, or custom URL)
    network: Option<String>,
    
    #[arg(short, long, global = true)]
    /// Canister ID (overrides config)
    canister: Option<String>,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize CLI configuration
    Init,
    
    /// Show current identity and configuration
    Whoami,
    
    /// Add a new memory
    Add {
        /// Memory content
        content: String,
        
        /// Tags (comma-separated)
        #[arg(short, long)]
        tags: Option<String>,
        
        /// Metadata as JSON
        #[arg(short, long)]
        metadata: Option<String>,
    },
    
    /// Search memories
    Search {
        /// Search query
        query: String,
        
        /// Maximum results
        #[arg(short, long, default_value = "10")]
        limit: usize,
    },
    
    /// List recent memories
    List {
        /// Number of memories to show
        #[arg(short, long, default_value = "10")]
        count: usize,
    },
    
    /// Delete a memory
    Delete {
        /// Memory ID
        id: String,
    },
    
    /// Manage API configuration
    Config {
        #[command(subcommand)]
        subcommand: ConfigCommands,
    },
    
    /// Manage authentication
    Auth {
        #[command(subcommand)]
        subcommand: AuthCommands,
    },
    
    /// Manage access tokens (requires II authentication first)
    Token {
        #[command(subcommand)]
        subcommand: TokenCommands,
    },
}

#[derive(Subcommand)]
enum ConfigCommands {
    /// Set OpenAI API key
    SetOpenAIKey,
    
    /// Set canister ID
    SetCanister {
        id: String,
    },
    
    /// Show current configuration
    Show,
}

#[derive(Subcommand)]
enum AuthCommands {
    /// Switch authentication method
    Switch,
    
    /// Show current principal
    Principal,
    
    /// Delete local identity
    Reset,
}

#[derive(Subcommand)]
enum TokenCommands {
    /// Create a new access token (requires II authentication)
    Create {
        /// Description for the token
        #[arg(short, long)]
        description: Option<String>,
        
        /// Token validity in days (default: 30)
        #[arg(short, long, default_value = "30")]
        expires_in_days: u32,
    },
    
    /// List all tokens for current user
    List,
    
    /// Use an existing access token for CLI authentication
    Use {
        /// Access token to use
        token: String,
    },
    
    /// Revoke a token
    Revoke {
        /// Token to revoke
        token: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    
    // Load or create config
    let mut config = Config::load()?;
    
    // Override with CLI arguments if provided
    if let Some(network) = cli.network {
        config.network = network;
    }
    if let Some(canister) = cli.canister {
        config.canister_id = canister;
    }
    
    match cli.command {
        Commands::Init => {
            init_command().await?;
        }
        Commands::Whoami => {
            whoami_command(&config).await?;
        }
        Commands::Add { content, tags, metadata } => {
            let client = create_client(&config).await?;
            add_memory_command(client, content, tags, metadata).await?;
        }
        Commands::Search { query, limit } => {
            let client = create_client(&config).await?;
            search_command(client, query, limit).await?;
        }
        Commands::List { count } => {
            let client = create_client(&config).await?;
            list_command(client, count).await?;
        }
        Commands::Delete { id } => {
            let client = create_client(&config).await?;
            delete_command(client, id).await?;
        }
        Commands::Config { subcommand } => {
            handle_config_command(subcommand, &mut config).await?;
        }
        Commands::Auth { subcommand } => {
            handle_auth_command(subcommand, &mut config).await?;
        }
        Commands::Token { subcommand } => {
            handle_token_command(subcommand, &mut config).await?;
        }
    }
    
    Ok(())
}

async fn init_command() -> Result<()> {
    println!("{}", "Welcome to OpenMemory CLI!".bright_cyan());
    println!("Let's set up your configuration.\n");
    
    // Choose authentication method
    let auth_methods = vec!["Local Identity (Recommended)", "API Key", "Access Token"];
    let auth_selection = Select::new()
        .with_prompt("Choose authentication method")
        .items(&auth_methods)
        .default(0)
        .interact()?;
    
    let auth_method = match auth_selection {
        0 => {
            let manager = LocalIdentityManager::new();
            let identity = manager.get_or_create_identity()?;
            let principal = identity.sender()?;
            println!("\n{} {}", "Created identity with Principal:".green(), principal.to_text().bright_yellow());
            AuthMethod::LocalIdentity
        }
        1 => {
            let api_key: String = Input::new()
                .with_prompt("Enter your API key")
                .interact()?;
            AuthMethod::ApiKey(api_key)
        }
        2 => {
            let token: String = Input::new()
                .with_prompt("Enter your access token")
                .interact()?;
            AuthMethod::AccessToken(token)
        }
        _ => unreachable!(),
    };
    
    // Choose network
    let networks = vec!["Internet Computer (Mainnet)", "Local Development"];
    let network_selection = Select::new()
        .with_prompt("Choose network")
        .items(&networks)
        .default(0)
        .interact()?;
    
    let network = match network_selection {
        0 => "ic".to_string(),
        1 => "local".to_string(),
        _ => unreachable!(),
    };
    
    // Get canister ID
    let canister_id: String = Input::new()
        .with_prompt("Enter OpenMemory canister ID")
        .default("77fv5-oiaaa-aaaal-qsoea-cai".to_string())
        .interact()?;
    
    // Save configuration
    let config = Config {
        auth_method,
        network,
        canister_id,
        openai_api_key: None,
    };
    
    config.save()?;
    
    println!("\n{}", "Configuration saved successfully!".green());
    println!("You can now start using OpenMemory CLI.");
    println!("\nTry: {} to add your first memory", "openmemory add \"My first memory\"".bright_cyan());
    
    Ok(())
}

async fn whoami_command(config: &Config) -> Result<()> {
    match &config.auth_method {
        AuthMethod::LocalIdentity => {
            let manager = LocalIdentityManager::new();
            let principal = manager.get_principal()?;
            println!("{} {}", "Principal:".bright_blue(), principal.to_text());
        }
        AuthMethod::ApiKey(_) => {
            println!("{}", "Using API key authentication".yellow());
        }
        AuthMethod::AccessToken(token) => {
            println!("{} {}", "Access Token:".bright_blue(), format!("{}...", &token[..20]).dim());
            // Try to get principal by making a test request
            if let Ok(client) = create_client(config).await {
                println!("{}", "Token is valid and authenticated".green());
            } else {
                println!("{}", "Warning: Token may be invalid".yellow());
            }
        }
    }
    
    println!("{} {}", "Network:".bright_blue(), config.network);
    println!("{} {}", "Canister:".bright_blue(), config.canister_id);
    
    if let Some(ref openai_key) = config.openai_api_key {
        println!("{} {}", "OpenAI Key:".bright_blue(), 
            format!("{}...", &openai_key[..10]).dim());
    }
    
    Ok(())
}

async fn create_client(config: &Config) -> Result<OpenMemoryClient> {
    OpenMemoryClient::new(config).await
}

async fn add_memory_command(
    client: OpenMemoryClient,
    content: String,
    tags: Option<String>,
    metadata: Option<String>,
) -> Result<()> {
    let tags_vec = tags
        .map(|t| t.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();
    
    let metadata_map = if let Some(m) = metadata {
        serde_json::from_str(&m)?
    } else {
        std::collections::HashMap::new()
    };
    
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Adding memory...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    
    let memory_id = client.add_memory(content, tags_vec, metadata_map).await?;
    
    spinner.finish_with_message(format!("{} Memory added: {}", "✓".green(), memory_id.bright_yellow()));
    
    Ok(())
}

async fn search_command(
    client: OpenMemoryClient,
    query: String,
    limit: usize,
) -> Result<()> {
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Searching...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    
    let results = client.search(&query, limit).await?;
    
    spinner.finish_and_clear();
    
    if results.is_empty() {
        println!("{}", "No memories found.".yellow());
    } else {
        println!("{}", format!("Found {} memories:", results.len()).bright_green());
        println!();
        
        for (i, memory) in results.iter().enumerate() {
            println!("{} {}", 
                format!("{}.", i + 1).bright_blue(),
                memory.id.bright_yellow()
            );
            println!("  {}", memory.content.trim());
            if !memory.tags.is_empty() {
                println!("  {} {}", "Tags:".dim(), memory.tags.join(", ").dim());
            }
            println!();
        }
    }
    
    Ok(())
}

async fn list_command(
    client: OpenMemoryClient,
    count: usize,
) -> Result<()> {
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Loading memories...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    
    let memories = client.list_memories(count).await?;
    
    spinner.finish_and_clear();
    
    if memories.is_empty() {
        println!("{}", "No memories found.".yellow());
    } else {
        println!("{}", format!("Recent {} memories:", memories.len()).bright_green());
        println!();
        
        for (i, memory) in memories.iter().enumerate() {
            println!("{} {} {}", 
                format!("{}.", i + 1).bright_blue(),
                memory.id.bright_yellow(),
                format!("({})", format_timestamp(memory.created_at)).dim()
            );
            println!("  {}", memory.content.trim());
            if !memory.tags.is_empty() {
                println!("  {} {}", "Tags:".dim(), memory.tags.join(", ").dim());
            }
            println!();
        }
    }
    
    Ok(())
}

async fn delete_command(
    client: OpenMemoryClient,
    id: String,
) -> Result<()> {
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Deleting memory...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    
    client.delete_memory(&id).await?;
    
    spinner.finish_with_message(format!("{} Memory deleted", "✓".green()));
    
    Ok(())
}

async fn handle_config_command(command: ConfigCommands, config: &mut Config) -> Result<()> {
    match command {
        ConfigCommands::SetOpenAIKey => {
            let key = Password::new()
                .with_prompt("Enter OpenAI API key")
                .interact()?;
            config.openai_api_key = Some(key);
            config.save()?;
            println!("{}", "OpenAI API key saved".green());
        }
        ConfigCommands::SetCanister { id } => {
            config.canister_id = id.clone();
            config.save()?;
            println!("{} {}", "Canister ID set to:".green(), id.bright_yellow());
        }
        ConfigCommands::Show => {
            println!("{}", serde_json::to_string_pretty(config)?);
        }
    }
    Ok(())
}

async fn handle_auth_command(command: AuthCommands, config: &mut Config) -> Result<()> {
    match command {
        AuthCommands::Switch => {
            // Similar to init, but only for auth method
            let auth_methods = vec!["Local Identity", "API Key", "Access Token"];
            let auth_selection = Select::new()
                .with_prompt("Choose authentication method")
                .items(&auth_methods)
                .interact()?;
            
            config.auth_method = match auth_selection {
                0 => {
                    let manager = LocalIdentityManager::new();
                    let identity = manager.get_or_create_identity()?;
                    let principal = identity.sender()?;
                    println!("{} {}", "Using Principal:".green(), principal.to_text().bright_yellow());
                    AuthMethod::LocalIdentity
                }
                1 => {
                    let api_key: String = Input::new()
                        .with_prompt("Enter your API key")
                        .interact()?;
                    AuthMethod::ApiKey(api_key)
                }
                2 => {
                    let token: String = Input::new()
                        .with_prompt("Enter your access token")
                        .interact()?;
                    AuthMethod::AccessToken(token)
                }
                _ => unreachable!(),
            };
            
            config.save()?;
            println!("{}", "Authentication method updated".green());
        }
        AuthCommands::Principal => {
            match &config.auth_method {
                AuthMethod::LocalIdentity => {
                    let manager = LocalIdentityManager::new();
                    let principal = manager.get_principal()?;
                    println!("{}", principal.to_text());
                }
                AuthMethod::ApiKey(_) => {
                    println!("{}", "Using API key authentication".yellow());
                }
            }
        }
        AuthCommands::Reset => {
            let manager = LocalIdentityManager::new();
            manager.delete_identity()?;
            println!("{}", "Local identity deleted".yellow());
        }
    }
    Ok(())
}

async fn handle_token_command(command: TokenCommands, config: &mut Config) -> Result<()> {
    match command {
        TokenCommands::Create { description, expires_in_days } => {
            // Must use II authentication to create tokens
            match &config.auth_method {
                AuthMethod::AccessToken(_) => {
                    println!("{}", "Error: Cannot create tokens using access token authentication.".red());
                    println!("Please switch to Internet Identity authentication first:");
                    println!("  {}", "openmemory auth switch".cyan());
                    return Ok(());
                }
                _ => {}
            }
            
            let client = create_client(config).await?;
            
            let spinner = indicatif::ProgressBar::new_spinner();
            spinner.set_message("Creating access token...");
            spinner.enable_steady_tick(std::time::Duration::from_millis(100));
            
            match client.create_access_token(description.clone(), expires_in_days).await {
                Ok((token, expires_at)) => {
                    spinner.finish_and_clear();
                    
                    println!("{}", "✓ Access token created successfully!".green());
                    println!();
                    println!("{} {}", "Token:".bright_blue(), token.bright_yellow());
                    println!("{} {}", "Expires:".bright_blue(), format_timestamp(expires_at));
                    if let Some(desc) = description {
                        println!("{} {}", "Description:".bright_blue(), desc);
                    }
                    println!();
                    println!("{}", "To use this token:".bright_cyan());
                    println!("  {}", format!("openmemory token use {}", token).dim());
                    println!();
                    println!("{}", "⚠️  Store this token securely. It won't be shown again.".yellow());
                }
                Err(e) => {
                    spinner.finish_and_clear();
                    println!("{} {}", "Failed to create token:".red(), e);
                }
            }
        }
        TokenCommands::List => {
            // Must be authenticated to list tokens
            let client = create_client(config).await?;
            
            let spinner = indicatif::ProgressBar::new_spinner();
            spinner.set_message("Loading tokens...");
            spinner.enable_steady_tick(std::time::Duration::from_millis(100));
            
            match client.list_access_tokens().await {
                Ok(tokens) => {
                    spinner.finish_and_clear();
                    
                    if tokens.is_empty() {
                        println!("{}", "No tokens found.".yellow());
                    } else {
                        println!("{}", format!("Found {} tokens:", tokens.len()).bright_green());
                        println!();
                        
                        for (i, token_info) in tokens.iter().enumerate() {
                            println!("{} {}", 
                                format!("{}.", i + 1).bright_blue(),
                                token_info.description.as_deref().unwrap_or("Unnamed token").bright_yellow()
                            );
                            println!("  {} {}", "Created:".dim(), format_timestamp(token_info.created_at).dim());
                            println!("  {} {}", "Expires:".dim(), format_timestamp(token_info.expires_at).dim());
                            if let Some(last_used) = token_info.last_used_at {
                                println!("  {} {}", "Last used:".dim(), format_timestamp(last_used).dim());
                            } else {
                                println!("  {} {}", "Last used:".dim(), "Never".dim());
                            }
                            println!();
                        }
                    }
                }
                Err(e) => {
                    spinner.finish_and_clear();
                    println!("{} {}", "Failed to list tokens:".red(), e);
                }
            }
        }
        TokenCommands::Use { token } => {
            config.auth_method = AuthMethod::AccessToken(token.clone());
            config.save()?;
            
            println!("{}", "✓ Now using access token authentication".green());
            println!("{} {}", "Token:".bright_blue(), format!("{}...", &token[..20]).dim());
            
            // Test the token
            let test_client = create_client(config).await;
            match test_client {
                Ok(_) => {
                    println!("{}", "✓ Token is valid and working".green());
                }
                Err(e) => {
                    println!("{} {}", "⚠️  Warning: Token validation failed:".yellow(), e);
                }
            }
        }
        TokenCommands::Revoke { token } => {
            let client = create_client(config).await?;
            
            let spinner = indicatif::ProgressBar::new_spinner();
            spinner.set_message("Revoking token...");
            spinner.enable_steady_tick(std::time::Duration::from_millis(100));
            
            match client.revoke_access_token(&token).await {
                Ok(()) => {
                    spinner.finish_and_clear();
                    println!("{}", "✓ Token revoked successfully".green());
                    
                    // If the revoked token is the one currently in use, reset to LocalIdentity
                    if matches!(&config.auth_method, AuthMethod::AccessToken(current_token) if current_token == &token) {
                        config.auth_method = AuthMethod::LocalIdentity;
                        config.save()?;
                        println!("{}", "→ Switched back to LocalIdentity authentication".yellow());
                    }
                }
                Err(e) => {
                    spinner.finish_and_clear();
                    println!("{} {}", "Failed to revoke token:".red(), e);
                }
            }
        }
    }
    Ok(())
}

fn format_timestamp(timestamp: u64) -> String {
    use chrono::{DateTime, Utc};
    let datetime = DateTime::<Utc>::from_timestamp_nanos(timestamp as i64);
    datetime.format("%Y-%m-%d %H:%M").to_string()
}