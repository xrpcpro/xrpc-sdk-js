/**
 * Supported blockchain networks
 * 
 * NOTE: This type is for TypeScript type checking only.
 * Actual available networks are determined dynamically by the backend.
 * Use getAvailableNetworks() to get the real list of available networks.
 * 
 * Network format: {chain}-{subnetwork} or {chain}-{subnetwork}-{rpcType}
 * Examples: 'eth-mainnet', 'polygon-mainnet', 'eth-mainnet-beacon', 'eth-mainnet-wss'
 * 
 * Networks are defined in the backend database:
 * - Chain model: defines main chains (eth, polygon, arbitrum, etc.)
 * - Subnetwork model: defines subnetworks (mainnet, sepolia, etc.)
 * - RpcNode model: defines RPC nodes with rpcType (standard, beacon, wss)
 * 
 * A network is available if there's at least one active, enabled, and healthy RPC node.
 */
export type Network = string; // Dynamic type - networks are determined by backend

/**
 * Network information from backend
 */
export interface NetworkInfo {
  /**
   * Network identifier (e.g., 'eth-mainnet')
   */
  network: string;
  
  /**
   * Display name (e.g., 'Ethereum Mainnet')
   */
  displayName: string;
  
  /**
   * Chain ID
   */
  chainId: number;
  
  /**
   * Network type (mainnet, testnet, devnet)
   */
  type: 'mainnet' | 'testnet' | 'devnet';
  
  /**
   * Available RPC types for this network
   */
  rpcTypes: {
    standard: boolean;
    beacon: boolean;
    wss: boolean;
  };
  
  /**
   * Node statistics
   */
  nodeStats?: {
    totalNodes: number;
    healthyNodes: number;
    activeNodes: number;
    avgLatency: number;
  };
  
  /**
   * Endpoints for each RPC type
   */
  endpoints?: {
    standard?: string;
    beacon?: string;
    wss?: string;
  };
}

/**
 * Chain information (group of networks)
 */
export interface ChainInfo {
  /**
   * Chain identifier (e.g., 'eth', 'polygon')
   */
  id: string;
  
  /**
   * Chain name (e.g., 'Ethereum')
   */
  name: string;
  
  /**
   * Display name
   */
  displayName: string;
  
  /**
   * Chain status
   */
  status: 'active' | 'disabled' | 'maintenance';
  
  /**
   * Subnetworks (networks) in this chain
   */
  subnetworks: NetworkInfo[];
}

/**
 * RPC Type
 */
export type RpcType = 'standard' | 'beacon' | 'wss';

/**
 * JSON-RPC 2.0 Request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any[] | Record<string, any>;
  id: number | string | null;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string | null;
}

/**
 * xRPC SDK Configuration
 */
export interface XRpcConfig {
  /**
   * API Key for authentication
   */
  apiKey: string;
  
  /**
   * Base URL of the xRPC API
   * @default 'https://api.xrpc.pro'
   */
  baseUrl?: string;
  
  /**
   * Default network to use for requests
   */
  defaultNetwork?: Network;
  
  /**
   * Request timeout in milliseconds
   * @default 60000
   */
  timeout?: number;
  
  /**
   * Enable request/response logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Custom headers to include in requests
   */
  headers?: Record<string, string>;
}

/**
 * Request options
 */
export interface RequestOptions {
  /**
   * Network to use for this request (overrides default)
   */
  network?: Network;
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Skip cache for this request
   */
  skipCache?: boolean;
}

/**
 * Batch request item
 */
export interface BatchRequestItem {
  method: string;
  params?: any[] | Record<string, any>;
  id: number | string;
}

/**
 * Batch response item
 */
export interface BatchResponseItem<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string | null;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  /**
   * Server-side latency in milliseconds
   */
  serverLatency?: number;
  
  /**
   * Request timestamp
   */
  timestamp: number;
  
  /**
   * Network used
   */
  network: Network;
}

/**
 * Error class for xRPC errors
 */
export class XRpcError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'XRpcError';
    Object.setPrototypeOf(this, XRpcError.prototype);
  }
}

