/**
 * React Query hooks for fetching data related to the Derivative Galaxy graph
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import {
  DerivativeRelationsResponse,
  GraphData,
  GraphFilters,
  GraphNode,
  GraphLink
} from '@/types/graph';
import storyProtocolClient from '@/lib/api/story-protocol';
import {
  transformToGraphData,
  applyFilters,
  findPath
} from '@/lib/utils/graph/graph-transform';
import { IPAsset } from '@/types/ip';
import { useGraphFilters } from './useGraphFilters';
import { useCallback, useEffect, useMemo } from 'react';

// Query keys for React Query caching
export const queryKeys = {
  ipAsset: (ipId: string) => ['ipAsset', ipId],
  derivatives: (ipId: string, options?: any) => 
    options ? ['derivatives', ipId, options] : ['derivatives', ipId],
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
  const { maxDepth = 2, includeDisputes = false, includeSiblings = true, enabled = true } = options;
  const { setLoading, setError } = useGraphFilters();
  
  // Query definition
  const query = useQuery<DerivativeRelationsResponse>({
    queryKey: queryKeys.derivatives(ipId || '', { maxDepth, includeDisputes, includeSiblings }),
    queryFn: async () => {
      try {
        setLoading(true);
        return await storyProtocolClient.getFullGraph(ipId as string, {
          maxDepth,
          includeDisputes,
          includeSiblings,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load graph data');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!ipId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
  
  // Update loading and error states based on query state
  useEffect(() => {
    setLoading(query.isLoading || query.isFetching);
    if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Failed to load graph data');
    } else if (!query.isLoading && !query.isFetching) {
      setError(null);
    }
  }, [query.isLoading, query.isFetching, query.error, setLoading, setError]);

  return query;
}

/**
 * Hook for fetching and transforming graph data with filters
 * @param ipId The root IP asset ID
 * @returns Query result with transformed and filtered graph data ready for visualization
 */
