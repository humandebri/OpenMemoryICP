
async fn handle_save_conversation(req: &HttpRequest, user: Principal) -> HttpResponse {
    let body_str = match std::str::from_utf8(&req.body) {
        Ok(s) => s,
        Err(_) => return error_response(400, "Invalid UTF-8 in request body"),
    };

    let request: SaveConversationRequest = match serde_json::from_str(body_str) {
        Ok(req) => req,
        Err(e) => return error_response(400, &format\!("Invalid JSON: {}", e)),
    };

    if request.title.trim().is_empty() {
        return error_response(400, "Title cannot be empty");
    }

    if request.content.trim().is_empty() {
        return error_response(400, "Content cannot be empty");
    }

    let conversation_id = crate::utils::generate_id();
    let word_count = request.content.split_whitespace().count() as u32;
    let timestamp = ic_cdk::api::time();

    let conversation = Conversation {
        id: conversation_id.clone(),
        user_id: user,
        title: request.title.trim().to_string(),
        content: request.content.trim().to_string(),
        source: request.source.unwrap_or_else(|| "api".to_string()),
        metadata: request.metadata.unwrap_or_default(),
        word_count,
        created_at: timestamp,
        updated_at: timestamp,
    };

    match crate::storage::save_conversation(conversation.clone()).await {
        Ok(_) => {
            let response = json\!({
                "id": conversation.id,
                "title": conversation.title,
                "word_count": conversation.word_count,
                "created_at": conversation.created_at,
                "message": "Conversation saved successfully"
            });
            success_response(&response, 201)
        }
        Err(e) => error_response(500, &format\!("Failed to save conversation: {}", e)),
    }
}

async fn handle_list_conversations(req: &HttpRequest, user: Principal) -> HttpResponse {
    let query_params = parse_query_params(&req.url);
    
    let limit: usize = query_params
        .get("limit")
        .and_then(|l| l.parse().ok())
        .unwrap_or(20)
        .min(100); // Max 100 conversations per request
        
    let offset: usize = query_params
        .get("offset")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0);

    match crate::storage::get_user_conversations(user, limit, offset) {
        Ok(conversations) => {
            let response = json\!({
                "conversations": conversations,
                "limit": limit,
                "offset": offset,
                "total_count": conversations.len()
            });
            success_response(&response, 200)
        }
        Err(e) => error_response(500, &format\!("Failed to get conversations: {}", e)),
    }
}
