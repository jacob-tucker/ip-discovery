/**
 * Zustand store for managing graph filters and view preferences
 */

import { create } from 'zustand';
import { GraphFilters, GraphViewPreferences, NodeType, LinkType } from '@/types/graph';

interface GraphFilterState {
  // Filter settings
  filters: GraphFilters;
  setFilters: (filters: Partial<GraphFilters>) => void;
  resetFilters: () => void;
  
  // View preferences
  viewPreferences: GraphViewPreferences;
  setViewPreferences: (prefs: Partial<GraphViewPreferences>) => void;
  resetViewPreferences: () => void;
  
  // Node and path highlighting
  highlightNode: (nodeId: string | null) => void;
  highlightPath: (links: any[] | null) => void;
}

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
};

/**
 * Zustand store for graph filters and preferences
 */
export const useGraphFilters = create<GraphFilterState>((set) => ({
  // Initial state
  filters: DEFAULT_FILTERS,
  viewPreferences: DEFAULT_VIEW_PREFERENCES,
  
  // Filter actions
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),
  
  resetFilters: () => 
    set({ filters: DEFAULT_FILTERS }),
  
  // View preference actions
  setViewPreferences: (newPrefs) => 
    set((state) => ({ 
      viewPreferences: { ...state.viewPreferences, ...newPrefs } 
    })),
  
  resetViewPreferences: () => 
    set({ viewPreferences: DEFAULT_VIEW_PREFERENCES }),
  
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
}));