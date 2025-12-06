/**
 * Convenience methods for common RPC calls
 * These are helper methods that wrap the main request method
 */

import { XRpcClient } from './client';
import { Network, RequestOptions } from './types';

/**
 * Extended client with convenience methods
 * Extends the base XRpcClient with helper methods for common RPC calls
 */
export class XRpcClientExtended extends XRpcClient {
  /**
   * Get current block number
   */
  async getBlockNumber(options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_blockNumber', [], options);
    return result;
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: string, blockTag: string = 'latest', options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_getBalance', [address, blockTag], options);
    return result;
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string, blockTag: string = 'latest', options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_getTransactionCount', [address, blockTag], options);
    return result;
  }

  /**
   * Get gas price
   */
  async getGasPrice(options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_gasPrice', [], options);
    return result;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string, options?: RequestOptions): Promise<any> {
    const { result } = await this.request('eth_getTransactionReceipt', [txHash], options);
    return result;
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string, options?: RequestOptions): Promise<any> {
    const { result } = await this.request('eth_getTransactionByHash', [txHash], options);
    return result;
  }

  /**
   * Get block by number
   */
  async getBlockByNumber(blockNumber: string, fullTransactions: boolean = false, options?: RequestOptions): Promise<any> {
    const { result } = await this.request('eth_getBlockByNumber', [blockNumber, fullTransactions], options);
    return result;
  }

  /**
   * Get block by hash
   */
  async getBlockByHash(blockHash: string, fullTransactions: boolean = false, options?: RequestOptions): Promise<any> {
    const { result } = await this.request('eth_getBlockByHash', [blockHash, fullTransactions], options);
    return result;
  }

  /**
   * Call a contract method
   */
  async call(callObject: {
    to: string;
    data?: string;
    from?: string;
    gas?: string;
    gasPrice?: string;
    value?: string;
  }, blockTag: string = 'latest', options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_call', [callObject, blockTag], options);
    return result;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: {
    to?: string;
    from?: string;
    gas?: string;
    gasPrice?: string;
    value?: string;
    data?: string;
  }, options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_estimateGas', [transaction], options);
    return result;
  }

  /**
   * Send raw transaction
   */
  async sendRawTransaction(signedTx: string, options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_sendRawTransaction', [signedTx], options);
    return result;
  }

  /**
   * Get logs
   */
  async getLogs(filter: {
    fromBlock?: string | number;
    toBlock?: string | number;
    address?: string | string[];
    topics?: (string | string[] | null)[];
  }, options?: RequestOptions): Promise<any[]> {
    const { result } = await this.request<any[]>('eth_getLogs', [filter], options);
    return result;
  }

  /**
   * Get code at address
   */
  async getCode(address: string, blockTag: string = 'latest', options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_getCode', [address, blockTag], options);
    return result;
  }

  /**
   * Get storage at address
   */
  async getStorageAt(address: string, position: string, blockTag: string = 'latest', options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_getStorageAt', [address, position, blockTag], options);
    return result;
  }

  /**
   * Get chain ID
   */
  async getChainId(options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('eth_chainId', [], options);
    return result;
  }

  /**
   * Get network version
   */
  async getNetworkVersion(options?: RequestOptions): Promise<string> {
    const { result } = await this.request<string>('net_version', [], options);
    return result;
  }
}
