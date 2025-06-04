import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from '../components/ui/AlertDialog';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Copy, Trash2, Plus, Key, Clock, Shield, Info } from 'lucide-react';
import { api } from '../services/openmemory-api';
import { toast } from 'react-hot-toast';

interface TokenInfo {
  description?: string;
  permissions: string[];
  expires_at: bigint;
  created_at: bigint;
  last_used_at?: bigint;
}

// CreateTokenResponse interface is defined in openmemory-api.ts

export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTokenDialog, setNewTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<string>('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  
  // Create token form state
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState('30');
  const [tokenPermissions, setTokenPermissions] = useState<string[]>(['Read', 'Write']);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const result = await api.listAccessTokens();
      setTokens(result);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      toast.error('Failed to load access tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!tokenDescription.trim()) {
      toast.error('Please provide a description for the token');
      return;
    }

    try {
      setCreatingToken(true);
      const response = await api.createAccessToken(
        tokenDescription,
        parseInt(tokenExpiry),
        tokenPermissions
      );
      
      setNewToken(response.token);
      setNewTokenDialog(true);
      setShowCreateDialog(false);
      
      // Reset form
      setTokenDescription('');
      setTokenExpiry('30');
      setTokenPermissions(['Read', 'Write']);
      
      // Reload tokens
      await loadTokens();
      
      toast.success('Access token created successfully');
    } catch (error) {
      console.error('Failed to create token:', error);
      toast.error('Failed to create access token');
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this token? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingToken(token);
      await api.revokeAccessToken(token);
      await loadTokens();
      toast.success('Token revoked successfully');
    } catch (error) {
      console.error('Failed to revoke token:', error);
      toast.error('Failed to revoke token');
    } finally {
      setDeletingToken(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000).toLocaleString();
  };

  const getExpiryStatus = (expiresAt: bigint) => {
    const now = Date.now() * 1_000_000;
    const expiry = Number(expiresAt);
    
    if (expiry < now) {
      return { status: 'expired', color: 'bg-red-100 text-red-800' };
    }
    
    const daysLeft = Math.floor((expiry - now) / (1_000_000_000 * 60 * 60 * 24));
    if (daysLeft < 7) {
      return { status: `${daysLeft}d left`, color: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { status: `${daysLeft}d left`, color: 'bg-green-100 text-green-800' };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Access Tokens</h1>
          <p className="text-gray-600">
            Manage access tokens for API authentication and CLI integration
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">About Access Tokens</h3>
              <p className="text-sm text-blue-700 mt-1">
                Access tokens allow you to authenticate with the OpenMemory API from external applications
                like the CLI tool. Each token inherits your permissions and can be revoked at any time.
              </p>
              <div className="mt-2 text-sm text-blue-700">
                <strong>CLI Usage:</strong>
                <code className="bg-blue-100 px-2 py-1 rounded ml-2">
                  openmemory token use &lt;token&gt;
                </code>
              </div>
            </div>
          </div>
        </Card>

        {/* Create Token Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Token</span>
          </Button>
        </div>

        {/* Tokens List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <Card className="text-center py-12">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Tokens</h3>
            <p className="text-gray-600 mb-4">
              Create your first access token to start using the API
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Token
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tokens.map((token, index) => {
              const expiry = getExpiryStatus(token.expires_at);
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {token.description || 'Unnamed Token'}
                        </h3>
                        <Badge className={expiry.color}>
                          {expiry.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Permissions: {token.permissions.join(', ')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Created: {formatDate(token.created_at)}</span>
                        </div>
                        
                        {token.last_used_at && Number(token.last_used_at) > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Last used: {formatDate(token.last_used_at)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeToken(`token_${index}`)}
                      disabled={deletingToken === `token_${index}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Token Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create Access Token</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new access token for API authentication
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 my-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Input
                  placeholder="e.g., MacBook CLI, CI/CD Pipeline"
                  value={tokenDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenDescription(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Expires In
                </label>
                <Select value={tokenExpiry} onValueChange={setTokenExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['Read', 'Write', 'Delete', 'ManageConfig'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tokenPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTokenPermissions([...tokenPermissions, perm]);
                          } else {
                            setTokenPermissions(tokenPermissions.filter(p => p !== perm));
                          }
                        }}
                        className="rounded"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creatingToken}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateToken}
                disabled={creatingToken || !tokenDescription.trim()}
              >
                {creatingToken ? 'Creating...' : 'Create Token'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New Token Display Dialog */}
        <AlertDialog open={newTokenDialog} onOpenChange={setNewTokenDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Token Created Successfully</AlertDialogTitle>
              <AlertDialogDescription>
                Copy this token now. You won't be able to see it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4">
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm break-all">
                {newToken}
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => copyToClipboard(newToken)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> Store this token securely. 
                Anyone with this token can access your OpenMemory data.
              </p>
            </div>
            
            <AlertDialogFooter>
              <Button
                onClick={() => {
                  setNewTokenDialog(false);
                  setNewToken('');
                }}
              >
                Done
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};