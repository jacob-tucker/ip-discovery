"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Sliders,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Moon,
  Sun,
  Tag,
  X,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { NodeType, LinkType, RelationshipType } from '@/types/graph';
import { getNodeColor, getLinkColor } from '@/lib/utils/graph/graph-transform';
import { cn } from '@/lib/utils';

// Debounce utility function
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface GraphControlsProps {
  graphRef?: React.MutableRefObject<any>;
  rootId: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  className?: string;
  isMobile?: boolean;
}

/**
 * Graph Controls Component
 * 
 * Provides controls for filtering, searching, and adjusting the graph view.
 * Enhanced with mobile support and touch interactions.
 */
export default function GraphControls({
  graphRef,
  rootId,
  onZoomIn,
  onZoomOut,
  onReset,
  className = '',
  isMobile = false
}: GraphControlsProps) {
  // Get filters and actions from zustand store
  const {
    filters,
    setFilters,
    resetFilters,
    viewPreferences,
    setViewPreferences,
    resetViewPreferences
  } = useGraphFilters();

  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSections, setActiveSections] = useState<string[]>(['nodeTypes']);
  const [searchInputValue, setSearchInputValue] = useState(filters.searchQuery);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCompactView, setIsCompactView] = useState(isMobile);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{y: number, timestamp: number} | null>(null);

  // Initialize local state from filters
  useEffect(() => {
    setSearchInputValue(filters.searchQuery);
  }, [filters.searchQuery]);

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);

    // Clear any existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set a new timer for 150ms
    const timer = setTimeout(() => {
      setFilters({ searchQuery: value });
    }, 150);

    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer, setFilters]);

  // Handle panel expansion toggle
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    setIsCompactView(false); // Expand fully when opening
  }, []);
  
  // Toggle compact view (for mobile)
  const toggleCompactView = useCallback(() => {
    setIsCompactView(prev => !prev);
  }, []);

  // Handle touch events for mobile panel
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !panelRef.current) return;
    
    // Record the starting touch position and time
    touchStartRef.current = {
      y: e.touches[0].clientY,
      timestamp: Date.now()
    };
  }, [isMobile]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current || !panelRef.current) return;
    
    // Prevent default to stop scrolling
    e.preventDefault();
    
    const touchY = e.touches[0].clientY;
    const startY = touchStartRef.current.y;
    const deltaY = touchY - startY;
    
    // Only handle significant movements
    if (Math.abs(deltaY) > 10) {
      if (deltaY > 0) {
        // Swiping down - minimize the panel
        setIsCompactView(true);
      } else {
        // Swiping up - maximize the panel
        setIsCompactView(false);
      }
      
      // Reset touch start to prevent multiple triggers
      touchStartRef.current = null;
    }
  }, [isMobile]);
  
  const handleTouchEnd = useCallback(() => {
    // Reset touch reference
    touchStartRef.current = null;
  }, []);

  // Toggle section visibility
  const toggleSection = useCallback((section: string) => {
    setActiveSections(prev => {
      if (prev.includes(section)) {
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  }, []);

  // Internal state for debounced filters
  const [nodeTypeState, setNodeTypeState] = useState<NodeType[]>(filters.nodeTypes);
  const [linkTypeState, setLinkTypeState] = useState<LinkType[]>(filters.linkTypes);
  const [relationshipTypeState, setRelationshipTypeState] = useState<RelationshipType[]>(filters.relationshipTypes || []);
  const [maxDistanceState, setMaxDistanceState] = useState<number>(filters.maxDistance);

  // Debounced filter values (150ms to match performance requirement)
  const debouncedNodeTypes = useDebounce(nodeTypeState, 150);
  const debouncedLinkTypes = useDebounce(linkTypeState, 150);
  const debouncedRelationshipTypes = useDebounce(relationshipTypeState, 150);
  const debouncedMaxDistance = useDebounce(maxDistanceState, 150);

  // Apply debounced filters to the store
  useEffect(() => {
    setFilters({ nodeTypes: debouncedNodeTypes });
  }, [debouncedNodeTypes, setFilters]);

  useEffect(() => {
    setFilters({ linkTypes: debouncedLinkTypes });
  }, [debouncedLinkTypes, setFilters]);

  useEffect(() => {
    setFilters({ relationshipTypes: debouncedRelationshipTypes });
  }, [debouncedRelationshipTypes, setFilters]);

  useEffect(() => {
    setFilters({ maxDistance: debouncedMaxDistance });
  }, [debouncedMaxDistance, setFilters]);

  // Sync state with filters when they're reset externally
  useEffect(() => {
    setNodeTypeState(filters.nodeTypes);
    setLinkTypeState(filters.linkTypes);
    setRelationshipTypeState(filters.relationshipTypes || []);
    setMaxDistanceState(filters.maxDistance);
  }, [
    // Only include the specific filter properties we need to sync
    filters.nodeTypes,
    filters.linkTypes,
    filters.relationshipTypes,
    filters.maxDistance
  ]);

  // Handle node type filter toggle (updates local state)
  const toggleNodeType = useCallback((type: NodeType) => {
    setNodeTypeState(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Handle link type filter toggle (updates local state)
  const toggleLinkType = useCallback((type: LinkType) => {
    setLinkTypeState(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Handle relationship type filter toggle (updates local state)
  const toggleRelationshipType = useCallback((type: RelationshipType) => {
    setRelationshipTypeState(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Handle max distance change (updates local state)
  const handleMaxDistanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 5) {
      setMaxDistanceState(value);
    }
  }, []);

  // Handle physics settings change
  const handlePhysicsChange = useCallback((setting: string, value: any) => {
    setViewPreferences({
      physics: {
        ...viewPreferences.physics,
        [setting]: value
      }
    });
  }, [viewPreferences.physics, setViewPreferences]);

  // Toggle physics simulation
  const togglePhysics = useCallback(() => {
    setViewPreferences({
      physics: {
        ...viewPreferences.physics,
        enabled: !viewPreferences.physics?.enabled
      }
    });
  }, [viewPreferences.physics, setViewPreferences]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setViewPreferences({ darkMode: !viewPreferences.darkMode });
  }, [viewPreferences.darkMode, setViewPreferences]);

  // Toggle label visibility
  const toggleLabels = useCallback(() => {
    setFilters({ showLabels: !filters.showLabels });
  }, [filters.showLabels, setFilters]);

  // Reset all filters
  const handleResetAll = useCallback(() => {
    resetFilters();
    resetViewPreferences();
    setSearchInputValue('');
    if (onReset) onReset();
  }, [resetFilters, resetViewPreferences, onReset]);

  // Get node type display data
  const nodeTypeData = [
    { type: NodeType.ROOT, label: 'Root', color: getNodeColor({ type: NodeType.ROOT } as any) },
    { type: NodeType.ANCESTOR, label: 'Ancestors', color: getNodeColor({ type: NodeType.ANCESTOR } as any) },
    { type: NodeType.DERIVATIVE, label: 'Derivatives', color: getNodeColor({ type: NodeType.DERIVATIVE } as any) },
    { type: NodeType.RELATED, label: 'Related', color: getNodeColor({ type: NodeType.RELATED } as any) },
    { type: NodeType.SIBLING, label: 'Siblings', color: getNodeColor({ type: NodeType.SIBLING } as any) },
    { type: NodeType.DISPUTED, label: 'Disputed', color: getNodeColor({ type: NodeType.DISPUTED } as any) }
  ];

  // Get link type display data
  const linkTypeData = [
    { type: LinkType.DERIVES_FROM, label: 'Derives From', color: getLinkColor({ type: LinkType.DERIVES_FROM } as any) },
    { type: LinkType.DERIVED_BY, label: 'Derived By', color: getLinkColor({ type: LinkType.DERIVED_BY } as any) },
    { type: LinkType.COMMON_ANCESTOR, label: 'Common Ancestor', color: getLinkColor({ type: LinkType.COMMON_ANCESTOR } as any) },
    { type: LinkType.RELATED, label: 'Related', color: getLinkColor({ type: LinkType.RELATED } as any) }
  ];

  // Get relationship type display data
  const relationshipTypeData = [
    { type: RelationshipType.REMIX, label: 'Remix' },
    { type: RelationshipType.ADAPTATION, label: 'Adaptation' },
    { type: RelationshipType.TRANSLATION, label: 'Translation' },
    { type: RelationshipType.SAMPLE, label: 'Sample' },
    { type: RelationshipType.SEQUEL, label: 'Sequel' },
    { type: RelationshipType.PREQUEL, label: 'Prequel' },
    { type: RelationshipType.SPINOFF, label: 'Spinoff' },
    { type: RelationshipType.INSPIRATION, label: 'Inspiration' },
    { type: RelationshipType.HOMAGE, label: 'Homage' },
    { type: RelationshipType.PARODY, label: 'Parody' }
  ];

  const isActive = (section: string) => activeSections.includes(section);

  // Render control panel button (visible when collapsed)
  if (!isExpanded) {
    return (
      <div className={cn(
        "absolute z-10",
        isMobile ? "bottom-4 right-4" : "top-4 right-4"
      )}>
        <button
          onClick={toggleExpanded}
          className={cn(
            "flex items-center justify-center p-2 rounded-md bg-cardBg border border-border shadow-sm",
            "hover:bg-background transition-colors duration-200",
            viewPreferences.darkMode ? "text-white" : "text-text",
            isMobile ? "h-12 w-12 rounded-full" : "",
            className
          )}
          aria-label="Show graph controls"
        >
          <Filter className="h-5 w-5" />
          {!isMobile && <span className="ml-2 text-sm">Filters</span>}
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className={cn(
        "graph-controls-panel overflow-auto",
        viewPreferences.darkMode ? "dark" : "",
        isMobile ? "mobile" : "",
        isCompactView && isMobile ? "compact" : "",
        className
      )}
      style={{
        position: "absolute",
        top: isMobile ? "auto" : "1rem",
        right: isMobile ? 0 : "1rem",
        bottom: isMobile ? 0 : "auto",
        left: isMobile ? 0 : "auto",
        width: isMobile ? "100%" : "280px",
        maxHeight: isMobile ? (isCompactView ? "6rem" : "75vh") : "calc(100% - 2rem)",
        backgroundColor: viewPreferences.darkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderRadius: isMobile ? "1rem 1rem 0 0" : "0.5rem",
        border: "1px solid",
        borderColor: viewPreferences.darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        borderBottom: isMobile ? "none" : undefined,
        borderLeft: isMobile ? "none" : undefined,
        borderRight: isMobile ? "none" : undefined,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        transition: "max-height 0.3s ease-in-out"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-border">
        <h3 className="text-sm font-medium flex items-center">
          <Sliders className="h-4 w-4 mr-2" />
          Graph Controls
        </h3>
        <div className="flex gap-1">
          {isMobile && (
            <button
              onClick={toggleCompactView}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label={isCompactView ? "Expand controls" : "Minimize controls"}
            >
              {isCompactView ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            onClick={handleResetAll}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Reset all filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={viewPreferences.darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {viewPreferences.darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={toggleExpanded}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Hide controls"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search IP assets..."
            value={searchInputValue}
            onChange={handleSearchChange}
            className={cn(
              "w-full p-2 pr-8 border border-border rounded-md text-sm",
              "focus:outline-none focus:ring-1 focus:ring-primary",
              viewPreferences.darkMode ? "bg-slate-800 text-white" : "bg-white text-text"
            )}
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textMuted" />
        </div>
      </div>

      {/* Filter sections - only shown if not in compact mobile view */}
      {(!isMobile || (isMobile && !isCompactView)) && (
        <div className="flex-1 overflow-y-auto section-content">
          {/* Node Types Section */}
          <div className="border-b border-border">
            <button
              onClick={() => toggleSection('nodeTypes')}
              className="flex justify-between items-center w-full p-3 text-left"
            >
              <span className="flex items-center text-sm font-medium">
                <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                Node Types
              </span>
              {isActive('nodeTypes') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {isActive('nodeTypes') && (
              <div className="px-3 pb-3">
                <div className="space-y-2">
                  {nodeTypeData.map(({ type, label, color }) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`node-${type}`}
                        checked={filters.nodeTypes.includes(type)}
                        onChange={() => toggleNodeType(type)}
                        className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div 
                        className="h-3 w-3 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <label htmlFor={`node-${type}`} className="text-sm">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link Types Section */}
          <div className="border-b border-border">
            <button
              onClick={() => toggleSection('linkTypes')}
              className="flex justify-between items-center w-full p-3 text-left"
            >
              <span className="flex items-center text-sm font-medium">
                <div className="h-3 w-3 border-t-2 border-primary mr-2"></div>
                Link Types
              </span>
              {isActive('linkTypes') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isActive('linkTypes') && (
              <div className="px-3 pb-3">
                <div className="space-y-2">
                  {linkTypeData.map(({ type, label, color }) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`link-${type}`}
                        checked={filters.linkTypes.includes(type)}
                        onChange={() => toggleLinkType(type)}
                        className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div
                        className="h-2 w-6 mr-2"
                        style={{ backgroundColor: color, borderRadius: '1px' }}
                      ></div>
                      <label htmlFor={`link-${type}`} className="text-sm">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Relationship Types Section */}
          <div className="border-b border-border">
            <button
              onClick={() => toggleSection('relationshipTypes')}
              className="flex justify-between items-center w-full p-3 text-left"
            >
              <span className="flex items-center text-sm font-medium">
                <div className="h-3 w-3 rounded-md bg-indigo-500 mr-2"></div>
                Relationship Types
              </span>
              {isActive('relationshipTypes') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isActive('relationshipTypes') && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {relationshipTypeData.map(({ type, label }) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`rel-${type}`}
                        checked={(filters.relationshipTypes || []).includes(type)}
                        onChange={() => toggleRelationshipType(type)}
                        className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <label htmlFor={`rel-${type}`} className="text-sm truncate">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="border-b border-border">
            <button
              onClick={() => toggleSection('settings')}
              className="flex justify-between items-center w-full p-3 text-left"
            >
              <span className="flex items-center text-sm font-medium">
                <Sliders className="h-4 w-4 mr-2" />
                View Settings
              </span>
              {isActive('settings') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {isActive('settings') && (
              <div className="px-3 pb-3">
                <div className="space-y-4">
                  {/* Max Distance */}
                  <div>
                    <label htmlFor="max-distance" className="block text-sm mb-1">
                      Max Relationship Distance: {filters.maxDistance}
                    </label>
                    <input
                      type="range"
                      id="max-distance"
                      min="1"
                      max="5"
                      step="1"
                      value={filters.maxDistance}
                      onChange={handleMaxDistanceChange}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-textMuted">
                      <span>Close</span>
                      <span>Distant</span>
                    </div>
                  </div>
                  
                  {/* Show Labels */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show-labels"
                      checked={filters.showLabels}
                      onChange={toggleLabels}
                      className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="show-labels" className="text-sm flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      Show All Labels
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Physics Settings Section */}
          <div className="border-b border-border">
            <button
              onClick={() => toggleSection('physics')}
              className="flex justify-between items-center w-full p-3 text-left"
            >
              <span className="flex items-center text-sm font-medium">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2V6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 18V22" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12H6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M18 12H22" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Physics Settings
              </span>
              {isActive('physics') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isActive('physics') && (
              <div className="px-3 pb-3">
                <div className="space-y-4">
                  {/* Enable Physics */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-physics"
                      checked={viewPreferences.physics?.enabled ?? true}
                      onChange={togglePhysics}
                      className="mr-2 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="enable-physics" className="text-sm">
                      Enable Physics Simulation
                    </label>
                  </div>

                  {/* Charge Strength */}
                  <div>
                    <label htmlFor="charge-strength" className="block text-sm mb-1">
                      Repulsion Force: {viewPreferences.physics?.chargeStrength || -80}
                    </label>
                    <input
                      type="range"
                      id="charge-strength"
                      min="-200"
                      max="-20"
                      step="10"
                      value={viewPreferences.physics?.chargeStrength || -80}
                      onChange={(e) => handlePhysicsChange('chargeStrength', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      disabled={!(viewPreferences.physics?.enabled ?? true)}
                    />
                    <div className="flex justify-between text-xs text-textMuted">
                      <span>Strong</span>
                      <span>Weak</span>
                    </div>
                  </div>

                  {/* Link Strength */}
                  <div>
                    <label htmlFor="link-strength" className="block text-sm mb-1">
                      Link Strength: {viewPreferences.physics?.linkStrength || 50}
                    </label>
                    <input
                      type="range"
                      id="link-strength"
                      min="10"
                      max="100"
                      step="5"
                      value={viewPreferences.physics?.linkStrength || 50}
                      onChange={(e) => handlePhysicsChange('linkStrength', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      disabled={!(viewPreferences.physics?.enabled ?? true)}
                    />
                    <div className="flex justify-between text-xs text-textMuted">
                      <span>Loose</span>
                      <span>Tight</span>
                    </div>
                  </div>

                  {/* Friction */}
                  <div>
                    <label htmlFor="friction" className="block text-sm mb-1">
                      Friction: {viewPreferences.physics?.friction || 0.9}
                    </label>
                    <input
                      type="range"
                      id="friction"
                      min="0.1"
                      max="0.99"
                      step="0.05"
                      value={viewPreferences.physics?.friction || 0.9}
                      onChange={(e) => handlePhysicsChange('friction', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      disabled={!(viewPreferences.physics?.enabled ?? true)}
                    />
                    <div className="flex justify-between text-xs text-textMuted">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile compact view shows just zoom controls */}
      {isMobile && isCompactView ? (
        <div className="p-3">
          <div className="flex justify-center space-x-4">
            <button
              onClick={onZoomIn}
              className={cn(
                "p-2 rounded-full border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={onZoomOut}
              className={cn(
                "p-2 rounded-full border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={onReset}
              className={cn(
                "p-2 rounded-full border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Reset view"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border">
          <div className="flex justify-center space-x-2">
            <button
              onClick={onZoomIn}
              className={cn(
                "p-2 rounded-md border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={onZoomOut}
              className={cn(
                "p-2 rounded-md border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={onReset}
              className={cn(
                "p-2 rounded-md border border-border",
                "hover:bg-background transition-colors duration-200"
              )}
              aria-label="Reset view"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}