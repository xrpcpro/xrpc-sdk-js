/**
 * Unit tests for XRpcClient
 */

import { XRpcClient, XRpcError } from '../index';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('XRpcClient', () => {
  let client: XRpcClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
      defaults: {
        headers: {}
      },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    } as any);

    client = new XRpcClient({
      apiKey: 'test-api-key',
      defaultNetwork: 'eth-mainnet'
    });
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(XRpcClient);
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new XRpcClient({ apiKey: '' } as any);
      }).toThrow('API key is required');
    });
  });

  describe('request', () => {
    it('should make successful request', async () => {
      const mockResponse = {
        data: {
          jsonrpc: '2.0',
          result: '0x123',
          id: 1
        },
        headers: {
          'x-server-latency': '50'
        }
      };

      (client as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const { result, metadata } = await client.request('eth_blockNumber');

      expect(result).toBe('0x123');
      expect(metadata.serverLatency).toBe(50);
      expect(metadata.network).toBe('eth-mainnet');
    });

    it('should handle RPC errors', async () => {
      const mockResponse = {
        data: {
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found'
          },
          id: 1
        }
      };

      (client as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      await expect(client.request('invalid_method')).rejects.toThrow(XRpcError);
    });
  });

  describe('setApiKey', () => {
    it('should update API key', () => {
      client.setApiKey('new-api-key');
      expect((client as any).apiKey).toBe('new-api-key');
    });

    it('should throw error for empty API key', () => {
      expect(() => {
        client.setApiKey('');
      }).toThrow('API key cannot be empty');
    });
  });

  describe('setDefaultNetwork', () => {
    it('should update default network', () => {
      client.setDefaultNetwork('polygon-mainnet');
      expect((client as any).defaultNetwork).toBe('polygon-mainnet');
    });
  });
});

