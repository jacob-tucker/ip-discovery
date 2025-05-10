/**
 * Zustand store for managing graph filters and view preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  GraphFilters, 
  GraphViewPreferences, 
  NodeType, 
  LinkType,
  RelationshipType, 
  RemixType,
  ApprovalStatus,
  VerificationStatus,
  PhysicsSettings,
  LabelSettings,
  GraphLink
} from '@/types/graph';

interface GraphFilterState {
  // Filter settings
  filters: GraphFilters;
  setFilters: (filters: Partial<GraphFilters>) => void;
  resetFilters: () => void;
  
  // Individual filter setters for specific controls
  setNodeTypes: (nodeTypes: NodeType[]) => void;
  setLinkTypes: (linkTypes: LinkType[]) => void;
  setRelationshipTypes: (relationshipTypes: RelationshipType[]) => void;
  setRemixTypes: (remixTypes: RemixType[]) => void;
  setApprovalStatuses: (statuses: ApprovalStatus[]) => void;
  setVerificationStatuses: (statuses: VerificationStatus[]) => void;
  setSearchQuery: (query: string) => void;
  setMaxDistance: (distance: number) => void;
  setShowLabels: (show: boolean) => void;
  setDateRange: (min?: string, max?: string) => void;
  setCreators: (creators: string[]) => void;
  setTags: (tags: string[]) => void;
  
  // View preferences
  viewPreferences: GraphViewPreferences;
  setViewPreferences: (prefs: Partial<GraphViewPreferences>) => void;
  resetViewPreferences: () => void;
  
  // Individual view preference setters
  setAutoZoom: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setNodeSize: (size: number) => void;
  setLinkWidth: (width: number) => void;
  setPhysicsSettings: (settings: Partial<PhysicsSettings>) => void;
  setLabelSettings: (settings: Partial<LabelSettings>) => void;
  setColorScheme: (nodeScheme: string, linkScheme?: string) => void;
  setGroupingEnabled: (enabled: boolean) => void;
  
  // Node and path highlighting
  highlightNode: (nodeId: string | null) => void;
  highlightPath: (links: GraphLink[] | null) => void;
  
  // Selection state
  selectedNode: string | null;
  setSelectedNode: (nodeId: string | null) => void;
  
  // View state
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  centerGraph: () => void;
  
  // Loading and error states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Graph data state
  lastUpdated: string | null;
  setLastUpdated: (timestamp: string) => void;
}

// Default physics settings
const DEFAULT_PHYSICS_SETTINGS: PhysicsSettings = {
  gravity: 0,
  linkStrength: 50,
  friction: 0.9,
  chargeStrength: -80,
  enabled: true
};

// Default label settings
const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  showNodeLabels: true,
  showLinkLabels: false,
  fontSize: 12,
  fontColor: 'rgba(0, 0, 0, 0.8)',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  padding: 4,
  maxLength: 20
};

// Default filter settings
const DEFAULT_FILTERS: GraphFilters = {
  nodeTypes: [
    NodeType.ROOT, 
    NodeType.ANCESTOR, 
    NodeType.DERIVATIVE
  ],
  linkTypes: [
    LinkType.DERIVES_FROM, 
    LinkType.DERIVED_BY
  ],
  relationshipTypes: [
    RelationshipType.REMIX,
    RelationshipType.ADAPTATION,
    RelationshipType.SEQUEL,
    RelationshipType.PREQUEL,
    RelationshipType.SPINOFF
  ],
  searchQuery: '',
  maxDistance: 2,
  showLabels: true,
};

// Default view preferences
const DEFAULT_VIEW_PREFERENCES: GraphViewPreferences = {
  autoZoom: true,
  darkMode: false,
  nodeSize: 15,
  linkWidth: 2,
  highlightedNode: null,
  highlightedPath: null,
  physics: DEFAULT_PHYSICS_SETTINGS,
  labels: DEFAULT_LABEL_SETTINGS,
  nodeColorScheme: 'default',
  linkColorScheme: 'default',
  groupingEnabled: false
};

/**
 * Zustand store for graph filters and preferences with persistence
 */
