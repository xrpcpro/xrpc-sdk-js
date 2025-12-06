/**
 * Convenience methods example (TypeScript)
 */

import { XRpcClientExtended } from '../src/index';

async function main() {
  const client = new XRpcClientExtended({
    apiKey: 'your-api-key-here',
    defaultNetwork: 'eth-mainnet'
  });

  try {
    // Use convenience methods
    const blockNumber = await client.getBlockNumber();
    console.log('Block number:', blockNumber);

    const balance = await client.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    console.log('Balance:', balance);

    const gasPrice = await client.getGasPrice();
    console.log('Gas price:', gasPrice);

    // Different network
    const polygonBlock = await client.getBlockNumber({ network: 'polygon-mainnet' });
    console.log('Polygon block:', polygonBlock);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

