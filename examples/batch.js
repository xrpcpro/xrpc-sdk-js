/**
 * Batch request example
 */

const { XRpcClient } = require('../dist/index.js');

async function main() {
  const client = new XRpcClient({
    apiKey: 'your-api-key-here',
    defaultNetwork: 'eth-mainnet'
  });

  try {
    const { results, metadata } = await client.batch([
      { method: 'eth_blockNumber', params: [], id: 1 },
      { method: 'eth_gasPrice', params: [], id: 2 },
      { method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'latest'], id: 3 }
    ]);

    results.forEach((response) => {
      if (response.error) {
        console.error('Error:', response.error);
      } else {
        console.log('Result:', response.result);
      }
    });

    console.log('Server latency:', metadata.serverLatency, 'ms');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