export function useGraphData(ipId: string | null) {
  // Get filter state from Zustand store
  const {
    filters,
    viewPreferences,
    selectedNode,
    setLoading,
    setError,
    setLastUpdated,
    highlightPath,
  } = useGraphFilters();

  // Memoize filters to prevent unnecessary re-renders
  const {
    nodeTypes,
    linkTypes,
    relationshipTypes,
    remixTypes,
    approvalStatuses,
    verificationStatuses,
    searchQuery,
    maxDistance,
    minCreationDate,
    maxCreationDate,
    creators,
    tags
  } = useMemo(() => filters, [filters]);

  // Memoize derivative query options
  const derivativeOptions = useMemo(() => ({
    maxDepth: Math.max(maxDistance, 2), // Always fetch at least 2 levels deep
    includeDisputes: nodeTypes.includes('disputed'),
    includeSiblings: nodeTypes.includes('sibling') || nodeTypes.includes('related'),
    enabled: !!ipId,
  }), [maxDistance, nodeTypes, ipId]);

  // Fetch derivative relationships with proper options based on filters
  const derivativesQuery = useDerivativeRelations(ipId, derivativeOptions);

  // Find the path between the root node and the selected node if any
  const findPathBetweenNodes = useCallback((graphData: GraphData, selectedId: string | null) => {
    if (!selectedId || !graphData || !graphData.metadata?.rootId) return null;

    const rootId = graphData.metadata.rootId;
    if (rootId === selectedId) return null; // No path needed if selected node is the root

    return findPath(graphData, rootId, selectedId);
  }, []);

  // Memoize queryKey dependencies to prevent unnecessary re-renders
  const queryKey = useMemo(() => {
    // Only include filter properties that affect data filtering
    const filterKey = {
      nodeTypes,
      linkTypes,
      relationshipTypes,
      searchQuery,
      maxDistance
    };
    return [...queryKeys.graphData(ipId || ''), filterKey];
  }, [ipId, nodeTypes, linkTypes, relationshipTypes, searchQuery, maxDistance]);

  // Memoize the filter transformation function
  const transformAndFilter = useCallback((data: DerivativeRelationsResponse): GraphData => {
    // Transform API data to graph format
    const graphData = transformToGraphData(data);

    // Apply filters
    return applyFilters(
      graphData,
      nodeTypes,
      linkTypes,
      searchQuery,
      maxDistance,
      relationshipTypes
    );
  }, [nodeTypes, linkTypes, searchQuery, maxDistance, relationshipTypes]);

  // Main graph data query with filtering
  const graphQuery = useQuery<GraphData>({
    queryKey,
    queryFn: () => {
      if (!derivativesQuery.data) {
        throw new Error('Derivative data not available');
      }

      try {
        setLoading(true);

        // Use memoized transformation and filtering
        const filteredData = transformAndFilter(derivativesQuery.data);

        // Update last updated timestamp
        setLastUpdated(new Date().toISOString());

        // Find path to selected node if any and highlight it
        if (selectedNode) {
          const path = findPathBetweenNodes(filteredData, selectedNode);
          if (path) {
            highlightPath(path);
          }
        }

        return filteredData;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to process graph data');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!derivativesQuery.data && !!ipId,
    staleTime: 1 * 60 * 1000, // 1 minute - shorter because filters can change
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update loading and error states based on query state
  useEffect(() => {
    setLoading(graphQuery.isLoading || graphQuery.isFetching);
    if (graphQuery.error) {
      setError(graphQuery.error instanceof Error ? graphQuery.error.message : 'Failed to process graph data');
    } else if (!graphQuery.isLoading && !graphQuery.isFetching && !derivativesQuery.error) {
      setError(null);
    }
  }, [
    graphQuery.isLoading,
    graphQuery.isFetching,
    graphQuery.error,
    derivativesQuery.error,
    setLoading,
    setError
  ]);

  return graphQuery;
}

/**
 * Hook to search for nodes in the graph
 * @param query Search query string
 * @param graphData Current graph data
 * @returns Filtered nodes matching the search query
 */
export function useGraphSearch(query: string, graphData: GraphData | undefined) {
  return useQuery({
    queryKey: ['graphSearch', query, graphData?.nodes?.length],
    queryFn: () => {
      if (!graphData || !graphData.nodes || !query) {
        return { nodes: [], links: [], query, totalResults: 0 };
      }
      
      const lowerQuery = query.toLowerCase();
      
      const matchingNodes = graphData.nodes.filter(node => 
        node.title?.toLowerCase().includes(lowerQuery) ||
        node.description?.toLowerCase().includes(lowerQuery) ||
        node.id.toLowerCase().includes(lowerQuery)
      );
      
      // Get links connecting only these nodes
      const matchingNodeIds = new Set(matchingNodes.map(node => node.id));
      const matchingLinks = graphData.links.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        return matchingNodeIds.has(sourceId) && matchingNodeIds.has(targetId);
      });
      
      return {
        nodes: matchingNodes,
        links: matchingLinks,
        query,
        totalResults: matchingNodes.length
      };
    },
    enabled: !!graphData && !!query && query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get path between two nodes in the graph
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @param graphData Current graph data
 * @returns Path between the nodes or null if no path exists
 */
export function useNodePath(
  sourceId: string | null, 
  targetId: string | null, 
  graphData: GraphData | undefined
) {
  const { highlightPath } = useGraphFilters();
  
  const pathQuery = useQuery({
    queryKey: ['nodePath', sourceId, targetId, graphData?.nodes?.length],
    queryFn: () => {
      if (!sourceId || !targetId || !graphData) {
        return null;
      }
      
      return findPath(graphData, sourceId, targetId);
    },
    enabled: !!sourceId && !!targetId && !!graphData?.nodes?.length,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Highlight the path in the graph when found
  useEffect(() => {
    if (pathQuery.data) {
      highlightPath(pathQuery.data);
    }
    
    return () => {
      highlightPath(null);
    };
  }, [pathQuery.data, highlightPath]);
  
  return pathQuery;
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
    queryKey: queryKeys.derivatives(ipId, { maxDepth, includeDisputes, includeSiblings }),
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
    queryKey: queryKeys.derivatives(ipId),
  });
}