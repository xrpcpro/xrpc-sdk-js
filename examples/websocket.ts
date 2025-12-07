/**
 * WebSocket subscriptions example (TypeScript)
 * 
 * Premium feature - requires Premium plan
 */

import { XRpcWebSocketClient } from '../src/index';

async function main() {
  const wsClient = new XRpcWebSocketClient({
    apiKey: 'your-api-key-here',
    network: 'eth-mainnet', // Use base network name (not eth-mainnet-wss)
    debug: true,
    autoReconnect: true,
  });

  // Event listeners
  wsClient.on('open', () => {
    console.log('WebSocket connected');
  });

  wsClient.on('close', (code, reason) => {
    console.log(`WebSocket closed: ${code} ${reason}`);
  });

  wsClient.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  wsClient.on('reconnect', (attempt) => {
    console.log(`Reconnecting... (attempt ${attempt})`);
  });

  try {
    // Connect to WebSocket
    await wsClient.connect();
    console.log('Connected!');

    // Subscribe to new block headers
    const newHeadsSubscription = await wsClient.subscribeNewHeads((block) => {
      console.log('New block:', block);
    });
    console.log(`Subscribed to newHeads: ${newHeadsSubscription}`);

    // Subscribe to new pending transactions
    const pendingTxSubscription = await wsClient.subscribeNewPendingTransactions((txHash) => {
      console.log('New pending transaction:', txHash);
    });
    console.log(`Subscribed to newPendingTransactions: ${pendingTxSubscription}`);

    // Subscribe to logs
    const logsSubscription = await wsClient.subscribeLogs(
      {
        address: '0x...', // Contract address
        topics: ['0x...'], // Event topics
      },
      (log) => {
        console.log('New log:', log);
      }
    );
    console.log(`Subscribed to logs: ${logsSubscription}`);

    // Keep connection alive
    // In a real application, you would handle cleanup on exit
    process.on('SIGINT', async () => {
      console.log('Disconnecting...');
      await wsClient.disconnect();
      process.exit(0);
    });

    // Keep running
    await new Promise(() => {}); // Never resolves
  } catch (error) {
    console.error('Error:', error);
    await wsClient.disconnect();
  }
}

main();

