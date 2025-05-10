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

// Graph rendering constants
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

// Touch interaction constants
const DOUBLE_TAP_DELAY = 300; // milliseconds
const LONG_PRESS_DELAY = 500; // milliseconds
const PINCH_SCALE_FACTOR = 0.01; // How much pinching affects zoom
const TAP_DISTANCE_THRESHOLD = 10; // Maximum movement allowed for a tap
const LONG_PRESS_DISTANCE_THRESHOLD = 10; // Maximum movement allowed for long press

// Touch gesture detector for handling mobile interactions
interface TouchState {
  active: boolean;
  startX: number;
  startY: number;
  lastTapTime: number;
  touchPoints: number;
  startDistance: number;
  startZoom: number;
  longPressTimer: NodeJS.Timeout | null;
  longPressMoved: boolean;
  activeNode: GraphNode | null;
}

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
  const [touchState, setTouchState] = useState<TouchState>({
    active: false,
    startX: 0,
    startY: 0,
    lastTapTime: 0,
    touchPoints: 0,
    startDistance: 0,
    startZoom: 0,
    longPressTimer: null,
    longPressMoved: false,
    activeNode: null
  });
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      
      // Adjust node size based on screen size for better touch targets
      const nodeSize = isSmallScreen ? 20 : 15;
      if (viewPreferences.nodeSize !== nodeSize) {
        useGraphFilters.getState().setViewPreferences({ nodeSize });
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [viewPreferences.nodeSize]);
  
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
    
    // Only change cursor on non-touch devices
    if (!isMobile) {
      document.body.style.cursor = node ? 'pointer' : 'default';
    }
  }, [isMobile]);
  
  // Calculate pinch distance between two touch points
  const getPinchDistance = useCallback((e: TouchEvent) => {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }, []);

  // Find the node under a touch point, if any
  const findNodeUnderTouch = useCallback((x: number, y: number): GraphNode | null => {
    if (!graphRef.current || !graphData) return null;
    
    const { nodes } = graphData;
    const graphCanvas = graphRef.current.canvas();
    if (!graphCanvas) return null;
    
    // Convert screen coordinates to canvas coordinates
    const rect = graphCanvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    // Get graph internal coordinates
    const graphCoords = graphRef.current.screen2GraphCoords(canvasX, canvasY);
    
    // Find node closest to touch point
    const NODE_RADIUS_THRESHOLD = isMobile ? 40 : 20; // Larger touch target on mobile
    let closestNode = null;
    let minDistance = Infinity;
    
    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) continue;
      
      const distance = Math.hypot(graphCoords.x - node.x, graphCoords.y - node.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }
    
    // Only consider it a hit if it's within the threshold
    if (minDistance > NODE_RADIUS_THRESHOLD) {
      return null;
    }
    
    return closestNode;
  }, [graphData, isMobile]);
  
  // Handle touch start event
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default browser behavior like scrolling
    
    const touch = e.touches[0];
    const touchCount = e.touches.length;
    const now = Date.now();
    const newState: Partial<TouchState> = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      touchPoints: touchCount,
      longPressMoved: false,
      activeNode: null
    };
    
    // Handle multi-touch
    if (touchCount === 2) {
      newState.startDistance = getPinchDistance(e.nativeEvent);
      newState.startZoom = zoomLevel;
    }
    
    // Clear any existing long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      newState.longPressTimer = null;
    }
    
    // Check if there's a node under the touch point
    const nodeUnderTouch = findNodeUnderTouch(touch.clientX, touch.clientY);
    newState.activeNode = nodeUnderTouch;
    
    // Start long press timer if we're touching a node
    if (nodeUnderTouch) {
      const timer = setTimeout(() => {
        if (!touchState.longPressMoved && touchState.activeNode) {
          // Trigger long press action - similar to node click but with different feedback
          handleNodeClick(touchState.activeNode);
          
          // Provide haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }, LONG_PRESS_DELAY);
      
      newState.longPressTimer = timer;
    }
    
    setTouchState(prev => ({ ...prev, ...newState }));
  }, [touchState, zoomLevel, getPinchDistance, findNodeUnderTouch, handleNodeClick]);
  
  // Handle touch move event
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.active) return;
    
    const touch = e.touches[0];
    const moveX = Math.abs(touch.clientX - touchState.startX);
    const moveY = Math.abs(touch.clientY - touchState.startY);
    const hasMoved = moveX > TAP_DISTANCE_THRESHOLD || moveY > TAP_DISTANCE_THRESHOLD;
    
    // Handle pinch-to-zoom with two fingers
    if (e.touches.length === 2 && touchState.startDistance) {
      const currentDistance = getPinchDistance(e.nativeEvent);
      const distanceChange = currentDistance - touchState.startDistance;
      
      // Calculate new zoom level based on pinch
      if (touchState.startZoom && graphRef.current) {
        const scaleFactor = 1 + (distanceChange * PINCH_SCALE_FACTOR);
        const newZoom = touchState.startZoom * scaleFactor;
        
        // Apply zoom constraints
        const constrainedZoom = Math.max(0.1, Math.min(10, newZoom));
        setZoomLevel(constrainedZoom);
        graphRef.current.zoom(constrainedZoom, 0); // No animation during pinch
      }
    }
    
    // Update long press state if finger has moved significantly
    if (hasMoved && !touchState.longPressMoved) {
      setTouchState(prev => ({ ...prev, longPressMoved: true }));
      
      // Cancel long press timer if it exists
      if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
        setTouchState(prev => ({ ...prev, longPressTimer: null }));
      }
    }
  }, [touchState, getPinchDistance, setZoomLevel]);
  
  // Handle touch end event
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.active) return;
    
    const now = Date.now();
    const touchDuration = now - touchState.lastTapTime;
    const isDoubleTap = touchDuration < DOUBLE_TAP_DELAY && !touchState.longPressMoved;
    
    // Clear any pending long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }
    
    // Handle tap actions
    if (!touchState.longPressMoved) {
      // Handle double tap to zoom in
      if (isDoubleTap && graphRef.current) {
        // If a node is active, zoom and center on it
        if (touchState.activeNode) {
          handleNodeClick(touchState.activeNode);
          const newZoom = zoomLevel * 1.5;
          setZoomLevel(newZoom);
          graphRef.current.zoom(newZoom, ANIMATION_DURATION);
        }
        // Otherwise zoom in on the current center
        else {
          handleZoomIn();
        }
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
      // Handle single tap
      else if (touchState.activeNode) {
        // Briefly highlight the node if it's a single tap
        handleNodeHover(touchState.activeNode);
        setTimeout(() => {
          handleNodeHover(null);
        }, 300);
      }
    }
    
    // Reset touch state
    setTouchState({
      active: false,
      startX: 0,
      startY: 0,
      lastTapTime: now,
      touchPoints: 0,
      startDistance: 0,
      startZoom: 0,
      longPressTimer: null,
      longPressMoved: false,
      activeNode: null
    });
  }, [touchState, zoomLevel, handleNodeClick, handleNodeHover, handleZoomIn, setZoomLevel]);
  
  // Customize node appearance
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = node.id === viewPreferences.highlightedNode;
    const isHovered = hoveredNode && node.id === hoveredNode.id;
    const isSelected = selectedNode === node.id;
    const isRoot = node.type === NodeType.ROOT;
    
    // Determine node size based on view preferences
    let size = viewPreferences.nodeSize / 2 || DEFAULT_NODE_SIZE;
    
    // Increase node size on mobile for better touch targets
    if (isMobile) {
      size = Math.max(size, DEFAULT_NODE_SIZE * 1.5);
    }
    
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
  }, [hoveredNode, selectedNode, viewPreferences, filters.showLabels, isMobile]);
  
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
      // Calculate positions for drawing arrow
      const sourcePos = typeof link.source === 'object' ? link.source : { x: 0, y: 0 };
      const targetPos = typeof link.target === 'object' ? link.target : { x: 0, y: 0 };
      
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const angle = Math.atan2(dy, dx);
      
      // Draw arrow if the link is highlighted or connected to highlight
      if (isHighlighted || isConnectedToHighlight) {
        const length = Math.sqrt(dx * dx + dy * dy);
        const nodeSize = isMobile ? 12 : 8; // Larger on mobile
        
        // Only draw if the link is long enough
        if (length > nodeSize * 2) {
          // Calculate arrow tip position - slightly before the target
          const arrowLength = 12;
          const offsetLength = nodeSize;
          
          const tipX = targetPos.x - (offsetLength * Math.cos(angle));
          const tipY = targetPos.y - (offsetLength * Math.sin(angle));
          
          const arrowAngle = Math.PI / 6; // 30 degrees
          
          // Draw arrowhead
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle - arrowAngle),
            tipY - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle + arrowAngle),
            tipY - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
    }
  }, [hoveredNode, selectedNode, viewPreferences, isMobile]);
  
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
        className={`graph-container ${viewPreferences.darkMode ? 'dark' : ''} ${className} ${isMobile ? 'mobile' : ''}`}
        style={{ 
          width: width || '100%', 
          height: height || '600px',
          position: 'relative'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="derivative-graph-container"
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
            linkDirectionalParticles={isMobile ? 0 : 2} // Disable particles on mobile for performance
            linkDirectionalParticleSpeed={0.003}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            cooldownTime={isMobile ? 2000 : 3000} // Shorter cooldown on mobile
            d3AlphaDecay={viewPreferences.physics?.enabled ? 0.02 : 1}
            d3VelocityDecay={viewPreferences.physics?.friction || 0.3}
            // Physics settings from the store
            warmupTicks={viewPreferences.physics?.enabled ? (isMobile ? 50 : 100) : 0}
            cooldownTicks={viewPreferences.physics?.enabled ? (isMobile ? 25 : 50) : 0}
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
        
        {/* Graph Controls - Responsive with touch support */}
        {showControls && (
          <GraphControls
            graphRef={graphRef}
            rootId={ipId}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            isMobile={isMobile}
          />
        )}

        {/* Graph Legend - Responsive */}
        {showLegend && (
          <GraphLegend
            position={isMobile ? 'bottom-left' : legendPosition}
            compact={dimensions.width < 640 || dimensions.height < 500 || isMobile}
          />
        )}

        {/* Basic zoom controls (always visible) - Larger on mobile */}
        <div className={`graph-controls ${isMobile ? 'mobile' : ''}`}>
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

        {/* Node tooltip (shown when hovering) - Positioned properly on mobile */}
        {hoveredNode && (
          <div 
            className={`graph-tooltip ${viewPreferences.darkMode ? 'dark' : ''} ${isMobile ? 'mobile' : ''}`}
            style={{ 
              position: 'absolute',
              left: isMobile 
                ? Math.min((hoveredNode.x || 0) + dimensions.width / 2 + 10, dimensions.width - 150)
                : (hoveredNode.x || 0) + dimensions.width / 2 + 10,
              top: isMobile
                ? Math.min((hoveredNode.y || 0) + dimensions.height / 2 + 10, dimensions.height - 100) 
                : (hoveredNode.y || 0) + dimensions.height / 2 + 10,
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
        
        {/* Mobile hint overlay for first-time users */}
        {isMobile && (
          <div className="mobile-hint-overlay">
            <div className="hint-container">
              <p>Tap to select • Double-tap to zoom • Pinch to zoom • Press and hold for details</p>
            </div>
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