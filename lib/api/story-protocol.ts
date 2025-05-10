/**
 * Story Protocol API Client
 * 
 * Provides a comprehensive interface for interacting with the Story Protocol API
 * to fetch IP asset data, relationships, and metadata for the Derivative Galaxy graph.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  DerivativeRelationsResponse,
  IPNode,
  IPRelationship,
  RelationshipType,
  ApprovalStatus,
  RemixType,
  VerificationStatus,
  RoyaltyInfo,
  RoyaltyType
} from '@/types/graph';
import { IPAsset } from '@/types/ip';

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Default number of retries for failed requests
const DEFAULT_RETRIES = 3;

// Default retry delay in milliseconds (exponential backoff with this as base)
const DEFAULT_RETRY_DELAY = 1000;

// Max delay for exponential backoff
const MAX_RETRY_DELAY = 10000;

// Error types for better error reporting
export enum StoryProtocolErrorType {
  NETWORK = 'network_error',
  TIMEOUT = 'timeout_error',
  RATE_LIMIT = 'rate_limit_error',
  API_ERROR = 'api_error',
  DATA_ERROR = 'data_error',
  UNKNOWN = 'unknown_error'
}

// Custom error class for better error handling
export class StoryProtocolError extends Error {
  public readonly type: StoryProtocolErrorType;
  public readonly status?: number;
  public readonly endpoint?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error;
  public readonly data?: any;

  constructor(
    message: string,
    type: StoryProtocolErrorType = StoryProtocolErrorType.UNKNOWN,
    options: {
      status?: number;
      endpoint?: string;
      retryable?: boolean;
      originalError?: Error;
      data?: any;
    } = {}
  ) {
    super(message);
    this.name = 'StoryProtocolError';
    this.type = type;
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError;
    this.data = options.data;
  }
}

/**
 * Story Protocol API Client class
 */
export class StoryProtocolClient {
  private client: AxiosInstance;
  private apiKey: string;
  private chain: string;
  private logger: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;
  
