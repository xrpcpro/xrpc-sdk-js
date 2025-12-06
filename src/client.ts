import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Network,
  JsonRpcRequest,
  JsonRpcResponse,
  XRpcConfig,
  RequestOptions,
  BatchRequestItem,
  BatchResponseItem,
  RequestMetadata,
  XRpcError,
  ChainInfo
} from './types';

/**
 * xRPC Client - Main SDK class
 */
export class XRpcClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultNetwork?: Network;
  private timeout: number;
  private debug: boolean;
  private axiosInstance: AxiosInstance;

  constructor(config: XRpcConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.xrpc.pro';
    this.defaultNetwork = config.defaultNetwork;
    this.timeout = config.timeout || 60000;
    this.debug = config.debug || false;

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...config.headers
      }
    });

    // Request interceptor for logging
    if (this.debug) {
      this.axiosInstance.interceptors.request.use(
        (config) => {
          console.log('[xRPC] Request:', config.method?.toUpperCase(), config.url, config.data);
          return config;
        },
        (error) => {
          console.error('[xRPC] Request error:', error);
          return Promise.reject(error);
        }
      );

      // Response interceptor for logging
      this.axiosInstance.interceptors.response.use(
        (response) => {
          const latency = response.headers['x-server-latency'];
          console.log('[xRPC] Response:', response.status, latency ? `${latency}ms` : '', response.data);
          return response;
        },
        (error) => {
          console.error('[xRPC] Response error:', error.response?.status, error.response?.data);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Make a single RPC request
   */
  async request<T = any>(
    method: string,
    params?: any[] | Record<string, any>,
    options?: RequestOptions
  ): Promise<{ result: T; metadata: RequestMetadata }> {
    const network = options?.network || this.defaultNetwork;
    
    if (!network) {
      throw new Error('Network is required. Provide it in options or set defaultNetwork in config.');
    }

    // Generate unique request ID (timestamp + random to avoid collisions)
    const requestId = Date.now() + Math.random().toString(36).substring(2, 9);
    const requestBody: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params: params || [],
      id: requestId
    };

    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.post<JsonRpcResponse<T>>(
        `/rpc/${network}`,
        requestBody,
        {
          timeout: options?.timeout || this.timeout
        }
      );

      const serverLatency = response.headers['x-server-latency']
        ? parseInt(response.headers['x-server-latency'] as string, 10)
        : undefined;

      const metadata: RequestMetadata = {
        serverLatency,
        timestamp: startTime,
        network
      };

      if (response.data.error) {
        throw new XRpcError(
          response.data.error.code,
          response.data.error.message,
          response.data.error.data
        );
      }

      if (response.data.result === undefined) {
        throw new XRpcError(-32603, 'Response missing result');
      }

      return {
        result: response.data.result,
        metadata
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        
        if (axiosError.response?.data?.error) {
          throw new XRpcError(
            axiosError.response.data.error.code,
            axiosError.response.data.error.message,
            axiosError.response.data.error.data
          );
        }

        if (axiosError.response?.status === 401) {
          throw new XRpcError(-32601, 'Invalid API key');
        }

        if (axiosError.response?.status === 403) {
          throw new XRpcError(-32601, 'Access denied. Premium plan required for this network type.');
        }

        if (axiosError.response?.status === 429) {
          throw new XRpcError(-32601, 'Rate limit exceeded');
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new XRpcError(-32603, 'Request timeout');
        }

        throw new XRpcError(-32603, `Network error: ${error.message}`);
      }

      if (error instanceof XRpcError) {
        throw error;
      }

      throw new XRpcError(-32603, `Unknown error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Make a batch RPC request
   */
  async batch(
    requests: BatchRequestItem[],
    options?: RequestOptions
  ): Promise<{ results: BatchResponseItem[]; metadata: RequestMetadata }> {
    const network = options?.network || this.defaultNetwork;
    
    if (!network) {
      throw new Error('Network is required. Provide it in options or set defaultNetwork in config.');
    }

    if (requests.length === 0) {
      throw new Error('Batch request must contain at least one request');
    }

    const requestBody: JsonRpcRequest[] = requests.map(req => ({
      jsonrpc: '2.0',
      method: req.method,
      params: req.params || [],
      id: req.id
    }));

    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.post<BatchResponseItem[]>(
        `/rpc/${network}`,
        requestBody,
        {
          timeout: options?.timeout || this.timeout
        }
      );

      const serverLatency = response.headers['x-server-latency']
        ? parseInt(response.headers['x-server-latency'] as string, 10)
        : undefined;

      const metadata: RequestMetadata = {
        serverLatency,
        timestamp: startTime,
        network
      };

      return {
        results: response.data,
        metadata
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        
        if (axiosError.response?.data?.error) {
          throw new XRpcError(
            axiosError.response.data.error.code,
            axiosError.response.data.error.message,
            axiosError.response.data.error.data
          );
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new XRpcError(-32603, 'Request timeout');
        }

        throw new XRpcError(-32603, `Network error: ${error.message}`);
      }

      throw new XRpcError(-32603, `Unknown error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get health status
   */
  async health(): Promise<{
    status: string;
    timestamp: string;
    networks?: Record<string, any>;
  }> {
    try {
      const response = await this.axiosInstance.get('/rpc/health');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new XRpcError(-32603, `Health check failed: ${error.message}`);
      }
      throw new XRpcError(-32603, 'Health check failed');
    }
  }

  /**
   * Get available networks
   * Returns list of all available networks with their RPC types and node statistics
   */
  async getAvailableNetworks(): Promise<ChainInfo[]> {
    try {
      const response = await this.axiosInstance.get('/chains');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new XRpcError(-32603, 'Failed to fetch networks');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ success: boolean; message?: string }>;
        if (axiosError.response?.data?.message) {
          throw new XRpcError(-32603, axiosError.response.data.message);
        }
        throw new XRpcError(-32603, `Failed to fetch networks: ${error.message}`);
      }
      throw new XRpcError(-32603, 'Failed to fetch networks');
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<{
    totalChains: number;
    totalSubnetworks: number;
    activeSubnetworks: number;
    mainnets: number;
    testnets: number;
  }> {
    try {
      const response = await this.axiosInstance.get('/chains/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new XRpcError(-32603, 'Failed to fetch network stats');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new XRpcError(-32603, `Failed to fetch network stats: ${error.message}`);
      }
      throw new XRpcError(-32603, 'Failed to fetch network stats');
    }
  }

  /**
   * Update API key
   */
  setApiKey(apiKey: string): void {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }
    this.apiKey = apiKey;
    this.axiosInstance.defaults.headers['X-API-Key'] = apiKey;
  }

  /**
   * Update default network
   */
  setDefaultNetwork(network: Network): void {
    this.defaultNetwork = network;
  }

  /**
   * Get current API key (without exposing full key)
   */
  getApiKey(): string {
    return this.apiKey ? `${this.apiKey.substring(0, 8)}...` : '';
  }
}

