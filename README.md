# xRPC JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for xRPC - Multi-chain RPC Gateway.

[![npm version](https://img.shields.io/npm/v/@xrpc/sdk.svg)](https://www.npmjs.com/package/@xrpc/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Full TypeScript Support** - Complete type definitions included
- ✅ **Multi-chain Support** - Ethereum, Polygon, Arbitrum, Optimism, Base, and more
- ✅ **Premium Networks** - Beacon Chain and WebSocket (WSS) support for Premium users
- ✅ **Batch Requests** - Execute multiple RPC calls in a single request
- ✅ **Request Metadata** - Server latency, network info, and timestamps
- ✅ **Error Handling** - Custom error class with detailed error information
- ✅ **Convenience Methods** - Helper methods for common RPC operations
- ✅ **Dynamic Network Discovery** - Get available networks from the backend
- ✅ **Browser & Node.js** - Works in both environments

## Installation

```bash
npm install @xrpc/sdk
# or
yarn add @xrpc/sdk
# or
pnpm add @xrpc/sdk
```

## Quick Start

```typescript
import { XRpcClient } from '@xrpc/sdk';

// Initialize client
const client = new XRpcClient({
  apiKey: 'your-api-key-here',
  defaultNetwork: 'eth-mainnet'
});

// Make a request
const { result, metadata } = await client.request('eth_blockNumber');
console.log('Current block:', result);
console.log('Server latency:', metadata.serverLatency, 'ms');
```

## Configuration

```typescript
const client = new XRpcClient({
  apiKey: 'your-api-key',              // Required: Your xRPC API key
  baseUrl: 'https://api.xrpc.pro',     // Optional: API base URL (default: https://api.xrpc.pro)
  defaultNetwork: 'eth-mainnet',       // Optional: Default network for requests
  timeout: 60000,                      // Optional: Request timeout in ms (default: 60000)
  debug: false,                         // Optional: Enable request/response logging
  headers: {                            // Optional: Custom headers
    'Custom-Header': 'value'
  }
});
```

## Supported Networks

### Network Availability

Networks are **dynamically determined** by the backend based on available RPC nodes. A network is considered available if:

1. **Active RPC nodes exist** - At least one node with `status: 'active'` exists
2. **Node is enabled** - The node has `enabled: true`
3. **Node is healthy** - The node passes health checks (responds to RPC requests)

The backend performs health checks every 10 seconds and automatically updates network availability.

### Standard Networks (Available to All Users)

These networks use standard JSON-RPC over HTTP:

- **Ethereum**
  - `eth-mainnet` - Ethereum Mainnet (Chain ID: 1)
  - `eth-sepolia` - Ethereum Sepolia Testnet (Chain ID: 11155111)
  - `eth-holesky` - Ethereum Holesky Testnet (Chain ID: 17000)

- **Polygon**
  - `polygon-mainnet` - Polygon Mainnet (Chain ID: 137)
  - `polygon-amoy` - Polygon Amoy Testnet (Chain ID: 80002)

- **Arbitrum**
  - `arbitrum-one` - Arbitrum One (Chain ID: 42161)
  - `arbitrum-sepolia` - Arbitrum Sepolia Testnet (Chain ID: 421614)

- **Optimism**
  - `optimism` - Optimism Mainnet (Chain ID: 10)

- **Base**
  - `base-mainnet` - Base Mainnet (Chain ID: 8453)
  - `base-sepolia` - Base Sepolia Testnet (Chain ID: 84532)

### Premium Networks (Premium Plan Only)

#### Beacon Chain Networks

Ethereum Beacon Chain API endpoints (REST API):

- `eth-mainnet-beacon` - Ethereum Beacon Chain (Mainnet)
- `eth-sepolia-beacon` - Ethereum Beacon Chain (Sepolia)
- `eth-holesky-beacon` - Ethereum Beacon Chain (Holesky)

**Note:** Beacon networks are only available if:
- User has Premium plan
- Active beacon nodes exist in the backend

#### WebSocket Secure (WSS) Networks

WebSocket Secure endpoints for real-time subscriptions:

- `eth-mainnet-wss` - Ethereum WSS (Mainnet)
- `eth-sepolia-wss` - Ethereum WSS (Sepolia)
- `eth-holesky-wss` - Ethereum WSS (Holesky)

**Note:** WSS networks are only available if:
- User has Premium plan
- Active WSS nodes exist in the backend

### Getting Available Networks

You can dynamically fetch available networks from the backend:

```typescript
// Get all available chains and networks
const chains = await client.getAvailableNetworks();

chains.forEach(chain => {
  console.log(`Chain: ${chain.displayName}`);
  chain.subnetworks.forEach(subnetwork => {
    console.log(`  - ${subnetwork.displayName} (${subnetwork.network})`);
    console.log(`    RPC Types:`, subnetwork.rpcTypes);
    console.log(`    Healthy Nodes:`, subnetwork.nodeStats?.healthyNodes);
  });
});
```

**Response structure:**
```typescript
{
  id: 'eth',
  name: 'Ethereum',
  displayName: 'Ethereum',
  status: 'active',
  subnetworks: [
    {
      network: 'eth-mainnet',
      displayName: 'Ethereum Mainnet',
      chainId: 1,
      type: 'mainnet',
      rpcTypes: {
        standard: true,   // Always available
        beacon: true,      // If beacon nodes exist
        wss: true         // If WSS nodes exist
      },
      nodeStats: {
        totalNodes: 3,
        healthyNodes: 3,
        activeNodes: 3,
        avgLatency: 45
      },
      endpoints: {
        standard: 'https://eth-mainnet.xrpc.pro',
        beacon: 'https://eth-mainnet-beacon.xrpc.pro',
        wss: 'wss://eth-mainnet.xrpc.pro'
      }
    }
  ]
}
```

## Usage Examples

### Basic Request

```typescript
const { result } = await client.request('eth_blockNumber');
console.log('Block number:', result);
```

### Request with Parameters

```typescript
const { result } = await client.request('eth_getBalance', [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'latest'
]);
console.log('Balance:', result);
```

### Request with Different Network

```typescript
// Override default network for this request
const { result } = await client.request('eth_blockNumber', [], {
  network: 'polygon-mainnet'
});
```

### Request Metadata

Every request returns metadata:

```typescript
const { result, metadata } = await client.request('eth_blockNumber');

console.log('Result:', result);
console.log('Server latency:', metadata.serverLatency, 'ms');
console.log('Network used:', metadata.network);
console.log('Timestamp:', new Date(metadata.timestamp));
```

### Batch Requests

Execute multiple RPC calls in a single request:

```typescript
const { results, metadata } = await client.batch([
  { method: 'eth_blockNumber', params: [], id: 1 },
  { method: 'eth_gasPrice', params: [], id: 2 },
  { method: 'eth_getBalance', params: ['0x...', 'latest'], id: 3 }
]);

results.forEach((response) => {
  if (response.error) {
    console.error('Error:', response.error);
  } else {
    console.log('Result:', response.result);
  }
});
```

### Convenience Methods

Use the extended client for common operations:

```typescript
import { XRpcClientExtended } from '@xrpc/sdk';

const client = new XRpcClientExtended({
  apiKey: 'your-api-key',
  defaultNetwork: 'eth-mainnet'
});

// Get block number
const blockNumber = await client.getBlockNumber();

// Get balance
const balance = await client.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Get gas price
const gasPrice = await client.getGasPrice();

// Get transaction receipt
const receipt = await client.getTransactionReceipt('0x...');

// Call contract
const result = await client.call({
  to: '0x...',
  data: '0x...'
});

// Estimate gas
const gas = await client.estimateGas({
  to: '0x...',
  from: '0x...',
  data: '0x...'
});

// Get logs
const logs = await client.getLogs({
  fromBlock: '0x0',
  toBlock: 'latest',
  address: '0x...'
});
```

### Error Handling

```typescript
import { XRpcClient, XRpcError } from '@xrpc/sdk';

try {
  const { result } = await client.request('eth_blockNumber');
  console.log('Success:', result);
} catch (error) {
  if (error instanceof XRpcError) {
    console.error('RPC Error Code:', error.code);
    console.error('RPC Error Message:', error.message);
    console.error('Error Data:', error.data);
    
    // Handle specific errors
    if (error.code === -32601) {
      console.error('Method not found or invalid API key');
    } else if (error.code === 403) {
      console.error('Premium plan required for this network');
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Health Check

```typescript
const health = await client.health();
console.log('Status:', health.status);
console.log('Networks:', health.networks);
```

### Network Statistics

```typescript
const stats = await client.getNetworkStats();
console.log('Total chains:', stats.totalChains);
console.log('Total networks:', stats.totalSubnetworks);
console.log('Active networks:', stats.activeSubnetworks);
console.log('Mainnets:', stats.mainnets);
console.log('Testnets:', stats.testnets);
```

### Update Configuration

```typescript
// Update API key
client.setApiKey('new-api-key');

// Update default network
client.setDefaultNetwork('polygon-mainnet');

// Get masked API key (for logging)
const maskedKey = client.getApiKey(); // Returns "abc12345..."
```

## Network Availability Logic

### How Networks Are Determined

1. **Backend Node Loading:**
   - Backend loads all RPC nodes from MongoDB on startup
   - Nodes are grouped by network (e.g., `eth-mainnet`, `polygon-mainnet`)
   - Each node has properties: `status`, `enabled`, `healthy`, `rpcType`

2. **Health Checks:**
   - Backend performs health checks every 10 seconds
   - Health check uses `eth_blockNumber` for standard nodes
   - Beacon nodes use REST API endpoints
   - WSS nodes use WebSocket health checks
   - Nodes that fail health checks are marked as `healthy: false`

3. **Network Availability:**
   - A network is available if **at least one node** meets all criteria:
     - `status === 'active'`
     - `enabled === true`
     - `healthy === true`
   - If all nodes for a network are unhealthy, the network becomes unavailable
   - Fallback nodes are used when all primary nodes fail

4. **RPC Type Availability:**
   - **Standard:** Always available if standard nodes exist
   - **Beacon:** Available only if:
     - User has Premium plan
     - Active beacon nodes exist (`rpcType: 'beacon'`)
   - **WSS:** Available only if:
     - User has Premium plan
     - Active WSS nodes exist (`rpcType: 'wss'`)

5. **Dynamic Updates:**
   - Network availability updates in real-time as nodes become healthy/unhealthy
   - Use `getAvailableNetworks()` to get current network status
   - Health check endpoint (`/rpc/health`) shows current network health

### Example: Checking Network Availability

```typescript
// Get all available networks
const chains = await client.getAvailableNetworks();

// Find a specific network
const ethMainnet = chains
  .find(chain => chain.id === 'eth')
  ?.subnetworks.find(sub => sub.network === 'eth-mainnet');

if (ethMainnet) {
  console.log('Network is available');
  console.log('Standard RPC:', ethMainnet.rpcTypes.standard);
  console.log('Beacon RPC:', ethMainnet.rpcTypes.beacon);
  console.log('WSS RPC:', ethMainnet.rpcTypes.wss);
  console.log('Healthy nodes:', ethMainnet.nodeStats?.healthyNodes);
} else {
  console.log('Network is not available');
}
```

## Error Codes

The SDK uses standard JSON-RPC 2.0 error codes:

| Code | Description |
|------|-------------|
| `-32600` | Invalid Request - The JSON sent is not a valid Request object |
| `-32601` | Method not found / Invalid API key / Access denied |
| `-32602` | Invalid params - Invalid method parameter(s) |
| `-32603` | Internal error - Internal JSON-RPC error |
| `-32000` | Server error - Generic server error |
| `-32001` | Rate limit exceeded |
| `403` | Forbidden - Premium plan required for Beacon/WSS networks |

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { XRpcClient, Network, JsonRpcResponse } from '@xrpc/sdk';

const client = new XRpcClient({
  apiKey: 'your-api-key',
  defaultNetwork: 'eth-mainnet' as Network
});

// Type-safe request
const { result } = await client.request<string>('eth_blockNumber');
// result is typed as string
```

## Debug Mode

Enable debug mode to see detailed request/response logging:

```typescript
const client = new XRpcClient({
  apiKey: 'your-api-key',
  debug: true // Enable logging
});

// All requests and responses will be logged to console
```

## Browser Support

The SDK works in both Node.js and browser environments:

```typescript
// Node.js
import { XRpcClient } from '@xrpc/sdk';

// Browser (via bundler like webpack, vite, etc.)
import { XRpcClient } from '@xrpc/sdk';
```

## API Reference

### XRpcClient

#### Constructor

```typescript
new XRpcClient(config: XRpcConfig)
```

#### Methods

- `request<T>(method: string, params?: any[], options?: RequestOptions): Promise<{ result: T; metadata: RequestMetadata }>`
- `batch(requests: BatchRequestItem[], options?: RequestOptions): Promise<{ results: BatchResponseItem[]; metadata: RequestMetadata }>`
- `health(): Promise<{ status: string; timestamp: string; networks?: Record<string, any> }>`
- `getAvailableNetworks(): Promise<ChainInfo[]>`
- `getNetworkStats(): Promise<{ totalChains: number; totalSubnetworks: number; activeSubnetworks: number; mainnets: number; testnets: number }>`
- `setApiKey(apiKey: string): void`
- `setDefaultNetwork(network: Network): void`
- `getApiKey(): string`

### XRpcClientExtended

Extends `XRpcClient` with convenience methods:

- `getBlockNumber(options?: RequestOptions): Promise<string>`
- `getBalance(address: string, blockTag?: string, options?: RequestOptions): Promise<string>`
- `getTransactionCount(address: string, blockTag?: string, options?: RequestOptions): Promise<string>`
- `getGasPrice(options?: RequestOptions): Promise<string>`
- `getTransactionReceipt(txHash: string, options?: RequestOptions): Promise<any>`
- `getTransaction(txHash: string, options?: RequestOptions): Promise<any>`
- `getBlockByNumber(blockNumber: string, fullTransactions?: boolean, options?: RequestOptions): Promise<any>`
- `getBlockByHash(blockHash: string, fullTransactions?: boolean, options?: RequestOptions): Promise<any>`
- `call(callObject: object, blockTag?: string, options?: RequestOptions): Promise<string>`
- `estimateGas(transaction: object, options?: RequestOptions): Promise<string>`
- `sendRawTransaction(signedTx: string, options?: RequestOptions): Promise<string>`
- `getLogs(filter: object, options?: RequestOptions): Promise<any[]>`
- `getCode(address: string, blockTag?: string, options?: RequestOptions): Promise<string>`
- `getStorageAt(address: string, position: string, blockTag?: string, options?: RequestOptions): Promise<string>`
- `getChainId(options?: RequestOptions): Promise<string>`
- `getNetworkVersion(options?: RequestOptions): Promise<string>`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

MIT

## Support

- **Documentation:** https://docs.xrpc.pro
- **Support:** https://t.me/xnode_support
- **GitHub:** https://github.com/xrpc/xrpc-sdk-js

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes.
