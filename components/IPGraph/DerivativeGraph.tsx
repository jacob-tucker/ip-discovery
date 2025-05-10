"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph-2d';
import { easeCubicInOut } from 'd3-ease';
import { useGraphData } from '@/lib/hooks/useDerivativeData';
import { getNodeColor, getLinkColor, applyFilters } from '@/lib/utils/graph/graph-transform';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { GraphData, GraphNode, GraphLink, NodeType } from '@/types/graph';
import GraphControls from './GraphControls';
import '../../styles/graph.css';

interface DerivativeGraphProps {
  ipId: string;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
  showControls?: boolean;
}

const DEFAULT_NODE_SIZE = 6;
const NODE_HIGHLIGHT_SIZE = 10;
const ROOT_NODE_SIZE_MULTIPLIER = 1.5;
const LABEL_FONT_SIZE = 4;
const CANVAS_BG_COLOR = 'rgba(248, 250, 252, 0.8)';
const DARK_CANVAS_BG_COLOR = 'rgba(15, 23, 42, 0.8)';
const TEXT_COLOR = '#334155';
const DARK_TEXT_COLOR = '#E2E8F0';
const LINK_WIDTH = 1.5;
const LINK_HIGHLIGHT_WIDTH = 3;
const ANIMATION_DURATION = 800;

/**
 * DerivativeGraph Component
 * 
 * A force-directed graph visualization for IP asset relationships.
 * Displays ancestors, derivatives, and related IPs in an interactive graph.
 */
