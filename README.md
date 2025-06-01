# OpenMemory ICP

A high-performance AI memory system built on Internet Computer Protocol (ICP) using Rust. OpenMemory provides semantic search capabilities through HTTP APIs, making it easy to integrate with any application.

## Features

- **HTTP API**: Simple REST endpoints for all operations
- **Semantic Search**: AI-powered memory search using OpenAI embeddings
- **Stable Storage**: Persistent data storage using IC's stable memory
- **Multi-user Support**: User isolation and authentication
- **High Performance**: Optimized for low latency and high throughput
- **Easy Integration**: Client libraries for Python and JavaScript

## Architecture

```
Client Applications
        ↓ HTTP API (GET/POST/DELETE)
┌─────────────────────────────────┐
│      ICP HTTP Gateway           │
│  • GET → query_call             │
│  • POST/DELETE → update_call    │
└─────────────────┬───────────────┘
                  ↓
┌─────────────────────────────────┐
│    OpenMemory Canister          │
│  • HTTP Request Handlers        │
│  • Authentication               │
│  • Memory CRUD Operations       │
│  • Semantic Search              │
└─────────────────┬───────────────┘
                  ↓
┌─────────────────────────────────┐
│      Stable Storage             │
│  • Memory Persistence          │
│  • User Data Isolation         │
│  • Vector Embeddings           │
└─────────────────────────────────┘
```

## Quick Start

### Prerequisites

- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install) (IC SDK)
- Rust (latest stable)
- OpenAI API key

### Installation

1. Clone and enter the project:
```bash
cd OpenMemory
```

2. Install dependencies:
```bash
dfx start --background  # Start local IC replica
dfx deps pull
dfx deps init
```

3. Set your OpenAI API key:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

4. Deploy the canister:
```bash
dfx deploy
```

### Basic Usage

Once deployed, you can interact with OpenMemory using HTTP requests:

```bash
# Health check
curl http://localhost:4943/health

# Add a memory (requires authentication)
curl -X POST http://localhost:4943/memories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "content": "ICPは分散型クラウドコンピュータプラットフォームです",
    "metadata": {"source": "documentation"},
    "tags": ["ICP", "blockchain"]
  }'

# Search memories
curl "http://localhost:4943/memories/search?q=ICPの特徴&limit=5"

# List memories
curl "http://localhost:4943/memories?limit=10"
```

## API Reference

### Authentication

All write operations require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

For development, use `test-token` or `demo-user` as tokens.

### Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1706764800000,
  "version": "0.1.0",
  "memory_count": 42
}
```

#### GET /stats
Service statistics.

**Response:**
```json
{
  "total_memories": 1337,
  "total_users": 42,
  "avg_memory_size": 256.5,
  "uptime_seconds": 86400
}
```

#### POST /memories
Create a new memory.

**Request:**
```json
{
  "content": "Memory content here",
  "metadata": {"key": "value"},
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "id": "mem_123abc",
  "message": "Memory created successfully"
}
```

#### GET /memories/search
Search memories semantically.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 10, max: 100)
- `tags` (optional): Comma-separated tags to filter by
- `user` (optional): User ID to filter by

**Response:**
```json
{
  "results": [
    {
      "memory": {
        "id": "mem_123",
        "content": "Memory content...",
        "metadata": {"key": "value"},
        "tags": ["tag1"],
        "created_at": 1706764800000
      },
      "similarity_score": 0.95
    }
  ],
  "total_count": 15,
  "query_time_ms": 45
}
```

#### GET /memories/{id}
Get a specific memory.

**Response:**
```json
{
  "id": "mem_123",
  "content": "Memory content...",
  "metadata": {"key": "value"},
  "tags": ["tag1"],
  "created_at": 1706764800000,
  "updated_at": 1706764800000
}
```

#### GET /memories
List memories with pagination.

**Query Parameters:**
- `offset` (optional): Number of items to skip (default: 0)
- `limit` (optional): Max items to return (default: 20, max: 100)
- `user` (optional): User ID to filter by

**Response:**
```json
{
  "memories": [...],
  "total_count": 1337,
  "offset": 0,
  "limit": 20
}
```

#### DELETE /memories/{id}
Delete a memory.

**Response:**
```json
{
  "deleted": true,
  "message": "Memory deleted successfully"
}
```

## Client Libraries

### Python

```python
from clients.python.openmemory_client import OpenMemoryClient

client = OpenMemoryClient(
    'https://your-canister.ic0.app',
    auth_token='your-token'
)

# Add memory
memory_id = client.add_memory(
    "Important information here",
    metadata={"source": "documentation"},
    tags=["important", "docs"]
)

# Search
results = client.search_memories("information", limit=5)
```

### JavaScript/TypeScript

```javascript
import OpenMemoryClient from './clients/javascript/openmemory-client.js';

const client = new OpenMemoryClient(
    'https://your-canister.ic0.app',
    'your-token'
);

// Add memory
const memoryId = await client.addMemory(
    "Important information here",
    { source: "documentation" },
    ["important", "docs"]
);

// Search
const results = await client.searchMemories("information", { limit: 5 });
```

## Development

### Project Structure

```
src/
├── lib.rs              # Main canister entry point
├── types.rs            # Type definitions
├── http_handlers.rs    # HTTP request handlers
├── auth.rs             # Authentication logic
├── storage.rs          # Stable memory storage
├── search.rs           # Search functionality
├── embedding.rs        # OpenAI embedding integration
└── utils.rs            # Utility functions

clients/
├── python/             # Python client library
└── javascript/         # JavaScript/TypeScript client

dfx.json                # DFX configuration
Cargo.toml              # Rust dependencies
```

### Building

```bash
# Build the canister
dfx build

# Deploy locally
dfx deploy

# Deploy to IC mainnet
dfx deploy --network ic
```

### Testing

```bash
# Run Rust tests
cargo test

# Test HTTP endpoints
curl http://localhost:4943/health
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for embedding generation

### Canister Settings

The canister can be configured through dfx.json or environment variables:

- Memory allocation for stable storage
- HTTP outcall limits
- Authentication settings

## Performance

### Benchmarks

- **API Response Time**: <300ms (reads), <1s (writes)
- **Search Latency**: <500ms (10K memories)
- **Throughput**: >30 requests/sec
- **Storage Efficiency**: ~10KB per memory

### Optimization

- Embeddings are cached in stable memory
- Simple text search fallback for fast responses
- Pagination for large result sets
- Connection pooling for HTTP outcalls

## Security

- **Authentication**: Bearer token based (development) / Internet Identity (production)
- **User Isolation**: Each user's memories are stored separately
- **Input Validation**: Content length limits and sanitization
- **CORS**: Proper cross-origin headers for web integration

## Roadmap

- [ ] Internet Identity integration
- [ ] Vector database optimization (IC-Vectune)
- [ ] Real-time search suggestions
- [ ] Memory clustering and categorization
- [ ] Advanced filtering and sorting
- [ ] Memory sharing and collaboration
- [ ] Analytics and insights dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions and support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ on Internet Computer Protocol