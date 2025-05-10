import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useGraphData, 
  useDerivativeRelations, 
  useGraphSearch, 
  useNodePath,
  queryKeys
} from '@/lib/hooks/useDerivativeData';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import storyProtocolClient from '@/lib/api/story-protocol';
import * as transformUtils from '@/lib/utils/graph/graph-transform';
import { mockGraphData } from '../../test-utils';
import React from 'react';

// Mock the story protocol client
jest.mock('@/lib/api/story-protocol', () => ({
  getFullGraph: jest.fn(),
  getIPAsset: jest.fn()
}));

// Mock the transform utilities
jest.mock('@/lib/utils/graph/graph-transform', () => ({
  transformToGraphData: jest.fn(),
  applyFilters: jest.fn(),
  findPath: jest.fn()
}));

// Create a wrapper for testing hooks that need QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Derivative Data Hooks', () => {
  // Mock data
  const mockIpId = 'root1';
  const mockApiResponse = {
    root: { ipId: mockIpId, title: 'Root IP' },
    ancestors: [],
    derivatives: [],
    related: [],
    disputed: [],
    metadata: { directRelationships: 0 }
  };
  
  // Setup before tests
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset zustand store
    useGraphFilters.setState({
      filters: {
        nodeTypes: ['ROOT', 'DERIVATIVE'],
        linkTypes: ['DERIVES_FROM', 'DERIVED_BY'],
        relationshipTypes: ['REMIX', 'ADAPTATION'],
        maxDistance: 2,
        searchQuery: '',
        showLabels: true
      },
      viewPreferences: {
        darkMode: false,
        nodeSize: 15,
        highlightedNode: null,
        highlightedPath: null
      },
      selectedNode: null,
      zoomLevel: 1,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
    
    // Mock API responses
    (storyProtocolClient.getFullGraph as jest.Mock).mockResolvedValue(mockApiResponse);
    
    // Mock transform functions
    (transformUtils.transformToGraphData as jest.Mock).mockReturnValue(mockGraphData);
    (transformUtils.applyFilters as jest.Mock).mockReturnValue(mockGraphData);
    (transformUtils.findPath as jest.Mock).mockReturnValue([mockGraphData.links[0]]);
  });
  
  describe('useDerivativeRelations', () => {
    it('should fetch derivative relations with correct parameters', async () => {
      const { result } = renderHook(
        () => useDerivativeRelations(mockIpId, { maxDepth: 3 }), 
        { wrapper: createWrapper() }
      );
      
      // Check loading state
      expect(result.current.isLoading).toBe(true);
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verify API was called with correct parameters
      expect(storyProtocolClient.getFullGraph).toHaveBeenCalledWith(
        mockIpId,
        expect.objectContaining({ maxDepth: 3 })
      );
      
      // Check data
      expect(result.current.data).toEqual(mockApiResponse);
    });
    
    it('should not fetch if ipId is null', async () => {
      const { result } = renderHook(
        () => useDerivativeRelations(null), 
        { wrapper: createWrapper() }
      );
      
      // Should not be loading
      expect(result.current.isLoading).toBe(false);
      
      // API should not be called
      expect(storyProtocolClient.getFullGraph).not.toHaveBeenCalled();
    });
    
    it('should update loading state in the store', async () => {
      renderHook(
        () => useDerivativeRelations(mockIpId), 
        { wrapper: createWrapper() }
      );
      
      // Loading state should be true initially
      expect(useGraphFilters.getState().isLoading).toBe(true);
      
      // Wait for loading to complete
      await waitFor(() => expect(useGraphFilters.getState().isLoading).toBe(false));
    });
    
    it('should handle errors correctly', async () => {
      // Make the API call fail
      const errorMessage = 'API error';
      (storyProtocolClient.getFullGraph as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(
        () => useDerivativeRelations(mockIpId), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to fail
      await waitFor(() => expect(result.current.isError).toBe(true));
      
      // Error should be set in the store
      expect(useGraphFilters.getState().error).toBe(errorMessage);
    });
  });
  
  describe('useGraphData', () => {
    it('should transform and filter data correctly', async () => {
      const { result } = renderHook(
        () => useGraphData(mockIpId), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verify transform functions were called
      expect(transformUtils.transformToGraphData).toHaveBeenCalledWith(mockApiResponse);
      expect(transformUtils.applyFilters).toHaveBeenCalledWith(
        mockGraphData,
        expect.any(Array), // nodeTypes
        expect.any(Array), // linkTypes
        expect.any(String), // searchQuery
        expect.any(Number), // maxDistance
        expect.any(Array)  // relationshipTypes
      );
      
      // Check data
      expect(result.current.data).toEqual(mockGraphData);
    });
    
    it('should update lastUpdated timestamp when data is loaded', async () => {
      const beforeTime = new Date().toISOString();
      
      renderHook(
        () => useGraphData(mockIpId), 
        { wrapper: createWrapper() }
      );
      
      // Wait for lastUpdated to be set
      await waitFor(() => expect(useGraphFilters.getState().lastUpdated).not.toBeNull());
      
      const afterTime = new Date().toISOString();
      const lastUpdated = useGraphFilters.getState().lastUpdated;
      
      // Timestamp should be between before and after
      expect(lastUpdated).toBeDefined();
      if (lastUpdated) {
        expect(lastUpdated >= beforeTime).toBe(true);
        expect(lastUpdated <= afterTime).toBe(true);
      }
    });
    
    it('should highlight path to selected node if one exists', async () => {
      // Set a selected node
      useGraphFilters.setState({ selectedNode: 'deriv1' });
      
      const { result } = renderHook(
        () => useGraphData(mockIpId), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verify findPath was called
      expect(transformUtils.findPath).toHaveBeenCalledWith(
        expect.anything(),
        mockIpId,
        'deriv1'
      );
      
      // Path should be set in the store
      expect(useGraphFilters.getState().viewPreferences.highlightedPath).toEqual([mockGraphData.links[0]]);
    });
  });
  
  describe('useGraphSearch', () => {
    it('should filter nodes based on search query', async () => {
      const searchQuery = 'test';
      
      const { result } = renderHook(
        () => useGraphSearch(searchQuery, mockGraphData), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Should contain search results
      expect(result.current.data).toHaveProperty('nodes');
      expect(result.current.data).toHaveProperty('links');
      expect(result.current.data).toHaveProperty('query', searchQuery);
      expect(result.current.data).toHaveProperty('totalResults', expect.any(Number));
    });
    
    it('should return empty results for empty query', async () => {
      const { result } = renderHook(
        () => useGraphSearch('', mockGraphData), 
        { wrapper: createWrapper() }
      );
      
      // Not enabled for empty query
      expect(result.current.data).toBeUndefined();
    });
  });
  
  describe('useNodePath', () => {
    it('should find path between two nodes', async () => {
      const sourceId = 'root1';
      const targetId = 'deriv1';
      
      const { result } = renderHook(
        () => useNodePath(sourceId, targetId, mockGraphData), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verify findPath was called
      expect(transformUtils.findPath).toHaveBeenCalledWith(
        mockGraphData,
        sourceId,
        targetId
      );
      
      // Path should be set in the store
      expect(useGraphFilters.getState().viewPreferences.highlightedPath).toEqual([mockGraphData.links[0]]);
    });
    
    it('should clear highlighted path when unmounted', async () => {
      const sourceId = 'root1';
      const targetId = 'deriv1';
      
      const { result, unmount } = renderHook(
        () => useNodePath(sourceId, targetId, mockGraphData), 
        { wrapper: createWrapper() }
      );
      
      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Path should be set in the store
      expect(useGraphFilters.getState().viewPreferences.highlightedPath).toEqual([mockGraphData.links[0]]);
      
      // Unmount the hook
      unmount();
      
      // Path should be cleared
      expect(useGraphFilters.getState().viewPreferences.highlightedPath).toBeNull();
    });
  });
  
  describe('queryKeys', () => {
    it('should generate consistent keys for the same parameters', () => {
      const key1 = queryKeys.derivatives('ip1', { maxDepth: 2 });
      const key2 = queryKeys.derivatives('ip1', { maxDepth: 2 });
      
      expect(key1).toEqual(key2);
    });
    
    it('should generate different keys for different parameters', () => {
      const key1 = queryKeys.derivatives('ip1', { maxDepth: 2 });
      const key2 = queryKeys.derivatives('ip2', { maxDepth: 2 });
      
      expect(key1).not.toEqual(key2);
    });
  });
});