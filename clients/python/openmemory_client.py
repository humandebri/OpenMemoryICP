#!/usr/bin/env python3
"""
OpenMemory Python Client

A simple HTTP client for the OpenMemory ICP canister.
"""

import requests
from typing import List, Dict, Optional
import json


class OpenMemoryClient:
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        """
        Initialize the OpenMemory client.
        
        Args:
            base_url: The base URL of the OpenMemory canister
            auth_token: Optional authentication token
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        if auth_token:
            self.session.headers.update({'Authorization': f'Bearer {auth_token}'})
    
    def add_memory(self, content: str, metadata: Dict = None, tags: List[str] = None) -> str:
        """
        Add a new memory.
        
        Args:
            content: The memory content
            metadata: Optional metadata dictionary
            tags: Optional list of tags
            
        Returns:
            The memory ID
        """
        payload = {
            'content': content,
            'metadata': metadata or {},
            'tags': tags or []
        }
        
        response = self.session.post(f'{self.base_url}/memories', json=payload)
        response.raise_for_status()
        return response.json()['id']
    
    def search_memories(self, query: str, limit: int = 10, tags: str = None) -> List[Dict]:
        """
        Search memories using semantic search.
        
        Args:
            query: Search query
            limit: Maximum number of results
            tags: Comma-separated list of tags to filter by
            
        Returns:
            List of search results
        """
        params = {'q': query, 'limit': limit}
        if tags:
            params['tags'] = tags
            
        response = self.session.get(f'{self.base_url}/memories/search', params=params)
        response.raise_for_status()
        return response.json()['results']
    
    def get_memory(self, memory_id: str) -> Dict:
        """
        Get a specific memory by ID.
        
        Args:
            memory_id: The memory ID
            
        Returns:
            The memory object
        """
        response = self.session.get(f'{self.base_url}/memories/{memory_id}')
        response.raise_for_status()
        return response.json()
    
    def delete_memory(self, memory_id: str) -> bool:
        """
        Delete a memory.
        
        Args:
            memory_id: The memory ID
            
        Returns:
            True if deleted successfully
        """
        response = self.session.delete(f'{self.base_url}/memories/{memory_id}')
        response.raise_for_status()
        return response.json().get('deleted', False)
    
    def list_memories(self, offset: int = 0, limit: int = 20) -> List[Dict]:
        """
        List memories with pagination.
        
        Args:
            offset: Number of memories to skip
            limit: Maximum number of memories to return
            
        Returns:
            List of memories
        """
        params = {'offset': offset, 'limit': limit}
        response = self.session.get(f'{self.base_url}/memories', params=params)
        response.raise_for_status()
        return response.json()['memories']
    
    def health_check(self) -> Dict:
        """
        Check the health status of the service.
        
        Returns:
            Health status information
        """
        response = self.session.get(f'{self.base_url}/health')
        response.raise_for_status()
        return response.json()
    
    def get_stats(self) -> Dict:
        """
        Get service statistics.
        
        Returns:
            Statistics about the service
        """
        response = self.session.get(f'{self.base_url}/stats')
        response.raise_for_status()
        return response.json()


def main():
    """Example usage of the OpenMemory client."""
    
    # Initialize client (replace with your canister URL)
    client = OpenMemoryClient(
        'https://rdmx6-jaaaa-aaaaa-aaadq-cai.ic0.app',
        auth_token='test-token'  # Use appropriate token
    )
    
    try:
        # Health check
        health = client.health_check()
        print(f"Service status: {health['status']}")
        
        # Add a memory
        memory_id = client.add_memory(
            content="ICPは分散型クラウドコンピュータプラットフォームです",
            metadata={"source": "documentation", "language": "ja"},
            tags=["ICP", "blockchain", "tech"]
        )
        print(f"Created memory: {memory_id}")
        
        # Search for memories
        results = client.search_memories("ICPの特徴", limit=5)
        print(f"Found {len(results)} relevant memories:")
        for result in results:
            content_preview = result['memory']['content'][:50] + "..." if len(result['memory']['content']) > 50 else result['memory']['content']
            print(f"  - {content_preview} (score: {result['similarity_score']:.2f})")
        
        # List all memories
        memories = client.list_memories(limit=10)
        print(f"Total memories: {len(memories)}")
        
        # Get statistics
        stats = client.get_stats()
        print(f"Service stats: {stats}")
        
    except requests.RequestException as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()