  /**
   * Create a new Story Protocol API client
   * @param baseUrl Optional base URL for the API (defaults to environment variable or localhost)
   * @param apiKey Optional API key (defaults to environment variable)
   * @param chain Optional chain ID (defaults to environment variable)
   * @param logger Optional custom logger function
   */
  constructor(
    baseUrl?: string,
    apiKey?: string,
    chain?: string,
    logger?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void
  ) {
    // Use provided values or fallback to environment variables
    this.apiKey = apiKey || process.env.X_API_KEY || '';
    this.chain = chain || process.env.X_CHAIN || '';
    
    // Use provided logger or fallback to console
    this.logger = logger || ((level, message, data) => {
      if (level === 'debug' && process.env.NODE_ENV === 'production') return;
      
      const logMessage = `StoryProtocolClient: ${message}`;
      switch (level) {
        case 'debug':
          console.debug(logMessage, data || '');
          break;
        case 'info':
          console.log(logMessage, data || '');
          break;
        case 'warn':
          console.warn(logMessage, data || '');
          break;
        case 'error':
          console.error(logMessage, data || '');
          break;
      }
    });
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        'X-Chain': this.chain
      }
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(config => {
      this.logger('debug', `Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger('debug', `Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status || 0;
          const url = error.config?.url || 'unknown';
          const errorData = error.response?.data || error.message;
          
          this.logger('error', `API Error: ${status} ${url}`, errorData);
          
          // Transform error into a StoryProtocolError for better handling
          let errorType = StoryProtocolErrorType.UNKNOWN;
          let retryable = false;
          
          if (error.code === 'ECONNABORTED' || status === 504) {
            errorType = StoryProtocolErrorType.TIMEOUT;
            retryable = true;
          } else if (error.code === 'ERR_NETWORK') {
            errorType = StoryProtocolErrorType.NETWORK;
            retryable = true;
          } else if (status === 429) {
            errorType = StoryProtocolErrorType.RATE_LIMIT;
            retryable = true;
          } else if (status >= 500) {
            errorType = StoryProtocolErrorType.API_ERROR;
            retryable = true;
          } else if (status >= 400) {
            errorType = StoryProtocolErrorType.API_ERROR;
            retryable = false;
          }
          
          const enhancedError = new StoryProtocolError(
            error.message,
            errorType,
            {
              status,
              endpoint: url,
              retryable,
              originalError: error,
              data: errorData
            }
          );
          
          return Promise.reject(enhancedError);
        }
        
        // Not an Axios error, pass through
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Generic request method with retry logic
   * @param config Axios request configuration
   * @param retries Number of retries for failed requests
   * @param retryDelay Base delay for retry (will be multiplied by retry count)
   * @returns Response data
   */
  private async request<T>(
    config: AxiosRequestConfig,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY
  ): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      // Handle Story Protocol errors (transformed in interceptor)
      if (error instanceof StoryProtocolError && error.retryable && retries > 0) {
        // Calculate exponential backoff with jitter
        const backoff = Math.min(
          retryDelay * Math.pow(2, DEFAULT_RETRIES - retries),
          MAX_RETRY_DELAY
        );
        const jitter = Math.random() * 0.2 * backoff; // Add up to 20% jitter
        const delay = backoff + jitter;
        
        this.logger(
          'warn',
          `Request failed (${error.type}). Retrying in ${Math.round(delay)}ms (${retries} retries left)`,
          { endpoint: error.endpoint, status: error.status }
        );
        
        // Add some custom handling for rate limits
        if (error.type === StoryProtocolErrorType.RATE_LIMIT) {
          // For rate limits, use longer delay
          await new Promise(resolve => setTimeout(resolve, delay * 2));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Retry the request with one less retry
        return this.request<T>(config, retries - 1, retryDelay);
      }
      
      // Either not a StoryProtocolError, or not retryable, or no retries left
      throw error;
    }
  }
  
  /**
   * Get IP asset data by ID
   * @param ipId IP asset ID
   * @returns IP asset data
   */
  async getIPAsset(ipId: string): Promise<IPAsset> {
    try {
      return this.request<IPAsset>({
        method: 'get',
        url: `/api/ip/${ipId}`
      });
    } catch (error) {
      this.logger('error', `Error fetching IP asset ${ipId}:`, error);
      if (error instanceof StoryProtocolError) {
        throw error;
      } else {
        throw new StoryProtocolError(
          `Failed to fetch IP asset ${ipId}`,
          StoryProtocolErrorType.UNKNOWN,
          { originalError: error as Error }
        );
      }
    }
  }
  
  /**
   * Get multiple IP assets by ID
   * @param ipIds Array of IP asset IDs
   * @returns Array of IP asset data
   */
  async getMultipleIPAssets(ipIds: string[]): Promise<IPAsset[]> {
    try {
      // Use Promise.allSettled to allow partial failures
      const requests = ipIds.map(ipId => 
        this.getIPAsset(ipId)
          .catch(error => {
            this.logger('warn', `Error fetching IP ${ipId}:`, error);
            return null; // Return null for failed requests
          })
      );
      
      const results = await Promise.allSettled(requests);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<IPAsset | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value as IPAsset);
      
      return successfulResults;
    } catch (error) {
      this.logger('error', 'Error fetching multiple IP assets:', error);
      throw new StoryProtocolError(
        'Failed to fetch multiple IP assets',
        StoryProtocolErrorType.UNKNOWN,
        { originalError: error as Error }
      );
    }
  }
  
  /**
   * Get raw asset data from Story Protocol API
   * @param ipId IP asset ID
   * @returns Raw asset data
   */
  async getRawAssetData(ipId: string): Promise<any> {
    try {
      return this.request<any>({
        method: 'get',
        url: `/api/assets/${ipId}`
      });
    } catch (error) {
      this.logger('error', `Error fetching raw asset data for ${ipId}:`, error);
      if (error instanceof StoryProtocolError) {
        throw error;
      } else {
        throw new StoryProtocolError(
          `Failed to fetch raw asset data for ${ipId}`,
          StoryProtocolErrorType.UNKNOWN,
          { originalError: error as Error }
        );
      }
    }
  }
  
