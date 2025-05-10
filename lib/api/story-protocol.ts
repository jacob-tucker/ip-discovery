/**
 * Story Protocol API Client
 * 
 * Provides a comprehensive interface for interacting with the Story Protocol API
 * to fetch IP asset data, relationships, and metadata for the Derivative Galaxy graph.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
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
const DEFAULT_RETRIES = 2;

// Default retry delay in milliseconds (exponential backoff with this as base)
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Story Protocol API Client class
 */
export class StoryProtocolClient {
  private client: AxiosInstance;
  private apiKey: string;
  private chain: string;
  
  /**
   * Create a new Story Protocol API client
   * @param baseUrl Optional base URL for the API (defaults to environment variable or localhost)
   * @param apiKey Optional API key (defaults to environment variable)
   * @param chain Optional chain ID (defaults to environment variable)
   */
  constructor(
    baseUrl?: string,
    apiKey?: string,
    chain?: string
  ) {
    // Use provided values or fallback to environment variables
    this.apiKey = apiKey || process.env.X_API_KEY || '';
    this.chain = chain || process.env.X_CHAIN || '';
    
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
      console.log(`StoryProtocolClient: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => {
        console.log(`StoryProtocolClient: ${response.status} ${response.config.url}`);
        return response;
      },
      error => {
        if (axios.isAxiosError(error)) {
          console.error(
            `StoryProtocolClient Error: ${error.response?.status || 'Network Error'} ${error.config?.url}`,
            error.response?.data || error.message
          );
        }
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
      if (
        axios.isAxiosError(error) &&
        retries > 0 &&
        (error.response?.status === 429 || // Too many requests
         error.response?.status === 503 || // Service unavailable
         error.response?.status === 504 || // Gateway timeout
         error.code === 'ECONNABORTED' ||  // Connection timeout
         error.code === 'ERR_NETWORK')     // Network error
      ) {
        // Calculate exponential backoff delay
        const delay = retryDelay * (DEFAULT_RETRIES - retries + 1);
        console.log(`StoryProtocolClient: Retrying in ${delay}ms (${retries} retries left)`);
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request with one less retry
        return this.request<T>(config, retries - 1, retryDelay);
      }
      
      // Either not an Axios error, no retries left, or not a retriable status code
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
      console.error(`Error fetching IP asset ${ipId}:`, error);
      throw new Error(`Failed to fetch IP asset ${ipId}`);
    }
  }
  
  /**
   * Get multiple IP assets by ID
   * @param ipIds Array of IP asset IDs
   * @returns Array of IP asset data
   */
  async getMultipleIPAssets(ipIds: string[]): Promise<IPAsset[]> {
    try {
      // Use Promise.all to fetch multiple IPs in parallel
      const requests = ipIds.map(ipId => 
        this.getIPAsset(ipId)
          .catch(error => {
            console.error(`Error fetching IP ${ipId}:`, error);
            return null; // Return null for failed requests
          })
      );
      
      const results = await Promise.all(requests);
      return results.filter((asset): asset is IPAsset => asset !== null);
    } catch (error) {
      console.error('Error fetching multiple IP assets:', error);
      throw new Error('Failed to fetch multiple IP assets');
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
      console.error(`Error fetching raw asset data for ${ipId}:`, error);
      throw new Error(`Failed to fetch raw asset data for ${ipId}`);
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
        throw new Error('No metadata URI found in response');
      }
      
      // Metadata URI should be fetched and processed server-side
      // This will be handled by the API route
      return response;
    } catch (error) {
      console.error(`Error fetching IP metadata for ${ipId}:`, error);
      throw new Error(`Failed to fetch IP metadata for ${ipId}`);
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
      console.error(`Error fetching derivative relations for ${ipId}:`, error);
      
      // Return a minimal valid response structure when the API fails
      return {
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
      console.error(`Error fetching ${type} relationships for ${ipId}:`, error);
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
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      
      console.error(`Error fetching relationship between ${sourceIpId} and ${targetIpId}:`, error);
      throw new Error(`Failed to fetch relationship between ${sourceIpId} and ${targetIpId}`);
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
      console.error(`Error fetching disputes for ${ipId}:`, error);
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
      console.error(`Error fetching full graph for ${ipId}:`, error);
      
      // Return a minimal valid response when the API fails
      return {
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
      console.error(`Error searching for IPs with query "${query}":`, error);
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