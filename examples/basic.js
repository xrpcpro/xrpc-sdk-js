/**
 * Basic usage example
 */

const { XRpcClient } = require('../dist/index.js');

async function main() {
  const client = new XRpcClient({
    apiKey: 'your-api-key-here',
    defaultNetwork: 'eth-mainnet',
    debug: true
  });

  try {
    // Get current block number
    const { result, metadata } = await client.request('eth_blockNumber');
    console.log('Current block:', result);
    console.log('Server latency:', metadata.serverLatency, 'ms');

    // Get balance
    const { result: balance } = await client.request('eth_getBalance', [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'latest'
    ]);
    console.log('Balance:', balance);

    // Get gas price
    const { result: gasPrice } = await client.request('eth_gasPrice');
    console.log('Gas price:', gasPrice);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

