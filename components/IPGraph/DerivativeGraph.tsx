"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph-2d';
import { easeCubicInOut } from 'd3-ease';
import { useGraphData } from '@/lib/hooks/useDerivativeData';
import { getNodeColor, getLinkColor, getNodeLabel } from '@/lib/utils/graph/graph-transform';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { GraphData, GraphNode, GraphLink, NodeType } from '@/types/graph';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';
import { GraphLoadingState, GraphStateHandler } from './GraphLoadingState';
import { GraphErrorBoundary, withGraphErrorBoundary } from './GraphErrorBoundary';
import '../../styles/graph.css';

interface DerivativeGraphProps {
  ipId: string;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
  showControls?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
 * DerivativeGraph Component (Inner implementation)
 * 
 * A force-directed graph visualization for IP asset relationships.
 * Displays ancestors, derivatives, and related IPs in an interactive graph.
 */
const DerivativeGraphInner = ({
  ipId,
  width = 800,
  height = 600,
  onNodeClick,
  className = '',
  showControls = true,
  showLegend = true,
  legendPosition = 'bottom-left'
}: DerivativeGraphProps) => {
  // References
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  
  // Get graph data using the enhanced hooks with proper state management
  const { data: graphData, error } = useGraphData(ipId);
  
  // Use graph filters from Zustand store
  const { 
    viewPreferences,
    filters,
    selectedNode,
    setSelectedNode,
    highlightNode,
    highlightPath,
    zoomLevel,
    setZoomLevel,
    isLoading,
    setLastUpdated,
    setError
  } = useGraphFilters();
  
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
  
  // Update timestamp when data is loaded
  useEffect(() => {
    if (graphData && !isLoading) {
      setLastUpdated(new Date().toISOString());
    }
  }, [graphData, isLoading, setLastUpdated]);
  
  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node.id);
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
  }, [onNodeClick, highlightNode, setSelectedNode]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);
  
  // Customize node appearance
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = node.id === viewPreferences.highlightedNode;
    const isHovered = hoveredNode && node.id === hoveredNode.id;
    const isSelected = selectedNode === node.id;
    const isRoot = node.type === NodeType.ROOT;
    
    // Determine node size based on view preferences
    let size = viewPreferences.nodeSize / 2 || DEFAULT_NODE_SIZE;
    if (isRoot) size *= ROOT_NODE_SIZE_MULTIPLIER;
    if (isHighlighted || isHovered || isSelected) size = NODE_HIGHLIGHT_SIZE;
    
    // Get node color from utility function
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
    
    // Draw label based on view preferences
    const labelSettings = viewPreferences.labels;
    if (isHighlighted || isHovered || isSelected || filters.showLabels || isRoot) {
      const label = getNodeLabel(
        node, 
        labelSettings?.maxLength || 20
      );
      
      const fontSize = labelSettings?.fontSize || LABEL_FONT_SIZE;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Draw label background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = viewPreferences.darkMode 
        ? labelSettings?.backgroundColor || 'rgba(15, 23, 42, 0.8)' 
        : labelSettings?.backgroundColor || 'rgba(255, 255, 255, 0.8)';
      
      const padding = labelSettings?.padding || 2;
      ctx.fillRect(
        -textWidth / 2 - padding,
        size + padding,
        textWidth + (padding * 2),
        fontSize + (padding * 2)
      );
      
      // Draw label text
      ctx.fillStyle = viewPreferences.darkMode 
        ? labelSettings?.fontColor || DARK_TEXT_COLOR 
        : labelSettings?.fontColor || TEXT_COLOR;
      ctx.fillText(label, 0, size + padding + 1);
    }
    
    // If the node has an image and it's visible enough (large enough)
    if (node.image && (isHighlighted || isHovered || isSelected || isRoot) && size > 8) {
      // In a real implementation, we would load and display the image
      // We'll indicate an image is available with a small dot
      ctx.beginPath();
      ctx.arc(size/2, -size/2, 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [hoveredNode, selectedNode, viewPreferences, filters.showLabels]);
  
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
      (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) ||
      (viewPreferences.highlightedNode && 
        (sourceId === viewPreferences.highlightedNode || 
         targetId === viewPreferences.highlightedNode));
    
    // Set link properties based on view preferences
    ctx.lineWidth = isHighlighted || isConnectedToHighlight 
      ? LINK_HIGHLIGHT_WIDTH 
      : viewPreferences.linkWidth || LINK_WIDTH;
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
      // Calculate positions for drawing arrow (basic implementation)
      const sourcePos = typeof link.source === 'object' ? link.source : { x: 0, y: 0 };
      const targetPos = typeof link.target === 'object' ? link.target : { x: 0, y: 0 };
      
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const angle = Math.atan2(dy, dx);
      
      // Will be implemented in a more sophisticated way in a future enhancement
    }
  }, [hoveredNode, selectedNode, viewPreferences]);
  
  // Zoom in handler
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const newZoom = zoomLevel * 1.2;
      setZoomLevel(newZoom);
      graphRef.current.zoom(newZoom, ANIMATION_DURATION);
    }
  }, [zoomLevel, setZoomLevel]);
  
  // Zoom out handler
  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const newZoom = zoomLevel / 1.2;
      setZoomLevel(newZoom);
      graphRef.current.zoom(newZoom, ANIMATION_DURATION);
    }
  }, [zoomLevel, setZoomLevel]);
  
  // Reset view handler
  const handleReset = useCallback(() => {
    if (graphRef.current && graphData) {
      const rootNode = graphData.nodes.find(node => node.type === NodeType.ROOT);
      if (rootNode) {
        setZoomLevel(1);
        setSelectedNode(null);
        highlightNode(null);
        highlightPath(null);
        
        graphRef.current.centerAt(
          rootNode.x || 0, 
          rootNode.y || 0, 
          ANIMATION_DURATION
        );
        graphRef.current.zoom(1, ANIMATION_DURATION);
      }
    }
  }, [graphData, setZoomLevel, setSelectedNode, highlightNode, highlightPath]);
  
  // Use GraphStateHandler to handle loading, error, and empty states
  return (
    <GraphStateHandler
      isLoading={isLoading}
      error={error?.message}
      isEmpty={!graphData || !graphData.nodes || graphData.nodes.length === 0}
      emptyMessage="No relationship data available for this IP asset"
      height={height}
    >
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
        {graphData && (
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
            d3AlphaDecay={viewPreferences.physics?.enabled ? 0.02 : 1}
            d3VelocityDecay={viewPreferences.physics?.friction || 0.3}
            // Physics settings from the store
            warmupTicks={viewPreferences.physics?.enabled ? 100 : 0}
            cooldownTicks={viewPreferences.physics?.enabled ? 50 : 0}
            d3Force={viewPreferences.physics?.enabled ? {
              charge: {
                strength: viewPreferences.physics.chargeStrength || -80,
                distanceMax: 300
              },
              link: {
                strength: link => {
                  // Apply strength modifiers based on link type and store settings
                  const baseStrength = link.strength || 0.5;
                  return baseStrength * ((viewPreferences.physics.linkStrength || 50) / 50);
                },
                distance: link => link.distance || 30
              }
            } : undefined}
          />
        )}
        
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

        {/* Graph Legend */}
        {showLegend && (
          <GraphLegend
            position={legendPosition}
            compact={dimensions.width < 640 || dimensions.height < 500}
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
            {hoveredNode.data?.relationshipType && (
              <div className="tooltip-relationship">
                {hoveredNode.data.relationshipType}
              </div>
            )}
          </div>
        )}
      </div>
    </GraphStateHandler>
  );
};

/**
 * DerivativeGraph with Error Boundary
 * 
 * Wraps the graph component with an error boundary to handle rendering errors
 */
export default function DerivativeGraph(props: DerivativeGraphProps) {
  return (
    <GraphErrorBoundary>
      <DerivativeGraphInner {...props} />
    </GraphErrorBoundary>
  );
}