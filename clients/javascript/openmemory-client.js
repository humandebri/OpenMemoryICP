/**
 * OpenMemory JavaScript/TypeScript Client
 * 
 * A simple HTTP client for the OpenMemory ICP canister.
 */

class OpenMemoryClient {
    constructor(baseUrl, authToken) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.authToken = authToken;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(url, { ...options, headers });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`HTTP ${response.status}: ${error.error || error.message}`);
        }

        return response;
    }

    async addMemory(content, metadata = {}, tags = []) {
        const response = await this.request('/memories', {
            method: 'POST',
            body: JSON.stringify({
                content,
                metadata,
                tags,
            }),
        });

        const result = await response.json();
        return result.id;
    }

    async searchMemories(query, options = {}) {
        const params = new URLSearchParams({ q: query });
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.tags) params.set('tags', options.tags);

        const response = await this.request(`/memories/search?${params}`);
        const result = await response.json();
        return result.results;
    }

    async getMemory(id) {
        const response = await this.request(`/memories/${id}`);
        return response.json();
    }

    async deleteMemory(id) {
        const response = await this.request(`/memories/${id}`, { method: 'DELETE' });
        const result = await response.json();
        return result.deleted || false;
    }

    async listMemories(offset = 0, limit = 20) {
        const params = new URLSearchParams({ 
            offset: offset.toString(), 
            limit: limit.toString() 
        });
        
        const response = await this.request(`/memories?${params}`);
        const result = await response.json();
        return result.memories;
    }

    async healthCheck() {
        const response = await this.request('/health');
        return response.json();
    }

    async getStats() {
        const response = await this.request('/stats');
        return response.json();
    }
}

// Example usage
async function example() {
    const client = new OpenMemoryClient(
        'https://rdmx6-jaaaa-aaaaa-aaadq-cai.ic0.app',
        'test-token'
    );

    try {
        // Health check
        const health = await client.healthCheck();
        console.log(`Service status: ${health.status}`);

        // Add memory
        const memoryId = await client.addMemory(
            "Rustは安全で高速なシステムプログラミング言語です",
            { source: "documentation", language: "ja" },
            ["Rust", "programming", "systems"]
        );
        console.log(`Created memory: ${memoryId}`);

        // Search
        const memories = await client.searchMemories("Rustの特徴", { limit: 5 });
        console.log(`Found ${memories.length} memories`);
        memories.forEach(result => {
            const preview = result.memory.content.length > 50 
                ? result.memory.content.substring(0, 50) + "..."
                : result.memory.content;
            console.log(`  - ${preview} (score: ${result.similarity_score.toFixed(2)})`);
        });

        // Statistics
        const stats = await client.getStats();
        console.log(`Service stats:`, stats);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Node.js module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenMemoryClient;
}

// Browser global
if (typeof window !== 'undefined') {
    window.OpenMemoryClient = OpenMemoryClient;
}

// Example for Node.js
if (typeof require !== 'undefined' && require.main === module) {
    example();
}