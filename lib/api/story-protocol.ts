/**
 * Story Protocol API client for the Derivative Galaxy graph
 * Handles API requests to retrieve IP asset relationships
 */

import axios from 'axios';
import { DerivativeRelationsResponse } from '@/types/graph';

// Base URL for API requests
const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

/**
 * Fetches derivative relationship data for a specific IP asset
 * @param ipId - The IP asset ID to fetch relationships for
 * @returns Promise with derivative relationship data
 */
export const getDerivativeRelations = async (
  ipId: string
): Promise<DerivativeRelationsResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/ip/${ipId}/derivatives`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching derivative relations:', error);
    // Return empty structure if API fails
    return {
      root: {
        ipId: ipId,
        title: 'Unknown IP',
        metadata: {}
      },
      ancestors: [],
      derivatives: [],
      related: []
    };
  }
};

/**
 * Fetches detailed information about multiple IP assets
 * @param ipIds - Array of IP asset IDs to fetch details for
 * @returns Promise with detailed IP asset data
 */
export const getMultipleIPDetails = async (ipIds: string[]): Promise<any[]> => {
  try {
    // Use Promise.all to fetch multiple IPs in parallel
    const baseUrl = getBaseUrl();
    const requests = ipIds.map(ipId => 
      axios.get(`${baseUrl}/api/ip/${ipId}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching IP ${ipId}:`, error);
          return null; // Return null for failed requests
        })
    );

    const results = await Promise.all(requests);
    return results.filter(Boolean); // Filter out null results
  } catch (error) {
    console.error('Error fetching multiple IP details:', error);
    return [];
  }
};