  /**
   * Get IP asset metadata
   * @param ipId IP asset ID
   * @returns Metadata object
   */
  async getIPMetadata(ipId: string): Promise<any> {
    try {
      const response = await this.request<any>({
        method: 'get',
        url: `/api/assets/${ipId}/metadata`
      });
      
      if (!response || !response.metadataUri) {
        throw new StoryProtocolError(
          'No metadata URI found in response',
          StoryProtocolErrorType.DATA_ERROR,
          { endpoint: `/api/assets/${ipId}/metadata` }
        );
      }
      
      // Metadata URI should be fetched and processed server-side
      // This will be handled by the API route
      return response;
    } catch (error) {
      this.logger('error', `Error fetching IP metadata for ${ipId}:`, error);
      if (error instanceof StoryProtocolError) {
        throw error;
      } else {
        throw new StoryProtocolError(
          `Failed to fetch IP metadata for ${ipId}`,
          StoryProtocolErrorType.UNKNOWN,
          { originalError: error as Error }
        );
      }
    }
  }
  
  /**
   * Get derivative relationships for an IP asset
   * @param ipId IP asset ID
   * @returns Derivative relationship data
   */
  async getDerivativeRelations(ipId: string): Promise<DerivativeRelationsResponse> {
    try {
      return this.request<DerivativeRelationsResponse>({
        method: 'get',
        url: `/api/ip/${ipId}/derivatives`
      });
    } catch (error) {
      this.logger('error', `Error fetching derivative relations for ${ipId}:`, error);
      
      // Create a fallback response for graceful degradation
      const fallbackResponse: DerivativeRelationsResponse = {
        root: {
          ipId: ipId,
          title: 'Unknown IP Asset',
          metadata: {}
        },
        ancestors: [],
        derivatives: [],
        related: [],
        metadata: {
          totalRelationships: 0,
          directRelationships: 0,
          indirectRelationships: 0,
          updatedAt: new Date().toISOString()
        }
      };
      
      // For certain error types, we should rethrow to allow higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
        
        // For other error types, return fallback
        return fallbackResponse;
      }
      
      // For unknown errors, log and return fallback
      this.logger('error', 'Unknown error in getDerivativeRelations:', error);
      return fallbackResponse;
    }
  }
  
  /**
   * Get relationships by type for an IP asset
   * @param ipId IP asset ID
   * @param type Relationship type (derivative, ancestor, related)
   * @param options Optional parameters (limit, offset, etc.)
   * @returns Relationships of the specified type
   */
  async getRelationshipsByType(
    ipId: string,
    type: 'derivative' | 'ancestor' | 'related',
    options: { limit?: number; offset?: number } = {}
  ): Promise<IPRelationship[]> {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      
      return this.request<IPRelationship[]>({
        method: 'get',
        url: `/api/ip/${ipId}/relationships/${type}?${queryParams.toString()}`
      });
    } catch (error) {
      this.logger('error', `Error fetching ${type} relationships for ${ipId}:`, error);
      
      // For certain error types, we should rethrow to allow higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
      }
      
      // For other errors, return empty array
      return [];
    }
  }
  
  /**
   * Get a specific relationship between two IP assets
   * @param sourceIpId Source IP asset ID
   * @param targetIpId Target IP asset ID
   * @returns Relationship data if it exists
   */
  async getRelationship(sourceIpId: string, targetIpId: string): Promise<IPRelationship | null> {
    try {
      return this.request<IPRelationship>({
        method: 'get',
        url: `/api/ip/${sourceIpId}/relationship/${targetIpId}`
      });
    } catch (error) {
      // If we get a 404, it means the relationship doesn't exist
      if (error instanceof StoryProtocolError && error.status === 404) {
        return null;
      }
      
      this.logger('error', `Error fetching relationship between ${sourceIpId} and ${targetIpId}:`, error);
      
      // Rethrow network/timeout errors for higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
      }
      
      throw new StoryProtocolError(
        `Failed to fetch relationship between ${sourceIpId} and ${targetIpId}`,
        StoryProtocolErrorType.UNKNOWN,
        { originalError: error as Error }
      );
    }
  }
  
  /**
   * Get all disputes for an IP asset
   * @param ipId IP asset ID
   * @returns Count of disputes and basic data about them
   */
  async getDisputes(ipId: string): Promise<{ count: number; disputes?: any[] }> {
    try {
      return this.request<{ count: number; disputes?: any[] }>({
        method: 'get',
        url: `/api/disputes/${ipId}`
      });
    } catch (error) {
      this.logger('error', `Error fetching disputes for ${ipId}:`, error);
      
      // For certain error types, we should rethrow to allow higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
      }
      
      // For other errors, return empty result
      return { count: 0 };
    }
  }
  
  /**
   * Get full graph data for an IP asset with all relationships
   * This is a convenience method that combines several API calls
   * @param ipId Root IP asset ID
   * @param options Optional parameters (maxDepth, includeDisputes, etc.)
   * @returns Complete graph data
   */
  async getFullGraph(
    ipId: string,
    options: {
      maxDepth?: number;
      includeDisputes?: boolean;
      includeSiblings?: boolean;
    } = {}
  ): Promise<DerivativeRelationsResponse> {
    try {
      // Use the dedicated API endpoint that will aggregate all the data
      const queryParams = new URLSearchParams();
      if (options.maxDepth) queryParams.append('maxDepth', options.maxDepth.toString());
      if (options.includeDisputes) queryParams.append('includeDisputes', 'true');
      if (options.includeSiblings) queryParams.append('includeSiblings', 'true');
      
      return this.request<DerivativeRelationsResponse>({
        method: 'get',
        url: `/api/ip/${ipId}/derivatives?${queryParams.toString()}`
      });
    } catch (error) {
      this.logger('error', `Error fetching full graph for ${ipId}:`, error);
      
      // Create a fallback response for graceful degradation
      const fallbackResponse: DerivativeRelationsResponse = {
        root: {
          ipId: ipId,
          title: 'Unknown IP Asset',
          metadata: {}
        },
        ancestors: [],
        derivatives: [],
        related: [],
        metadata: {
          totalRelationships: 0,
          directRelationships: 0,
          indirectRelationships: 0,
          updatedAt: new Date().toISOString()
        }
      };
      
      // For certain error types, we should rethrow to allow higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
        
        // For other error types, return fallback
        return fallbackResponse;
      }
      
      // For unknown errors, return fallback
      return fallbackResponse;
    }
  }
  
  /**
   * Search for IP assets by query
   * @param query Search query string
   * @param options Optional parameters (limit, offset, types, etc.)
   * @returns Search results
   */
  async searchIPs(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      types?: string[];
      sortBy?: 'relevance' | 'created' | 'updated';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ results: IPAsset[]; total: number }> {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      if (options.types?.length) queryParams.append('types', options.types.join(','));
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
      
      return this.request<{ results: IPAsset[]; total: number }>({
        method: 'get',
        url: `/api/search?${queryParams.toString()}`
      });
    } catch (error) {
      this.logger('error', `Error searching for IPs with query "${query}":`, error);
      
      // For certain error types, we should rethrow to allow higher-level retry
      if (error instanceof StoryProtocolError) {
        if (error.type === StoryProtocolErrorType.NETWORK || 
            error.type === StoryProtocolErrorType.TIMEOUT ||
            error.type === StoryProtocolErrorType.RATE_LIMIT) {
          throw error;
        }
      }
      
      // For other errors, return empty results
      return { results: [], total: 0 };
    }
  }
}

