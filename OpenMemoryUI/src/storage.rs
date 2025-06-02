
// Conversation storage functions
pub async fn save_conversation(conversation: Conversation) -> Result<String, String> {
    if \!is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    let conversation_id = conversation.id.clone();
    
    // Store the conversation
    CONVERSATIONS.with(|c| {
        if let Some(ref mut conversations) = *c.borrow_mut() {
            conversations.insert(conversation_id.clone(), conversation.clone());
        }
    });
    
    // Update user conversation list
    USER_CONVERSATIONS.with(|uc| {
        if let Some(ref mut user_conversations) = *uc.borrow_mut() {
            let mut user_list = user_conversations.get(&conversation.user_id)
                .unwrap_or_else(|| UserConversationList(Vec::new()));
            
            user_list.0.push(conversation_id.clone());
            user_conversations.insert(conversation.user_id, user_list);
        }
    });
    
    Ok(conversation_id)
}

pub fn get_conversation(id: &str) -> Result<Option<Conversation>, String> {
    if \!is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    CONVERSATIONS.with(|c| {
        if let Some(ref conversations) = *c.borrow() {
            Ok(conversations.get(&id.to_string()))
        } else {
            Err("Conversations storage not initialized".to_string())
        }
    })
}

pub fn get_user_conversations(user_id: Principal, limit: usize, offset: usize) -> Result<Vec<Conversation>, String> {
    if \!is_storage_initialized() {
        return Err("Storage not initialized".to_string());
    }
    
    USER_CONVERSATIONS.with(|uc| {
        if let Some(ref user_conversations) = *uc.borrow() {
            match user_conversations.get(&user_id) {
                Some(user_list) => {
                    let conversation_ids: Vec<String> = user_list.0.iter()
                        .skip(offset)
                        .take(limit)
                        .cloned()
                        .collect();
                    
                    CONVERSATIONS.with(|c| {
                        if let Some(ref conversations) = *c.borrow() {
                            let mut results = Vec::new();
                            for id in conversation_ids {
                                if let Some(conversation) = conversations.get(&id) {
                                    results.push(conversation);
                                }
                            }
                            Ok(results)
                        } else {
                            Err("Conversations storage not initialized".to_string())
                        }
                    })
                }
                None => Ok(Vec::new()),
            }
        } else {
            Err("User conversations storage not initialized".to_string())
        }
    })
}

pub fn get_conversation_count() -> usize {
    CONVERSATIONS.with(|c| {
        if let Some(ref conversations) = *c.borrow() {
            conversations.len() as usize
        } else {
            0
        }
    })
}
