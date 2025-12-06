/**
 * xRPC JavaScript/TypeScript SDK
 * 
 * Official SDK for xRPC - Multi-chain RPC Gateway
 * 
 * @example
 * ```typescript
 * import { XRpcClient } from '@xrpc-pro/sdk';
 * 
 * const client = new XRpcClient({
 *   apiKey: 'your-api-key',
 *   defaultNetwork: 'eth-mainnet'
 * });
 * 
 * const { result } = await client.request('eth_blockNumber');
 * console.log('Current block:', result);
 * ```
 */

export { XRpcClient } from './client';
export { XRpcError } from './types';
export type {
  Network,
  RpcType,
  JsonRpcRequest,
  JsonRpcResponse,
  XRpcConfig,
  RequestOptions,
  BatchRequestItem,
  BatchResponseItem,
  RequestMetadata,
  NetworkInfo,
  ChainInfo
} from './types';

// Convenience methods for common RPC calls
export { XRpcClientExtended } from './methods';