// Create and export a singleton instance
const storyProtocolClient = new StoryProtocolClient();
export default storyProtocolClient;

// Also export individual convenience functions for simpler imports

/**
 * Get IP asset data by ID
 * @param ipId IP asset ID
 * @returns IP asset data
 */
export const getIPAsset = (ipId: string): Promise<IPAsset> => {
  return storyProtocolClient.getIPAsset(ipId);
};

/**
 * Get multiple IP assets by ID
 * @param ipIds Array of IP asset IDs
 * @returns Array of IP asset data
 */
export const getMultipleIPAssets = (ipIds: string[]): Promise<IPAsset[]> => {
  return storyProtocolClient.getMultipleIPAssets(ipIds);
};

/**
 * Get derivative relationships for an IP asset
 * @param ipId IP asset ID
 * @returns Derivative relationship data
 */
export const getDerivativeRelations = (ipId: string): Promise<DerivativeRelationsResponse> => {
  return storyProtocolClient.getDerivativeRelations(ipId);
};

/**
 * Get full graph data for an IP asset with all relationships
 * @param ipId Root IP asset ID
 * @param options Optional parameters (maxDepth, includeDisputes, etc.)
 * @returns Complete graph data
 */
export const getFullGraph = (
  ipId: string,
  options: {
    maxDepth?: number;
    includeDisputes?: boolean;
    includeSiblings?: boolean;
  } = {}
): Promise<DerivativeRelationsResponse> => {
  return storyProtocolClient.getFullGraph(ipId, options);
};