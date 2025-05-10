/**
 * React Query hooks for fetching data related to the Derivative Galaxy graph
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { 
  DerivativeRelationsResponse, 
  GraphData,
  GraphFilters
} from '@/types/graph';
import storyProtocolClient from '@/lib/api/story-protocol';
import { transformToGraphData } from '@/lib/utils/graph/graph-transform';
import { IPAsset } from '@/types/ip';

// Query keys for React Query caching
export const queryKeys = {
  ipAsset: (ipId: string) => ['ipAsset', ipId],
  derivatives: (ipId: string) => ['derivatives', ipId],
  graphData: (ipId: string, filters?: GraphFilters) => 
    filters ? ['graphData', ipId, filters] : ['graphData', ipId],
  relatedIPs: (ipId: string) => ['relatedIPs', ipId],
};

/**
 * Hook for fetching a single IP asset
 * @param ipId The IP asset ID to fetch
 * @returns Query result with IP asset data
 */
export function useIPAsset(ipId: string | null) {
  return useQuery({
    queryKey: queryKeys.ipAsset(ipId || ''),
    queryFn: () => storyProtocolClient.getIPAsset(ipId as string),
    enabled: !!ipId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching multiple IP assets by ID
 * @param ipIds Array of IP asset IDs to fetch
 * @returns Query result with multiple IP asset data
 */
export function useMultipleIPAssets(ipIds: string[]) {
  return useQuery({
    queryKey: ['ipAssets', ipIds],
    queryFn: () => storyProtocolClient.getMultipleIPAssets(ipIds),
    enabled: ipIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching derivative relationships
 * @param ipId The root IP asset ID
 * @param options Optional query parameters
 * @returns Query result with derivative relationship data
 */
export function useDerivativeRelations(
  ipId: string | null,
  options: {
    maxDepth?: number;
    includeDisputes?: boolean; 
    includeSiblings?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { maxDepth, includeDisputes, includeSiblings, enabled = true } = options;
  
  return useQuery<DerivativeRelationsResponse>({
    queryKey: ['derivatives', ipId, { maxDepth, includeDisputes, includeSiblings }],
    queryFn: () => storyProtocolClient.getFullGraph(ipId as string, {
      maxDepth,
      includeDisputes,
      includeSiblings,
    }),
    enabled: !!ipId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching and transforming graph data with filters
 * @param ipId The root IP asset ID
 * @param filters Optional graph filters
 * @returns Query result with transformed graph data ready for visualization
 */
export function useGraphData(
  ipId: string | null,
  filters?: GraphFilters
) {
  const derivativesQuery = useDerivativeRelations(ipId, {
    maxDepth: filters?.maxDistance || 2,
    includeDisputes: filters?.nodeTypes.includes('disputed'),
    includeSiblings: true,
    enabled: !!ipId,
  });
  
  return useQuery<GraphData>({
    queryKey: queryKeys.graphData(ipId || '', filters),
    queryFn: () => {
      if (!derivativesQuery.data) {
        throw new Error('Derivative data not available');
      }
      
      // Transform API data to graph format
      const graphData = transformToGraphData(derivativesQuery.data);
      
      // Apply filters if provided
      if (filters) {
        // Filtering logic would be applied here
        // This would use the applyFilters function from graph-transform.ts
        // return applyFilters(graphData, filters);
        return graphData;
      }
      
      return graphData;
    },
    enabled: !!derivativesQuery.data && !!ipId,
    // Depend on the derivatives query
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Helper function to prefetch derivative data for optimistic loading
 * @param queryClient React Query client instance
 * @param ipId The IP asset ID to prefetch
 */
export function prefetchDerivativeData(
  queryClient: QueryClient, 
  ipId: string,
  options: {
    maxDepth?: number;
    includeDisputes?: boolean;
    includeSiblings?: boolean;
  } = {}
) {
  const { maxDepth = 2, includeDisputes = false, includeSiblings = true } = options;
  
  return queryClient.prefetchQuery({
    queryKey: ['derivatives', ipId, { maxDepth, includeDisputes, includeSiblings }],
    queryFn: () => storyProtocolClient.getFullGraph(ipId, {
      maxDepth,
      includeDisputes,
      includeSiblings,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Helper function to invalidate derivative data cache
 * @param queryClient React Query client instance
 * @param ipId The IP asset ID to invalidate
 */
export function invalidateDerivativeData(queryClient: QueryClient, ipId: string) {
  return queryClient.invalidateQueries({
    queryKey: ['derivatives', ipId],
  });
}