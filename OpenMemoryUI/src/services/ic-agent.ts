import { HttpAgent, Identity, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// OpenMemory canister configuration
const OPENMEMORY_CANISTER_ID = (import.meta as any).env?.VITE_OPENMEMORY_CANISTER_ID || '77fv5-oiaaa-aaaal-qsoea-cai';
const DFX_NETWORK = (import.meta as any).env?.VITE_DFX_NETWORK || 'ic';
const LOCAL_REPLICA_HOST = 'http://127.0.0.1:4943';
const IC_HOST = 'https://ic0.app';

// Candid interface for OpenMemory canister
const idlFactory = ({ IDL }: { IDL: any }) => {
  const HttpRequest = IDL.Record({
    url: IDL.Text,
    method: IDL.Text,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });

  const HttpResponse = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    status_code: IDL.Nat16,
  });

  return IDL.Service({
    http_request: IDL.Func([HttpRequest], [HttpResponse], ['query']),
    http_request_update: IDL.Func([HttpRequest], [HttpResponse], []),
  });
};

// Type definitions
interface HttpRequest {
  url: string;
  method: string;
  body: number[];
  headers: [string, string][];
}

interface HttpResponse {
  body: number[];
  headers: [string, string][];
  status_code: number;
}

// Agent configuration
class ICAgentService {
  private agent: HttpAgent | null = null;
  private authClient: AuthClient | null = null;
  private actor: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize auth client
      this.authClient = await AuthClient.create();

      // Create agent
      const host = DFX_NETWORK === 'local' ? LOCAL_REPLICA_HOST : IC_HOST;
      this.agent = new HttpAgent({ host });

      // For local development, fetch root key
      if (DFX_NETWORK === 'local') {
        await this.agent.fetchRootKey();
      }

      // Create actor
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: OPENMEMORY_CANISTER_ID,
      });

      this.isInitialized = true;
      console.log('IC Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IC Agent:', error);
      throw error;
    }
  }

  async login(): Promise<boolean> {
    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    return new Promise((resolve) => {
      this.authClient!.login({
        identityProvider: DFX_NETWORK === 'local' 
          ? `http://rdmx6-jaaaa-aaaah-qdrya-cai.localhost:4943`
          : 'https://identity.ic0.app',
        onSuccess: () => {
          this.updateAgentIdentity();
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        },
      });
    });
  }

  async logout(): Promise<void> {
    if (this.authClient) {
      await this.authClient.logout();
      this.updateAgentIdentity();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.authClient?.isAuthenticated()) ?? false;
  }

  getIdentity(): Identity | null {
    return this.authClient?.getIdentity() ?? null;
  }

  getPrincipal(): Principal | null {
    const identity = this.getIdentity();
    return identity?.getPrincipal() ?? null;
  }

  private updateAgentIdentity(): void {
    if (this.agent && this.authClient) {
      const identity = this.authClient.getIdentity();
      this.agent.replaceIdentity(identity);
      
      // Recreate actor with new identity
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: OPENMEMORY_CANISTER_ID,
      });
    }
  }

  getAgent(): HttpAgent {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }
    return this.agent;
  }

  // HTTP API methods for OpenMemory using IC canister calls
  async makeCanisterCall<T>(method: string, url: string, body?: string): Promise<T> {
    if (!this.actor) {
      throw new Error('Agent not initialized');
    }

    // Format request according to Candid interface
    const request: HttpRequest = {
      method: method.toUpperCase(),
      url: url.startsWith('/') ? url : `/${url}`,
      headers: [['Content-Type', 'application/json']] as [string, string][],
      body: body ? Array.from(new TextEncoder().encode(body)) : [],
    };

    try {
      let response: HttpResponse;
      if (method.toUpperCase() === 'GET') {
        response = await this.actor.http_request(request);
      } else {
        response = await this.actor.http_request_update(request);
      }

      // Parse the response
      if (response.status_code !== 200) {
        const errorBody = new TextDecoder().decode(new Uint8Array(response.body));
        throw new Error(`Canister request failed: ${response.status_code} ${errorBody}`);
      }

      const responseText = new TextDecoder().decode(new Uint8Array(response.body));
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Canister call failed:', error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.makeCanisterCall('GET', 'health');
  }

  // Memory operations
  async getMemories(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const endpoint = `memories${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeCanisterCall('GET', endpoint);
  }

  async addMemory(content: string, category?: string, tags?: string[]) {
    const body = JSON.stringify({
      content,
      category,
      tags: tags || [],
    });
    return this.makeCanisterCall('POST', 'memories', body);
  }

  async searchMemories(query: string, limit?: number, category_filter?: string, min_score?: number) {
    const body = JSON.stringify({
      query,
      limit,
      category_filter,
      min_score,
    });
    return this.makeCanisterCall('POST', 'memories/search', body);
  }

  // Suggestions
  async getSuggestions(context: string, limit?: number) {
    const params = new URLSearchParams();
    params.append('q', context);
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `suggestions?${params.toString()}`;
    return this.makeCanisterCall('GET', endpoint);
  }

  // Clusters
  async getClusters(min_cluster_size?: number) {
    const params = new URLSearchParams();
    if (min_cluster_size) params.append('min_cluster_size', min_cluster_size.toString());
    
    const endpoint = `clusters${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeCanisterCall('GET', endpoint);
  }

  // Categories
  async getCategories() {
    return this.makeCanisterCall('GET', 'categories');
  }

  async suggestCategories(memory_content: string) {
    const body = JSON.stringify({
      memory_content,
    });
    return this.makeCanisterCall('POST', 'categories/suggest', body);
  }
}

// Export singleton instance
export const icAgent = new ICAgentService();