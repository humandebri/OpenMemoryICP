import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { 
  Database, 
  Activity, 
  Settings, 
  TrendingUp, 
  Hash, 
  Cpu, 
  HardDrive,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { api } from '../services/openmemory-api';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// VectorStats, VectorConfig, and VectorMetrics interfaces are defined in openmemory-api.ts
interface VectorStats {
  total_vectors: number;
  total_unique_vectors: number;
  average_vector_size: number;
  memory_usage_bytes: number;
  index_size: number;
  hash_collisions: number;
  query_performance_ms: number;
}

interface VectorConfig {
  embedding_dimensions: number;
  similarity_function: string;
  index_type: string;
  use_preprocessing: boolean;
  max_vectors_per_user: number;
}

interface VectorMetrics {
  search_latency: number[];
  index_operations: number[];
  memory_growth: number[];
  timestamps: string[];
}

export const VectorDBPage: React.FC = () => {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [config, setConfig] = useState<VectorConfig | null>(null);
  const [metrics, setMetrics] = useState<VectorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [optimizing, setOptimizing] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    loadVectorData();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadVectorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadVectorData = async () => {
    try {
      setLoading(true);
      const [statsData, configData, metricsData] = await Promise.all([
        api.getVectorStats(),
        api.getVectorConfig(),
        api.getVectorMetrics()
      ]);
      
      setStats(statsData);
      setConfig(configData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load vector data:', error);
      toast.error('Failed to load vector database information');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!confirm('Optimize vector index? This may take a few minutes.')) {
      return;
    }

    try {
      setOptimizing(true);
      await api.optimizeVectorIndex();
      await loadVectorData();
      toast.success('Vector index optimized successfully');
    } catch (error) {
      console.error('Failed to optimize index:', error);
      toast.error('Failed to optimize vector index');
    } finally {
      setOptimizing(false);
    }
  };

  const handleReindex = async () => {
    if (!confirm('Rebuild vector index? This will recreate all vector embeddings and may take significant time.')) {
      return;
    }

    try {
      setReindexing(true);
      await api.rebuildVectorIndex();
      await loadVectorData();
      toast.success('Vector index rebuilt successfully');
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      toast.error('Failed to rebuild vector index');
    } finally {
      setReindexing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const getPerformanceStatus = (latency: number) => {
    if (latency < 50) return { status: 'Excellent', color: 'text-green-600' };
    if (latency < 100) return { status: 'Good', color: 'text-blue-600' };
    if (latency < 200) return { status: 'Fair', color: 'text-yellow-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  // Chart data preparation
  const performanceData = metrics?.search_latency.map((latency, i) => ({
    time: metrics.timestamps[i],
    latency,
    operations: metrics.index_operations[i]
  })) || [];

  const memoryData = metrics?.memory_growth.map((memory, i) => ({
    time: metrics.timestamps[i],
    memory: memory / (1024 * 1024) // Convert to MB
  })) || [];

  const distributionData = [
    { name: 'Used Space', value: stats?.memory_usage_bytes || 0 },
    { name: 'Free Space', value: (stats?.index_size || 0) - (stats?.memory_usage_bytes || 0) }
  ];

  const COLORS = ['#3B82F6', '#E5E7EB'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading vector database information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vector Database</h1>
            <p className="text-gray-600">
              Monitor and manage the semantic search vector store
            </p>
          </div>
          <Button
            onClick={loadVectorData}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-8 w-8 text-blue-500" />
              <Badge variant="outline">Vectors</Badge>
            </div>
            <div className="text-2xl font-bold">{stats?.total_vectors.toLocaleString()}</div>
            <p className="text-sm text-gray-600">{stats?.total_unique_vectors.toLocaleString()} unique</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="h-8 w-8 text-green-500" />
              <Badge variant="outline">Storage</Badge>
            </div>
            <div className="text-2xl font-bold">{formatBytes(stats?.memory_usage_bytes || 0)}</div>
            <p className="text-sm text-gray-600">of {formatBytes(stats?.index_size || 0)}</p>
            <Progress 
              value={(stats?.memory_usage_bytes || 0) / (stats?.index_size || 1) * 100} 
              className="mt-2"
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-yellow-500" />
              <Badge variant="outline">Performance</Badge>
            </div>
            <div className="text-2xl font-bold">{stats?.query_performance_ms || 0}ms</div>
            <p className={`text-sm ${getPerformanceStatus(stats?.query_performance_ms || 0).color}`}>
              {getPerformanceStatus(stats?.query_performance_ms || 0).status}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Hash className="h-8 w-8 text-purple-500" />
              <Badge variant="outline">Index</Badge>
            </div>
            <div className="text-2xl font-bold">{config?.embedding_dimensions || 0}D</div>
            <p className="text-sm text-gray-600">{config?.similarity_function}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Memory Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Storage Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {distributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatBytes(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Vector Statistics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Vector Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Vector Size</span>
                    <span className="font-medium">{stats?.average_vector_size.toFixed(2)} dimensions</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Hash Collisions</span>
                    <span className="font-medium">{stats?.hash_collisions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Index Type</span>
                    <span className="font-medium">{config?.index_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Preprocessing</span>
                    <Badge variant={config?.use_preprocessing ? 'default' : 'secondary'}>
                      {config?.use_preprocessing ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Vectors Per User</span>
                    <span className="font-medium">{config?.max_vectors_per_user.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="space-y-6">
              {/* Search Latency Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Search Latency Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="latency" 
                      stroke="#3B82F6" 
                      name="Latency (ms)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Index Operations Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Index Operations
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="operations" fill="#10B981" name="Operations" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Vector Database Configuration
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Embedding Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions</span>
                        <span>{config?.embedding_dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model</span>
                        <span>text-embedding-ada-002</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Normalization</span>
                        <span>L2</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Search Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Similarity Function</span>
                        <span>{config?.similarity_function}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Index Type</span>
                        <span>{config?.index_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preprocessing</span>
                        <span>{config?.use_preprocessing ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Resource Limits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Vectors Per User</span>
                      <span>{config?.max_vectors_per_user.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Index Size</span>
                      <span>{formatBytes(stats?.index_size || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory Buffer</span>
                      <span>Dynamic</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Cpu className="h-5 w-5 mr-2" />
                  Maintenance Operations
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Optimize Index</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Reorganize vector index for better performance
                      </p>
                    </div>
                    <Button
                      onClick={handleOptimize}
                      disabled={optimizing}
                      variant="outline"
                    >
                      {optimizing ? 'Optimizing...' : 'Optimize'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Rebuild Index</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Completely rebuild the vector index from scratch
                      </p>
                    </div>
                    <Button
                      onClick={handleReindex}
                      disabled={reindexing}
                      variant="outline"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {reindexing ? 'Rebuilding...' : 'Rebuild'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Vectors</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Download vector embeddings for backup
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-red-900">Clear All Vectors</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Remove all vector embeddings (requires confirmation)
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      disabled
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Memory Growth Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Memory Usage Growth
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} MB`} />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#10B981" 
                      name="Memory (MB)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};