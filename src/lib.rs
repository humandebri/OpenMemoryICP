use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};

mod types;
mod http_handlers;
mod auth;
mod storage;
mod search;
mod utils;
mod embedding;

pub use types::*;
pub use http_handlers::*;
pub use auth::*;
pub use storage::*;
pub use search::*;
pub use utils::*;
pub use embedding::*;

// Export the main HTTP handlers for the canister
#[query]
pub fn http_request(req: HttpRequest) -> HttpResponse {
    http_handlers::handle_http_request(req)
}

#[update]
pub async fn http_request_update(req: HttpRequest) -> HttpResponse {
    http_handlers::handle_http_request_update(req).await
}

#[init]
pub async fn init() {
    storage::init_storage().await;
}

#[pre_upgrade]
pub fn pre_upgrade() {
    storage::pre_upgrade();
}

#[post_upgrade]
pub async fn post_upgrade() {
    storage::post_upgrade().await;
}