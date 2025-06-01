# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Build the canister
cargo build

# Build for WASM target (IC deployment)
dfx build

# Deploy locally  
dfx start --background
dfx deploy

# Test specific endpoints
dfx canister call openmemory http_request '(record { url = "/health"; method = "GET"; body = vec {}; headers = vec {} })'

# Run Rust unit tests
cargo test

# Stop local replica
dfx stop
```

## Architecture Overview

OpenMemory ICP is an AI memory system built on Internet Computer Protocol using Rust. It provides HTTP APIs for semantic memory storage and retrieval with OpenAI embeddings.

### Core Architecture Pattern

The system uses IC's HTTP gateway to convert standard HTTP requests into canister calls:
- **GET requests** → `query_call` via `http_request` method (read-only, fast)
- **POST/DELETE requests** → `update_call` via `http_request_update` method (state-changing, consensus required)

### Key Components Structure

```
src/
├── lib.rs              # Canister entry point, exports HTTP handlers
├── http_handlers.rs    # HTTP routing and response handling  
├── types.rs           # Core data structures and Candid types
├── storage.rs         # Stable memory persistence with StableBTreeMap
├── auth.rs           # Bearer token authentication
├── search.rs         # Semantic search with embeddings
├── embedding.rs      # OpenAI API integration for embeddings
├── vector_store.rs   # Advanced vector similarity search
├── suggestions.rs    # Real-time search suggestions engine
├── clustering.rs     # Memory clustering and categorization
├── internet_identity.rs # II authentication integration
└── utils.rs          # Utilities including custom UUID generation
```

### Data Flow

1. HTTP requests → IC HTTP Gateway → Canister routing
2. Authentication via Bearer tokens or Internet Identity
3. Memory storage in stable memory with vector indexing
4. Semantic search using OpenAI embeddings + vector similarity
5. JSON responses with CORS headers

### Threading and Storage

- **Thread-local storage** for in-memory data structures (RefCell)
- **StableBTreeMap** for persistent storage across upgrades
- **Custom UUID generation** for IC compatibility (no external randomness)
- **User data isolation** with Principal-based access control

## HTTP API Design

The system implements a REST API pattern:

- `/health` - System health check
- `/memories` - CRUD operations for memories
- `/memories/search` - Semantic search with embeddings
- `/suggestions` - Real-time search suggestions  
- `/clusters` - Memory clustering operations
- `/categories` - Predefined memory categories

Authentication required for all write operations via `Authorization: Bearer <token>` header.

## IC-Specific Considerations

### WASM Compatibility
- Custom `getrandom` implementation for UUID generation
- No external dependencies requiring system randomness
- Careful feature flag management for uuid crate

### Stable Memory Usage
- All persistent data uses `ic-stable-structures` 
- Memory survives canister upgrades
- Efficient key-value storage with StableBTreeMap

### HTTP Outcalls
- OpenAI API integration for embedding generation
- Proper error handling for network requests
- Timeout and retry logic for external calls

## Testing Strategy

Since this is an IC canister:
- Use `dfx canister call` for integration testing
- Unit tests with `cargo test` for business logic
- HTTP endpoint testing via Candid interface
- No direct HTTP server for testing (IC gateway required)

## Development Notes

- Always use absolute paths in file operations
- Implement proper error handling for all external calls
- Memory content limited to 10KB per entry
- Vector embeddings cached for performance
- CORS headers included for web integration

The codebase is production-ready with comprehensive features including clustering, suggestions, Internet Identity integration, and multiple authentication methods.