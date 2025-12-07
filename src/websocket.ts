/**
 * WebSocket Client for xRPC - Premium feature
 * 
 * Provides real-time subscriptions via WebSocket Secure (WSS) connections.
 * Available only for Premium plan users.
 */

import { Network, XRpcError } from './types';

export type SubscriptionType = 'newHeads' | 'newPendingTransactions' | 'logs';

export interface SubscriptionOptions {
  /**
   * Network to use for subscription
   */
  network: Network;
  
  /**
   * API key for authentication
   */
  apiKey: string;
  
  /**
   * Base URL for WebSocket connections
   * @default 'wss://api.xrpc.pro'
   */
  baseUrl?: string; // Not used, kept for compatibility
  
  /**
   * Connection timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Auto-reconnect on connection loss
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Reconnect delay in milliseconds
   * @default 5000
   */
  reconnectDelay?: number;
  
  /**
   * Maximum reconnect attempts
   * @default Infinity
   */
  maxReconnectAttempts?: number;
}

export interface Subscription {
  /**
   * Subscription ID
   */
  id: string;
  
  /**
   * Subscription type
   */
  type: SubscriptionType;
  
  /**
   * Parameters used for subscription
   */
  params?: any[];
  
  /**
   * Callback function for subscription events
   */
  callback: (data: any) => void;
}

export interface XRpcWebSocketClientEvents {
  open: () => void;
  close: (code: number, reason: string) => void;
  error: (error: Error) => void;
  reconnect: (attempt: number) => void;
}

/**
 * WebSocket Client for xRPC subscriptions
 * 
 * Premium feature - requires Premium plan
 */
