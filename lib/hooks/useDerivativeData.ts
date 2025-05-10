/**
 * React Query hook for fetching derivative relationship data
 */

import { useQuery } from '@tanstack/react-query';
import { getDerivativeRelations } from '@/lib/api/story-protocol';
import { DerivativeRelationsResponse } from '@/types/graph';

/**
 * Hook for fetching derivative relationship data
 * @param ipId - The IP asset ID to fetch relationships for
 * @returns Query result with derivative data
 */
export function useDerivativeData(ipId: string) {
  return useQuery<DerivativeRelationsResponse, Error>({
    queryKey: ['derivatives', ipId],
    queryFn: () => getDerivativeRelations(ipId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!ipId, // Only fetch if ipId is provided
  });
}

/**
 * Hook for prefetching derivative data (for optimistic loading)
 * @param queryClient - React Query client instance
 * @param ipId - The IP asset ID to prefetch
 */
export function prefetchDerivativeData(queryClient: any, ipId: string) {
  queryClient.prefetchQuery({
    queryKey: ['derivatives', ipId],
    queryFn: () => getDerivativeRelations(ipId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}