export const useGraphFilters = create<GraphFilterState>()(
  persist(
    (set) => ({
      // Initial state
      filters: DEFAULT_FILTERS,
      viewPreferences: DEFAULT_VIEW_PREFERENCES,
      selectedNode: null,
      zoomLevel: 1,
      isLoading: false,
      error: null,
      lastUpdated: null,
      
      // Filter actions
      setFilters: (newFilters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...newFilters } 
        })),
      
      resetFilters: () => 
        set({ filters: DEFAULT_FILTERS }),
      
      // Individual filter setters
      setNodeTypes: (nodeTypes) =>
        set((state) => ({
          filters: { ...state.filters, nodeTypes }
        })),
        
      setLinkTypes: (linkTypes) =>
        set((state) => ({
          filters: { ...state.filters, linkTypes }
        })),
        
      setRelationshipTypes: (relationshipTypes) =>
        set((state) => ({
          filters: { ...state.filters, relationshipTypes }
        })),
        
      setRemixTypes: (remixTypes) =>
        set((state) => ({
          filters: { ...state.filters, remixTypes }
        })),
        
      setApprovalStatuses: (approvalStatuses) =>
        set((state) => ({
          filters: { ...state.filters, approvalStatuses }
        })),
        
      setVerificationStatuses: (verificationStatuses) =>
        set((state) => ({
          filters: { ...state.filters, verificationStatuses }
        })),
        
      setSearchQuery: (searchQuery) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery }
        })),
        
      setMaxDistance: (maxDistance) =>
        set((state) => ({
          filters: { ...state.filters, maxDistance }
        })),
        
      setShowLabels: (showLabels) =>
        set((state) => ({
          filters: { ...state.filters, showLabels }
        })),
        
      setDateRange: (minCreationDate, maxCreationDate) =>
        set((state) => ({
          filters: { 
            ...state.filters, 
            minCreationDate, 
            maxCreationDate 
          }
        })),
        
      setCreators: (creators) =>
        set((state) => ({
          filters: { ...state.filters, creators }
        })),
        
      setTags: (tags) =>
        set((state) => ({
          filters: { ...state.filters, tags }
        })),
      
      // View preference actions
      setViewPreferences: (newPrefs) => 
        set((state) => ({ 
          viewPreferences: { ...state.viewPreferences, ...newPrefs } 
        })),
      
      resetViewPreferences: () => 
        set({ viewPreferences: DEFAULT_VIEW_PREFERENCES }),
        
      // Individual view preference setters
      setAutoZoom: (autoZoom) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, autoZoom }
        })),
        
      setDarkMode: (darkMode) =>
        set((state) => ({
          viewPreferences: { 
            ...state.viewPreferences, 
            darkMode,
            labels: {
              ...state.viewPreferences.labels,
              fontColor: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
            }
          }
        })),
        
      setNodeSize: (nodeSize) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, nodeSize }
        })),
        
      setLinkWidth: (linkWidth) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, linkWidth }
        })),
        
      setPhysicsSettings: (settings) =>
        set((state) => ({
          viewPreferences: { 
            ...state.viewPreferences, 
            physics: { ...state.viewPreferences.physics, ...settings }
          }
        })),
        
      setLabelSettings: (settings) =>
        set((state) => ({
          viewPreferences: { 
            ...state.viewPreferences, 
            labels: { ...state.viewPreferences.labels, ...settings }
          }
        })),
        
      setColorScheme: (nodeColorScheme, linkColorScheme) =>
        set((state) => ({
          viewPreferences: { 
            ...state.viewPreferences, 
            nodeColorScheme,
            linkColorScheme: linkColorScheme || nodeColorScheme
          }
        })),
        
      setGroupingEnabled: (groupingEnabled) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, groupingEnabled }
        })),
      
      // Highlighting actions
      highlightNode: (nodeId) => 
        set((state) => ({ 
          viewPreferences: { 
            ...state.viewPreferences, 
            highlightedNode: nodeId 
          } 
        })),
      
      highlightPath: (links) => 
        set((state) => ({ 
          viewPreferences: { 
            ...state.viewPreferences, 
            highlightedPath: links 
          } 
        })),
        
      // Selection actions
      setSelectedNode: (nodeId) => 
        set({ selectedNode: nodeId }),
        
      // View state actions
      setZoomLevel: (zoomLevel) => 
        set({ zoomLevel }),
        
      centerGraph: () => 
        set((state) => ({ 
          zoomLevel: 1,
          viewPreferences: { 
            ...state.viewPreferences, 
            autoZoom: true 
          }
        })),
        
      // Loading and error state actions
      setLoading: (isLoading) => 
        set({ isLoading }),
        
      setError: (error) => 
        set({ error }),
        
      // Data state actions
      setLastUpdated: (lastUpdated) => 
        set({ lastUpdated })
    }),
    {
      name: 'graph-filters-storage',
      partialize: (state) => ({
        // Only persist selected state properties to avoid storage bloat
        filters: {
          nodeTypes: state.filters.nodeTypes,
          linkTypes: state.filters.linkTypes,
          relationshipTypes: state.filters.relationshipTypes,
          maxDistance: state.filters.maxDistance,
          showLabels: state.filters.showLabels
        },
        viewPreferences: {
          darkMode: state.viewPreferences.darkMode,
          nodeSize: state.viewPreferences.nodeSize,
          linkWidth: state.viewPreferences.linkWidth,
          nodeColorScheme: state.viewPreferences.nodeColorScheme,
          linkColorScheme: state.viewPreferences.linkColorScheme
        }
      })
    }
  )
);

/**
 * Hook to get filtered graph state
 * Combines the graph data and filter state for components that need a ready-to-use
 * filtered dataset without manually applying filters
 * Uses memoization to prevent unnecessary re-renders
 */
export function useFilteredGraphState() {
  const {
    filters,
    viewPreferences,
    selectedNode,
    isLoading,
    error,
  } = useGraphFilters();

  // Memoize the return object to prevent unnecessary re-renders
  // This ensures components using this hook only re-render when the data they care about changes
  return useMemo(() => ({
    filters,
    viewPreferences,
    selectedNode,
    isLoading,
    error,
  }), [filters, viewPreferences, selectedNode, isLoading, error]);
}