export class XRpcWebSocketClient {
  private options: Required<SubscriptionOptions>;
  private ws: any = null; // WebSocket type (browser or Node.js)
  private subscriptions: Map<string, Subscription> = new Map();
  private pendingRequests: Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout | number;
  }> = new Map();
  private requestIdCounter = 0;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | number | null = null;
  private isManualClose = false;
  private eventListeners: {
    [K in keyof XRpcWebSocketClientEvents]?: XRpcWebSocketClientEvents[K][];
  } = {};

  constructor(options: SubscriptionOptions) {
    if (!options.apiKey) {
      throw new Error('API key is required');
    }

    if (!options.network) {
      throw new Error('Network is required');
    }

    // Note: For WebSocket subscriptions, use the base network name (e.g., 'eth-mainnet')
    // The URL will be constructed as wss://{network}.xrpc.pro
    // Premium plan is required and will be checked by the backend

    this.options = {
      baseUrl: options.baseUrl || 'wss://api.xrpc.pro',
      timeout: options.timeout || 10000,
      debug: options.debug || false,
      autoReconnect: options.autoReconnect !== false,
      reconnectDelay: options.reconnectDelay || 5000,
      maxReconnectAttempts: options.maxReconnectAttempts || Infinity,
      ...options,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN = 1
      this._log('Already connected');
      return;
    }

    if (this.ws && this.ws.readyState === 0) { // WebSocket.CONNECTING = 0
      this._log('Connection already in progress');
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === 1) { // WebSocket.OPEN = 1
            clearInterval(checkInterval);
            resolve();
          } else if (this.ws?.readyState === 3) { // WebSocket.CLOSED = 3
            clearInterval(checkInterval);
            reject(new Error('Connection failed'));
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Connection timeout'));
        }, this.options.timeout);
      });
    }

    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL
        const wsUrl = this._buildWebSocketUrl();
        this._log(`Connecting to ${wsUrl}`);

        // Get WebSocket implementation (browser or Node.js)
        const WebSocketImpl = this._getWebSocketImplementation();
        
        this.ws = new WebSocketImpl(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== 1) { // WebSocket.OPEN = 1
            if (typeof this.ws.close === 'function') {
              this.ws.close();
            }
            reject(new Error('Connection timeout'));
          }
        }, this.options.timeout);

        // Handle both browser and Node.js WebSocket APIs
        const handleOpen = () => {
          clearTimeout(connectionTimeout);
          this._log('WebSocket connected');
          this.reconnectAttempts = 0;
          this._emit('open');
          resolve();
        };

        const handleMessage = (event: any) => {
          const data = event.data || event;
          this._handleMessage(data);
        };

        const handleError = () => {
          clearTimeout(connectionTimeout);
          const errorMessage = 'WebSocket connection error';
          this._log(`Error: ${errorMessage}`);
          this._emit('error', new Error(errorMessage));
          reject(new Error(errorMessage));
        };

        const handleClose = (code?: number, reason?: string | Buffer) => {
          clearTimeout(connectionTimeout);
          const closeCode = typeof code === 'number' ? code : 1000;
          const closeReason = typeof reason === 'string' ? reason : (reason ? reason.toString() : '');
          this._log(`WebSocket closed: ${closeCode} ${closeReason}`);
          this._emit('close', closeCode, closeReason);
          
          // Reject all pending requests
          for (const [id, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeoutId as NodeJS.Timeout);
            pending.reject(new Error('WebSocket connection closed'));
            this.pendingRequests.delete(id);
          }

          // Auto-reconnect if enabled and not manual close
          if (!this.isManualClose && this.options.autoReconnect) {
            this._scheduleReconnect();
          }
        };

        // Browser WebSocket API
        if (typeof this.ws.addEventListener === 'function') {
          this.ws.addEventListener('open', handleOpen);
          this.ws.addEventListener('message', handleMessage);
          this.ws.addEventListener('error', handleError);
          this.ws.addEventListener('close', (event: CloseEvent) => handleClose(event.code, event.reason));
        } else {
          // Node.js ws API
          this.ws.on('open', handleOpen);
          this.ws.on('message', handleMessage);
          this.ws.on('error', handleError);
          this.ws.on('close', handleClose);
        }
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.isManualClose = true;
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId as NodeJS.Timeout);
      this.reconnectTimeoutId = null;
    }

    // Unsubscribe from all subscriptions
    const unsubscribePromises: Promise<void>[] = [];
    for (const [id] of this.subscriptions.entries()) {
      unsubscribePromises.push(
        this.unsubscribe(id).then(() => {
          // Convert boolean to void
        }).catch(() => {
          // Ignore errors during cleanup
        })
      );
    }
    
    await Promise.allSettled(unsubscribePromises);

    if (this.ws) {
      if (typeof this.ws.close === 'function') {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.subscriptions.clear();
    this.pendingRequests.clear();
  }

  /**
   * Subscribe to new block headers
   */
  async subscribeNewHeads(
    callback: (block: any) => void
  ): Promise<string> {
    return this.subscribe('newHeads', [], callback);
  }

  /**
   * Subscribe to new pending transactions
   */
  async subscribeNewPendingTransactions(
    callback: (txHash: string) => void
  ): Promise<string> {
    return this.subscribe('newPendingTransactions', [], callback);
  }

  /**
   * Subscribe to logs
   */
  async subscribeLogs(
    filter: {
      address?: string | string[];
      topics?: (string | string[] | null)[];
    },
    callback: (log: any) => void
  ): Promise<string> {
    return this.subscribe('logs', [filter], callback);
  }

  /**
   * Generic subscribe method
   */
  async subscribe(
    type: SubscriptionType,
    params: any[] = [],
    callback: (data: any) => void
  ): Promise<string> {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      await this.connect();
    }

    const requestId = this._generateRequestId();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Subscribe request timeout'));
      }, this.options.timeout);

      this.pendingRequests.set(requestId, {
        resolve: (response: any) => {
          clearTimeout(timeoutId as NodeJS.Timeout);
          if (response.error) {
            reject(new XRpcError(
              response.error.code || -32603,
              response.error.message || 'Subscription failed',
              response.error.data
            ));
          } else {
            const subscriptionId = response.result;
            if (!subscriptionId) {
              reject(new Error('Invalid subscription ID received'));
              return;
            }
            
            this.subscriptions.set(subscriptionId, {
              id: subscriptionId,
              type,
              params,
              callback,
            });
            
            this._log(`Subscribed to ${type} with ID: ${subscriptionId}`);
            resolve(subscriptionId);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId as NodeJS.Timeout);
          reject(error);
        },
        timeoutId,
      });

      this._sendRequest('eth_subscribe', [type, ...params], requestId);
    });
  }

  /**
   * Unsubscribe from a subscription
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    if (!this.subscriptions.has(subscriptionId)) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      this.subscriptions.delete(subscriptionId);
      return false;
    }

    const requestId = this._generateRequestId();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Unsubscribe request timeout'));
      }, this.options.timeout);

      this.pendingRequests.set(requestId, {
        resolve: (response: any) => {
          clearTimeout(timeoutId as NodeJS.Timeout);
          if (response.error) {
            reject(new XRpcError(
              response.error.code || -32603,
              response.error.message || 'Unsubscribe failed',
              response.error.data
            ));
          } else {
            const success = response.result === true;
            if (success) {
              this.subscriptions.delete(subscriptionId);
              this._log(`Unsubscribed from ${subscriptionId}`);
            }
            resolve(success);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId as NodeJS.Timeout);
          reject(error);
        },
        timeoutId,
      });

      this._sendRequest('eth_unsubscribe', [subscriptionId], requestId);
    });
  }

  /**
   * Get connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    // WebSocket readyState constants
    const CONNECTING = 0;
    const OPEN = 1;
    const CLOSING = 2;
    const CLOSED = 3;
    
    switch (this.ws.readyState) {
      case CONNECTING:
        return 'connecting';
      case OPEN:
        return 'open';
      case CLOSING:
        return 'closing';
      case CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === 1; // WebSocket.OPEN = 1
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Add event listener
   */
  on<K extends keyof XRpcWebSocketClientEvents>(
    event: K,
    listener: XRpcWebSocketClientEvents[K]
  ): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    (this.eventListeners[event] as any[]).push(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof XRpcWebSocketClientEvents>(
    event: K,
    listener: XRpcWebSocketClientEvents[K]
  ): void {
    if (this.eventListeners[event]) {
      const index = (this.eventListeners[event] as any[]).indexOf(listener);
      if (index > -1) {
        (this.eventListeners[event] as any[]).splice(index, 1);
      }
    }
  }

  private _buildWebSocketUrl(): string {
    // Extract network name without -wss suffix
    const networkName = this.options.network.replace(/-wss$/, '');
    // Format: wss://{network}.xrpc.pro?apiKey={key}
    // Example: wss://eth-mainnet.xrpc.pro?apiKey=your-key
    return `wss://${networkName}.xrpc.pro?apiKey=${this.options.apiKey}`;
  }

  private _getWebSocketImplementation(): typeof WebSocket {
    // Browser environment
    if (typeof WebSocket !== 'undefined') {
      return WebSocket;
    }
    
    // Node.js environment
    try {
      // Try to require ws package
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ws = require('ws');
      return ws as typeof WebSocket;
    } catch (error) {
      throw new Error(
        'WebSocket implementation not found. ' +
        'In Node.js, please install "ws" package: npm install ws'
      );
    }
  }

  private _sendRequest(method: string, params: any[], id: string | number): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      throw new Error('WebSocket is not connected');
    }

    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    this._log(`Sending request: ${method}`, request);
    this.ws.send(JSON.stringify(request));
  }

  private _handleMessage(data: string | Buffer | ArrayBuffer): void {
    try {
      const message = JSON.parse(data.toString());
      this._log('Received message:', message);

      // Handle subscription events
      if (message.method === 'eth_subscription') {
        const subscriptionId = message.params?.subscription;
        const result = message.params?.result;

        if (subscriptionId && this.subscriptions.has(subscriptionId)) {
          const subscription = this.subscriptions.get(subscriptionId)!;
          subscription.callback(result);
        }
        return;
      }

      // Handle request responses
      if (message.id !== undefined && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);
        pending.resolve(message);
      }
    } catch (error) {
      this._log('Error parsing message:', error);
      this._emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this._log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this._log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${this.options.reconnectDelay}ms`);
    this._emit('reconnect', this.reconnectAttempts);

    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        this.isManualClose = false; // Reset flag for reconnect
        await this.connect();
        
        // Resubscribe to all subscriptions
        for (const [id, subscription] of this.subscriptions.entries()) {
          try {
            await this.subscribe(subscription.type, subscription.params || [], subscription.callback);
            // Remove old subscription ID
            this.subscriptions.delete(id);
          } catch (error) {
            this._log(`Failed to resubscribe ${id}:`, error);
          }
        }
      } catch (error) {
        this._log('Reconnect failed:', error);
        this._scheduleReconnect();
      }
    }, this.options.reconnectDelay);
  }

  private _generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}-${Math.random().toString(36).substring(7)}`;
  }

  private _log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[xRPC WebSocket]', ...args);
    }
  }

  private _emit<K extends keyof XRpcWebSocketClientEvents>(
    event: K,
    ...args: Parameters<XRpcWebSocketClientEvents[K]>
  ): void {
    if (this.eventListeners[event]) {
      (this.eventListeners[event] as any[]).forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          this._log('Error in event listener:', error);
        }
      });
    }
  }
}