export default function DerivativeGraph({
  ipId,
  width = 800,
  height = 600,
  onNodeClick,
  className = '',
  showControls = true
}: DerivativeGraphProps) {
  // References
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Get graph data using the custom hook
  const { data: rawGraphData, isLoading, error } = useGraphData(ipId);
  
  // Use graph filters from Zustand store
  const { 
    viewPreferences,
    setViewPreferences,
    highlightNode,
    filters,
    setFilters
  } = useGraphFilters();
  
  // Apply filters to the graph data
  const graphData = useMemo(() => {
    if (!rawGraphData) return null;
    
    // Apply filters to the graph data
    return applyFilters(
      rawGraphData,
      filters.nodeTypes,
      filters.linkTypes,
      filters.searchQuery,
      filters.maxDistance
    );
  }, [rawGraphData, filters.nodeTypes, filters.linkTypes, filters.searchQuery, filters.maxDistance]);
  
  // Extract graph dimensions from container if available
  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        setDimensions({
          width: offsetWidth,
          height: offsetHeight
        });
      }
    }
  }, []);
  
  // Re-render graph on window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setDimensions({
            width: offsetWidth,
            height: offsetHeight
          });
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Focus on root node when graph data is loaded or filters change
  useEffect(() => {
    if (graphData && graphRef.current && !isLoading) {
      // Find the root node
      const rootNode = graphData.nodes.find(node => node.type === NodeType.ROOT);
      if (rootNode) {
        // Center the view on the root node with animation
        graphRef.current.centerAt(
          rootNode.x || 0, 
          rootNode.y || 0,
          ANIMATION_DURATION
        );
        graphRef.current.zoom(zoomLevel, ANIMATION_DURATION);
      }
    }
  }, [graphData, isLoading, zoomLevel]);
  
  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    highlightNode(node.id);
    
    if (graphRef.current) {
      // Center view on the clicked node with animation
      graphRef.current.centerAt(
        node.x || 0,
        node.y || 0,
        ANIMATION_DURATION
      );
    }
    
    // Call external handler if provided
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick, highlightNode]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);
  
  // Customize node appearance
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = node.id === viewPreferences.highlightedNode;
    const isHovered = hoveredNode && node.id === hoveredNode.id;
    const isSelected = selectedNode && node.id === selectedNode.id;
    const isRoot = node.type === NodeType.ROOT;
    
    // Determine node size
    let size = DEFAULT_NODE_SIZE;
    if (isRoot) size *= ROOT_NODE_SIZE_MULTIPLIER;
    if (isHighlighted || isHovered || isSelected) size = NODE_HIGHLIGHT_SIZE;
    
    // Get node color
    const color = getNodeColor(node, isHighlighted || isHovered || isSelected);
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = isHighlighted || isHovered || isSelected 
      ? '#FFFFFF' 
      : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = isHighlighted || isHovered || isSelected ? 2 : 1;
    ctx.stroke();
    
    // Draw label if node is highlighted, hovered, selected, or if showLabels is true
    if (isHighlighted || isHovered || isSelected || filters.showLabels || isRoot) {
      const label = node.title || node.id.substring(0, 8);
      ctx.font = `${LABEL_FONT_SIZE}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Draw label background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = viewPreferences.darkMode 
        ? 'rgba(15, 23, 42, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        -textWidth / 2 - 2,
        size + 2,
        textWidth + 4,
        LABEL_FONT_SIZE + 4
      );
      
      // Draw label text
      ctx.fillStyle = viewPreferences.darkMode ? DARK_TEXT_COLOR : TEXT_COLOR;
      ctx.fillText(label, 0, size + 4);
    }
    
    // If the node has an image and it's visible enough (large enough)
    if (node.image && (isHighlighted || isHovered || isSelected || isRoot)) {
      // This would ideally load and draw the image
      // We'll implement this in a future enhancement
    }
  }, [hoveredNode, selectedNode, viewPreferences.highlightedNode, viewPreferences.darkMode, filters.showLabels]);
  
  // Customize link appearance
  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = viewPreferences.highlightedPath?.some(
      pathLink => 
        pathLink.source === link.source && 
        pathLink.target === link.target
    );
    
    // Get source and target nodes
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Highlight links connected to hovered/selected node
    const isConnectedToHighlight = 
      (hoveredNode && (sourceId === hoveredNode.id || targetId === hoveredNode.id)) ||
      (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) ||
      (viewPreferences.highlightedNode && 
        (sourceId === viewPreferences.highlightedNode || 
         targetId === viewPreferences.highlightedNode));
    
    // Set link properties
    ctx.lineWidth = isHighlighted || isConnectedToHighlight 
      ? LINK_HIGHLIGHT_WIDTH 
      : LINK_WIDTH;
    ctx.strokeStyle = getLinkColor(
      link, 
      isHighlighted || isConnectedToHighlight
    );
    
    // Add dash effect for certain link types
    if (link.type === 'related') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    
    // Draw arrow for directed links
    if (link.type === 'derivesFrom' || link.type === 'derivedBy') {
      // We'll implement directional arrows in a future enhancement
    }
  }, [hoveredNode, selectedNode, viewPreferences.highlightedNode, viewPreferences.highlightedPath]);
  
  // Zoom in handler
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const newZoom = zoomLevel * 1.2;
      setZoomLevel(newZoom);
      graphRef.current.zoom(newZoom, ANIMATION_DURATION);
    }
  }, [zoomLevel]);
  
  // Zoom out handler
  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const newZoom = zoomLevel / 1.2;
      setZoomLevel(newZoom);
      graphRef.current.zoom(newZoom, ANIMATION_DURATION);
    }
  }, [zoomLevel]);
  
  // Reset view handler
  const handleReset = useCallback(() => {
    if (graphRef.current && rawGraphData) {
      const rootNode = rawGraphData.nodes.find(node => node.type === NodeType.ROOT);
      if (rootNode) {
        setZoomLevel(1);
        graphRef.current.centerAt(
          rootNode.x || 0, 
          rootNode.y || 0, 
          ANIMATION_DURATION
        );
        graphRef.current.zoom(1, ANIMATION_DURATION);
      }
    }
  }, [rawGraphData]);
  
  // Memoize the graph component to avoid unnecessary re-renders
  const forceGraph = useMemo(() => {
    if (!graphData || isLoading) {
      return null;
    }
    
    return (
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={viewPreferences.darkMode ? DARK_CANVAS_BG_COLOR : CANVAS_BG_COLOR}
        nodeId="id"
        nodeLabel="title"
        nodeRelSize={DEFAULT_NODE_SIZE}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.003}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={50}
      />
    );
  }, [
    graphData, 
    isLoading, 
    dimensions, 
    paintNode, 
    paintLink, 
    handleNodeClick, 
    handleNodeHover,
    viewPreferences.darkMode
  ]);
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        ref={containerRef} 
        className={`graph-container ${className}`}
        style={{ 
          width: width || '100%', 
          height: height || '600px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p className="loading-text">Loading Derivative Galaxy...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        ref={containerRef} 
        className={`graph-container error ${className}`}
        style={{ 
          width: width || '100%', 
          height: height || '600px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column' 
        }}
      >
        <div className="error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L20 20H4L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17V17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="error-text">Error loading graph data</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // No data state
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div 
        ref={containerRef} 
        className={`graph-container empty ${className}`}
        style={{ 
          width: width || '100%', 
          height: height || '600px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column' 
        }}
      >
        <div className="empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="empty-text">No relationship data available</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className={`graph-container ${viewPreferences.darkMode ? 'dark' : ''} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '600px',
        position: 'relative'
      }}
    >
      {/* Graph visualization */}
      {forceGraph}
      
      {/* Graph Controls */}
      {showControls && (
        <GraphControls
          graphRef={graphRef}
          rootId={ipId}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      )}
      
      {/* Basic zoom controls (always visible) */}
      <div className="graph-controls">
        <button 
          className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
          onClick={handleReset}
          aria-label="Reset view"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 4V8H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 8L7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Node tooltip (shown when hovering) */}
      {hoveredNode && (
        <div 
          className={`graph-tooltip ${viewPreferences.darkMode ? 'dark' : ''}`}
          style={{ 
            position: 'absolute',
            left: (hoveredNode.x || 0) + dimensions.width / 2 + 10,
            top: (hoveredNode.y || 0) + dimensions.height / 2 + 10,
          }}
        >
          <div className="tooltip-title">{hoveredNode.title}</div>
          <div className="tooltip-type">{hoveredNode.type}</div>
        </div>
      )}
    </div>
  );
}