import { renderHook, act } from '@testing-library/react';
import { useGraphFilters, useFilteredGraphState } from '@/lib/hooks/useGraphFilters';
import { NodeType, LinkType, RelationshipType } from '@/types/graph';

// Clear storage before tests to avoid state persistence
beforeEach(() => {
  localStorage.clear();
  
  // Reset Zustand store to default values between tests
  act(() => {
    const { resetFilters, resetViewPreferences } = useGraphFilters.getState();
    resetFilters();
    resetViewPreferences();
    useGraphFilters.setState({ 
      selectedNode: null,
      zoomLevel: 1,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  });
});

describe('useGraphFilters hook', () => {
  describe('filter state and actions', () => {
    it('should initialize with default filter values', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      expect(result.current.filters.nodeTypes).toContain(NodeType.ROOT);
      expect(result.current.filters.nodeTypes).toContain(NodeType.DERIVATIVE);
      expect(result.current.filters.linkTypes).toContain(LinkType.DERIVES_FROM);
      expect(result.current.filters.relationshipTypes).toContain(RelationshipType.REMIX);
      expect(result.current.filters.maxDistance).toBe(2);
      expect(result.current.filters.showLabels).toBe(true);
    });
    
    it('should update nodeTypes filter', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      act(() => {
        result.current.setNodeTypes([NodeType.ROOT]);
      });
      
      expect(result.current.filters.nodeTypes).toEqual([NodeType.ROOT]);
      expect(result.current.filters.nodeTypes).not.toContain(NodeType.DERIVATIVE);
    });
    
    it('should update searchQuery filter', () => {
      const { result } = renderHook(() => useGraphFilters());
      const searchQuery = 'test search';
      
      act(() => {
        result.current.setSearchQuery(searchQuery);
      });
      
      expect(result.current.filters.searchQuery).toBe(searchQuery);
    });
    
    it('should reset filters to default values', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      // First modify some filters
      act(() => {
        result.current.setNodeTypes([NodeType.ROOT]);
        result.current.setSearchQuery('test');
      });
      
      // Then reset
      act(() => {
        result.current.resetFilters();
      });
      
      // Verify defaults are restored
      expect(result.current.filters.nodeTypes).toContain(NodeType.DERIVATIVE);
      expect(result.current.filters.searchQuery).toBe('');
    });
  });
  
  describe('view preferences state and actions', () => {
    it('should initialize with default view preference values', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      expect(result.current.viewPreferences.darkMode).toBe(false);
      expect(result.current.viewPreferences.nodeSize).toBe(15);
      expect(result.current.viewPreferences.physics.enabled).toBe(true);
    });
    
    it('should update darkMode preference', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      act(() => {
        result.current.setDarkMode(true);
      });
      
      expect(result.current.viewPreferences.darkMode).toBe(true);
      // Should also update label colors for dark mode
      expect(result.current.viewPreferences.labels.fontColor).toContain('255, 255, 255');
    });
    
    it('should update physics settings', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      act(() => {
        result.current.setPhysicsSettings({ 
          enabled: false,
          chargeStrength: -100
        });
      });
      
      expect(result.current.viewPreferences.physics.enabled).toBe(false);
      expect(result.current.viewPreferences.physics.chargeStrength).toBe(-100);
      // Other physics settings should remain unchanged
      expect(result.current.viewPreferences.physics.friction).toBe(0.9);
    });
    
    it('should reset view preferences to default values', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      // First modify some preferences
      act(() => {
        result.current.setDarkMode(true);
        result.current.setNodeSize(30);
      });
      
      // Then reset
      act(() => {
        result.current.resetViewPreferences();
      });
      
      // Verify defaults are restored
      expect(result.current.viewPreferences.darkMode).toBe(false);
      expect(result.current.viewPreferences.nodeSize).toBe(15);
    });
  });
  
  describe('node selection and highlighting', () => {
    it('should set selected node', () => {
      const { result } = renderHook(() => useGraphFilters());
      const nodeId = 'node-123';
      
      act(() => {
        result.current.setSelectedNode(nodeId);
      });
      
      expect(result.current.selectedNode).toBe(nodeId);
    });
    
    it('should highlight a node', () => {
      const { result } = renderHook(() => useGraphFilters());
      const nodeId = 'node-123';
      
      act(() => {
        result.current.highlightNode(nodeId);
      });
      
      expect(result.current.viewPreferences.highlightedNode).toBe(nodeId);
    });
    
    it('should highlight a path', () => {
      const { result } = renderHook(() => useGraphFilters());
      const mockPath = [
        { id: 'link1', source: 'node1', target: 'node2' },
        { id: 'link2', source: 'node2', target: 'node3' }
      ];
      
      act(() => {
        result.current.highlightPath(mockPath);
      });
      
      expect(result.current.viewPreferences.highlightedPath).toEqual(mockPath);
    });
    
    it('should clear highlighted node', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      // First set a highlighted node
      act(() => {
        result.current.highlightNode('node-123');
      });
      
      // Then clear it
      act(() => {
        result.current.highlightNode(null);
      });
      
      expect(result.current.viewPreferences.highlightedNode).toBeNull();
    });
  });
  
  describe('zoom and view state', () => {
    it('should set zoom level', () => {
      const { result } = renderHook(() => useGraphFilters());
      const zoomLevel = 2.5;
      
      act(() => {
        result.current.setZoomLevel(zoomLevel);
      });
      
      expect(result.current.zoomLevel).toBe(zoomLevel);
    });
    
    it('should reset view when centering the graph', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      // First modify zoom and autoZoom
      act(() => {
        result.current.setZoomLevel(2.5);
        result.current.setViewPreferences({ autoZoom: false });
      });
      
      // Then center the graph
      act(() => {
        result.current.centerGraph();
      });
      
      expect(result.current.zoomLevel).toBe(1);
      expect(result.current.viewPreferences.autoZoom).toBe(true);
    });
  });
  
  describe('loading and error states', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useGraphFilters());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should set error state', () => {
      const { result } = renderHook(() => useGraphFilters());
      const errorMessage = 'Failed to load graph data';
      
      act(() => {
        result.current.setError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should set last updated timestamp', () => {
      const { result } = renderHook(() => useGraphFilters());
      const timestamp = new Date().toISOString();
      
      act(() => {
        result.current.setLastUpdated(timestamp);
      });
      
      expect(result.current.lastUpdated).toBe(timestamp);
    });
  });
});

describe('useFilteredGraphState hook', () => {
  it('should return the correct subset of state', () => {
    const { result } = renderHook(() => useFilteredGraphState());
    
    // Should contain these properties
    expect(result.current).toHaveProperty('filters');
    expect(result.current).toHaveProperty('viewPreferences');
    expect(result.current).toHaveProperty('selectedNode');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
  
  it('should reflect changes to the main store', () => {
    const { result } = renderHook(() => useFilteredGraphState());
    
    // Update store through the main hook
    act(() => {
      useGraphFilters.getState().setSelectedNode('node-123');
      useGraphFilters.getState().setLoading(true);
    });
    
    // Changes should be reflected in the filtered state
    expect(result.current.selectedNode).toBe('node-123');
    expect(result.current.isLoading).toBe(true);
  });
});