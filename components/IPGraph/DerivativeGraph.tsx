"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph-2d';
import { easeCubicInOut } from 'd3-ease';
import { useGraphData } from '@/lib/hooks/useDerivativeData';
import { getNodeColor, getLinkColor, getNodeLabel, findRelationshipPath } from '@/lib/utils/graph/graph-transform';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { GraphData, GraphNode, GraphLink, NodeType } from '@/types/graph';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';
import GraphTooltip from './GraphTooltip';
import PathHighlight from './PathHighlight';
import KeyboardControls from './KeyboardControls';
import AccessibilityAnnouncer from './AccessibilityAnnouncer';
import GraphDescription from './GraphDescription';
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
  /**
   * Shows a text-based representation of the graph (for screen readers)
   * @default false
   */
  showDescription?: boolean;
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
  legendPosition = 'bottom-left',
  showDescription = false
}: DerivativeGraphProps) => {
  // References
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const [isAssertive, setIsAssertive] = useState(false);
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

  // Set up keyboard event handlers for accessibility
  useEffect(() => {
    // Skip if no graph data is loaded
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    // Handler for keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation in focus mode or when activating focus mode
      if (!isFocusMode && e.key !== 'Tab') return;

      const filteredNodes = graphData.nodes.filter(node =>
        // Apply the same filters as the graph
        filters.nodeTypes.includes(node.type)
      );

      // Tab key activates focus mode if not active
      if (e.key === 'Tab' && !isFocusMode) {
        e.preventDefault();
        setIsFocusMode(true);
        setFocusedNodeIndex(0);
        return;
      }

      // Escape key exits focus mode
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      // H key toggles help panel
      if (e.key === 'h' || e.key === 'H') {
        // We'll handle this in the KeyboardControls component
        return;
      }

      // Plus/minus keys for zoom
      if ((e.key === '+' || e.key === '=') && isFocusMode) {
        handleZoomIn();
        return;
      }
      if (e.key === '-' && isFocusMode) {
        handleZoomOut();
        return;
      }

      // R key for reset
      if ((e.key === 'r' || e.key === 'R') && isFocusMode) {
        handleReset();
        return;
      }

      // Arrow keys navigate between nodes
      if (isFocusMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        let newIndex = focusedNodeIndex;

        // Calculate new index based on arrow key
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          newIndex = (focusedNodeIndex + 1) % filteredNodes.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          newIndex = (focusedNodeIndex - 1 + filteredNodes.length) % filteredNodes.length;
        }

        // Update focused node index
        setFocusedNodeIndex(newIndex);

        // Update view to center on the new focused node
        if (graphRef.current && filteredNodes[newIndex]) {
          const node = filteredNodes[newIndex];
          graphRef.current.centerAt(
            node.x || 0,
            node.y || 0,
            ANIMATION_DURATION / 2
          );
        }
      }

      // Enter key selects the focused node
      if (e.key === 'Enter' && isFocusMode && focusedNodeIndex >= 0 && focusedNodeIndex < filteredNodes.length) {
        const node = filteredNodes[focusedNodeIndex];
        handleNodeClick(node);
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    graphData,
    isFocusMode,
    focusedNodeIndex,
    filters.nodeTypes,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleNodeClick
  ]);
  
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
  
  // Function to announce screen reader messages
  const announce = useCallback((message: string, assertive: boolean = false) => {
    setAnnouncement(message);
    setIsAssertive(assertive);
  }, []);

  // Handle node click with enhanced animation and path highlighting
  const handleNodeClick = useCallback((node: GraphNode) => {
    // Don't re-process if already selected
    if (selectedNode === node.id) return;

    setSelectedNode(node.id);
    highlightNode(node.id);

    // Announce node selection to screen readers
    announce(`Selected node: ${node.title}. Type: ${node.type}.${node.data?.relationshipType ? ` Relationship: ${node.data.relationshipType}.` : ''}`, true);

    // Find and highlight path from root to this node
    if (graphData && graphData.metadata?.rootId) {
      const rootId = graphData.metadata.rootId;
      // Don't try to find path to self
      if (rootId !== node.id) {
        const pathLinks = findPath(graphData, rootId, node.id);
        if (pathLinks) {
          // Animate path highlighting
          setTimeout(() => {
            highlightPath(pathLinks);

            // Get path description for announcement
            const pathDescription = findRelationshipPath(
              graphData,
              rootId,
              node.id
            ).description;

            // Announce path to screen readers
            if (pathDescription) {
              announce(`Path found: ${pathDescription}`, false);
            }
          }, 100); // Small delay for better visual effect
        }
      }
    }

    if (graphRef.current) {
      // Enhanced animation using d3-ease
      const targetZoom = zoomLevel * 1.2;

      // Start with a quick zoom out for dramatic effect
      graphRef.current.zoom(zoomLevel * 0.9, ANIMATION_DURATION / 3, easeCubicInOut);

      // Then zoom in more significantly to focus on the node
      setTimeout(() => {
        graphRef.current.centerAt(
          node.x || 0,
          node.y || 0,
          ANIMATION_DURATION,
          easeCubicInOut
        );
        graphRef.current.zoom(targetZoom, ANIMATION_DURATION, easeCubicInOut);
      }, ANIMATION_DURATION / 3);

      // Add slight camera shake for visual emphasis (for non-mobile only)
      if (!isMobile && graphRef.current.cameraPosition) {
        const originalPosition = { ...graphRef.current.cameraPosition() };

        // Small camera shake sequence
        const shakeSequence = [
          { x: 1, y: 1 },
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: 0, y: 0 }
        ];

        shakeSequence.forEach((offset, index) => {
          setTimeout(() => {
            if (graphRef.current && graphRef.current.cameraPosition) {
              graphRef.current.cameraPosition({
                x: originalPosition.x + offset.x * 5,
                y: originalPosition.y + offset.y * 5
              }, 50);
            }
          }, ANIMATION_DURATION / 2 + index * 50);
        });
      }
    }

    // Provide haptic feedback on mobile devices
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Call external handler if provided
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [zoomLevel, onNodeClick, setSelectedNode, highlightNode, highlightPath, graphData, selectedNode, isMobile]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);

    // Only change cursor on non-touch devices
    if (!isMobile) {
      document.body.style.cursor = node ? 'pointer' : 'default';
    }

    // Announce hover to screen readers (if not in active touch mode)
    if (node && !touchState.active) {
      announce(`Hovering over: ${node.title}. Type: ${node.type}.`, false);
    }
  }, [isMobile, announce, touchState.active]);
  
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
  
  // Customize node appearance with enhanced visual effects
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = node.id === viewPreferences.highlightedNode;
    const isHovered = hoveredNode && node.id === hoveredNode.id;
    const isSelected = selectedNode === node.id;
    const isRoot = node.type === NodeType.ROOT;

    // Get opacity (for fading background nodes when path is highlighted)
    const opacity = node.opacity !== undefined ? node.opacity : 1;

    // Determine node size based on view preferences
    let size = viewPreferences.nodeSize / 2 || DEFAULT_NODE_SIZE;

    // Increase node size on mobile for better touch targets
    if (isMobile) {
      size = Math.max(size, DEFAULT_NODE_SIZE * 1.5);
    }

    if (isRoot) size *= ROOT_NODE_SIZE_MULTIPLIER;

    // Add animations for highlighted/selected nodes
    if (isHighlighted || isHovered || isSelected) {
      size = NODE_HIGHLIGHT_SIZE;

      // Add subtle pulse animation for selected nodes
      if (isSelected || isHighlighted) {
        const time = Date.now() % 2000 / 2000; // 0-1 value cycling every 2 seconds
        // Sine wave for smooth pulsing (1.0 - 1.2 range)
        const pulse = 1.0 + 0.2 * Math.sin(time * Math.PI * 2);
        size *= pulse;
      }
    }

    // Get node color from utility function
    const color = getNodeColor(node, isHighlighted || isHovered || isSelected);

    // Save context state
    ctx.save();

    // Apply any opacity settings
    ctx.globalAlpha = opacity;

    // Draw glow effect for highlighted/selected nodes
    if (isHighlighted || isSelected) {
      // Outer glow
      const glowSize = size * 1.4;
      const gradient = ctx.createRadialGradient(
        0, 0, size * 0.8,
        0, 0, glowSize
      );

      // Create a glowing halo around the node
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = isSelected ? 0.7 : 0.5;
      ctx.fill();
      ctx.globalAlpha = opacity; // Reset opacity

      // Add animated ring for selected nodes
      if (isSelected) {
        ctx.beginPath();

        // Use time for animation
        const ringTime = Date.now() / 1000;
        const ringScale = 1 + 0.15 * Math.sin(ringTime * 3);

        ctx.arc(0, 0, size * ringScale, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(ringTime * 3);
        ctx.stroke();
        ctx.globalAlpha = opacity; // Reset opacity
      }
    }

    // Draw main circle with gradient for enhanced depth
    if (isHighlighted || isSelected || isRoot) {
      // Create a gradient for depth effect
      const gradient = ctx.createRadialGradient(
        -size/3, -size/3, 0,
        0, 0, size
      );

      // Parse color for gradient
      let r = 0, g = 0, b = 0;

      if (color.startsWith('#')) {
        if (color.length === 4) {
          r = parseInt(color[1] + color[1], 16);
          g = parseInt(color[2] + color[2], 16);
          b = parseInt(color[3] + color[3], 16);
        } else {
          r = parseInt(color.slice(1, 3), 16);
          g = parseInt(color.slice(3, 5), 16);
          b = parseInt(color.slice(5, 7), 16);
        }
      }

      // Create lighter and darker versions for gradient
      const lighter = `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;
      const darker = `rgb(${Math.max(r - 30, 0)}, ${Math.max(g - 30, 0)}, ${Math.max(b - 30, 0)})`;

      gradient.addColorStop(0, lighter);
      gradient.addColorStop(1, darker);

      // Draw main circle with gradient
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
    } else {
      // Simple circle for normal nodes
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw enhanced border with shadow effect
    if (isHighlighted || isHovered || isSelected) {
      // Add shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Thicker border for selected/highlighted
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, 2 * Math.PI);
      ctx.strokeStyle = viewPreferences.darkMode ? '#FFFFFF' : '#000000';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Add secondary highlight ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, size + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = viewPreferences.darkMode
          ? 'rgba(255, 255, 255, 0.4)'
          : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // Simple border for normal nodes
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw label based on view preferences with improved styling
    const labelSettings = viewPreferences.labels;
    if (isHighlighted || isHovered || isSelected || filters.showLabels || isRoot) {
      const label = getNodeLabel(
        node,
        labelSettings?.maxLength || 20
      );

      // Increase font size for highlighted nodes
      const fontSize = (labelSettings?.fontSize || LABEL_FONT_SIZE) *
                      (isHighlighted || isSelected ? 1.2 : 1);

      ctx.font = `${isSelected ? 'bold' : ''} ${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Draw enhanced label background with rounded corners
      const textWidth = ctx.measureText(label).width;
      const padding = labelSettings?.padding || 4;
      const bgColor = viewPreferences.darkMode
        ? 'rgba(15, 23, 42, 0.85)'
        : 'rgba(255, 255, 255, 0.85)';

      const cornerRadius = 4;
      const bgX = -textWidth / 2 - padding;
      const bgY = size + padding;
      const bgWidth = textWidth + (padding * 2);
      const bgHeight = fontSize + (padding * 2);

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(bgX + cornerRadius, bgY);
      ctx.lineTo(bgX + bgWidth - cornerRadius, bgY);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius);
      ctx.lineTo(bgX + bgWidth, bgY + bgHeight - cornerRadius);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - cornerRadius, bgY + bgHeight);
      ctx.lineTo(bgX + cornerRadius, bgY + bgHeight);
      ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius);
      ctx.lineTo(bgX, bgY + cornerRadius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
      ctx.closePath();

      // Fill and add subtle border for depth
      ctx.fillStyle = bgColor;
      ctx.fill();

      if (isHighlighted || isSelected) {
        ctx.strokeStyle = viewPreferences.darkMode
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Add text shadow for better readability
        ctx.shadowColor = viewPreferences.darkMode
          ? 'rgba(0, 0, 0, 0.7)'
          : 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
      }

      // Draw label text with enhanced styling
      const textColor = viewPreferences.darkMode
        ? labelSettings?.fontColor || DARK_TEXT_COLOR
        : labelSettings?.fontColor || TEXT_COLOR;

      ctx.fillStyle = textColor;
      ctx.fillText(label, 0, size + padding + fontSize/3);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Add relationship type badge for derivative nodes
      if (node.type === NodeType.DERIVATIVE && node.data?.relationshipType &&
          (isHovered || isSelected || isHighlighted)) {
        // Format relationship type for display
        const relType = node.data.relationshipType.toString();
        const subLabel = relType.charAt(0).toUpperCase() + relType.slice(1);
        const subSize = fontSize * 0.75;

        // Draw relationship badge with rounded corners
        const subWidth = ctx.measureText(subLabel).width;
        const subPadding = 4;
        const subX = -subWidth / 2 - subPadding;
        const subY = bgY + bgHeight + padding;
        const subHeight = subSize + (subPadding * 1.5);

        // Rounded rectangle for badge
        ctx.beginPath();
        ctx.moveTo(subX + cornerRadius, subY);
        ctx.lineTo(subX + subWidth + (subPadding * 2) - cornerRadius, subY);
        ctx.quadraticCurveTo(subX + subWidth + (subPadding * 2), subY, subX + subWidth + (subPadding * 2), subY + cornerRadius);
        ctx.lineTo(subX + subWidth + (subPadding * 2), subY + subHeight - cornerRadius);
        ctx.quadraticCurveTo(subX + subWidth + (subPadding * 2), subY + subHeight, subX + subWidth + (subPadding * 2) - cornerRadius, subY + subHeight);
        ctx.lineTo(subX + cornerRadius, subY + subHeight);
        ctx.quadraticCurveTo(subX, subY + subHeight, subX, subY + subHeight - cornerRadius);
        ctx.lineTo(subX, subY + cornerRadius);
        ctx.quadraticCurveTo(subX, subY, subX + cornerRadius, subY);
        ctx.closePath();

        // Fill badge with relationship-specific color
        let badgeColor;
        switch(relType.toLowerCase()) {
          case 'remix': badgeColor = '#3b82f6'; break; // Blue
          case 'adaptation': badgeColor = '#10b981'; break; // Green
          case 'translation': badgeColor = '#f59e0b'; break; // Amber
          case 'sequel': badgeColor = '#8b5cf6'; break; // Purple
          case 'prequel': badgeColor = '#6366f1'; break; // Indigo
          default: badgeColor = '#6b7280'; // Gray
        }

        ctx.fillStyle = badgeColor;
        ctx.fill();

        // Draw badge text
        ctx.font = `bold ${subSize}px Sans-Serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(subLabel, 0, subY + subPadding + 1);
      }
    }

    // Special effects for root node
    if (isRoot) {
      // Add subtle pulsing effect to highlight importance
      const time = Date.now() / 1000;
      const pulseSize = size * (1 + 0.05 * Math.sin(time * 2));

      // Draw outer ring
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = viewPreferences.darkMode
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Add "ROOT" indicator if not hovered/selected
      if (!isHovered && !isSelected && !isMobile) {
        const rootFontSize = LABEL_FONT_SIZE * 0.8;
        ctx.font = `bold ${rootFontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = viewPreferences.darkMode ? '#FFFFFF' : '#000000';
        ctx.globalAlpha = 0.7;

        // Add small badge above
        ctx.fillText('ROOT', 0, -size - rootFontSize/2);
        ctx.globalAlpha = 1;
      }
    }

    // If the node has an image, indicate it with an enhanced icon
    if (node.image && (isHighlighted || isHovered || isSelected || isRoot) && size > 8) {
      // Add a small image indicator icon
      const iconSize = size * 0.4;

      // Draw icon background
      ctx.beginPath();
      ctx.arc(size/2, -size/2, iconSize, 0, 2 * Math.PI);
      ctx.fillStyle = viewPreferences.darkMode ? '#1e293b' : '#ffffff';
      ctx.fill();

      // Add subtle shadow and border
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      ctx.strokeStyle = viewPreferences.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw image icon (simple representation)
      ctx.beginPath();
      const iconInset = iconSize * 0.3;
      ctx.rect(size/2 - iconInset, -size/2 - iconInset, iconInset * 2, iconInset * 2);
      ctx.fillStyle = viewPreferences.darkMode ? '#60a5fa' : '#3b82f6';
      ctx.fill();
    }

    // Restore context state
    ctx.restore();
    }
  }, [hoveredNode, selectedNode, viewPreferences, filters.showLabels, isMobile]);
  
  // Customize link appearance with enhanced animated highlights
  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D) => {
    // Check if this link is part of highlighted path
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

    // Get opacity (for fading background links when path is highlighted)
    const opacity = link.opacity !== undefined ? link.opacity : 1;

    // Calculate the final line width
    let lineWidth = viewPreferences.linkWidth || LINK_WIDTH;

    // Increase width for highlighted links
    if (isHighlighted || isConnectedToHighlight) {
      lineWidth = LINK_HIGHLIGHT_WIDTH;

      // Pulse effect for highlighted links
      if (isHighlighted) {
        // Use timestamp for animation
        const time = Date.now() % 2000 / 2000; // 0-1 value cycling every 2 seconds
        // Sine wave for smooth pulsing (1.0 - 1.5 range)
        const pulse = 1.0 + 0.5 * Math.sin(time * Math.PI * 2);
        lineWidth *= pulse;
      }
    }

    // Set final line width
    ctx.lineWidth = lineWidth;

    // Get base color
    const baseColor = getLinkColor(link, isHighlighted || isConnectedToHighlight);

    // Apply opacity to color
    if (opacity < 1) {
      // Parse color and add alpha
      let r = 0, g = 0, b = 0;

      if (baseColor.startsWith('#')) {
        // Parse hex color
        if (baseColor.length === 4) {
          // #RGB format
          r = parseInt(baseColor[1] + baseColor[1], 16);
          g = parseInt(baseColor[2] + baseColor[2], 16);
          b = parseInt(baseColor[3] + baseColor[3], 16);
        } else {
          // #RRGGBB format
          r = parseInt(baseColor.slice(1, 3), 16);
          g = parseInt(baseColor.slice(3, 5), 16);
          b = parseInt(baseColor.slice(5, 7), 16);
        }
      } else if (baseColor.startsWith('rgb')) {
        // Parse rgb/rgba color
        const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
        if (match) {
          r = parseInt(match[1]);
          g = parseInt(match[2]);
          b = parseInt(match[3]);
        }
      }

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      ctx.strokeStyle = baseColor;
    }

    // Add dash effect for certain link types or highlighted paths
    if (isHighlighted) {
      // Create animated dashed line for highlighted path
      const dashLength = 5;
      const dashGap = 3;

      // Use time to animate the dash
      const time = Date.now() / 1000; // seconds
      const speed = 10; // dash speed
      const offset = (time * speed) % (dashLength + dashGap);

      ctx.setLineDash([dashLength, dashGap]);
      ctx.lineDashOffset = -offset; // Negative for animation direction

      // Add glow effect for highlighted path
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 5;
    } else if (link.type === 'related') {
      // Static dash for related links
      ctx.setLineDash([2, 2]);
      ctx.shadowBlur = 0;
    } else {
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
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

          // Add subtle shadow for depth
          if (isHighlighted) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          ctx.fill();

          // Reset shadow
          ctx.shadowBlur = 0;
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
      announce(`Zoomed in. Current zoom level: ${Math.round(newZoom * 100)}%`, false);
    }
  }, [zoomLevel, setZoomLevel, announce]);

  // Zoom out handler
  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const newZoom = zoomLevel / 1.2;
      setZoomLevel(newZoom);
      graphRef.current.zoom(newZoom, ANIMATION_DURATION);
      announce(`Zoomed out. Current zoom level: ${Math.round(newZoom * 100)}%`, false);
    }
  }, [zoomLevel, setZoomLevel, announce]);

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

        announce(`View reset. Centered on root node: ${rootNode.title}`, true);
      }
    }
  }, [graphData, setZoomLevel, setSelectedNode, highlightNode, highlightPath, announce]);

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
        {/* Accessibility announcer for dynamic updates */}
        <AccessibilityAnnouncer
          message={announcement}
          assertive={isAssertive}
        />

        {/* Graph visualization */}
        <div
          role="application"
          aria-label="Derivative Galaxy Graph"
          aria-description="A force-directed graph showing ancestor-derivative relationships. Use Tab to enter keyboard navigation mode."
        >
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
              aria-busy={isLoading ? 'true' : 'false'}
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
        </div> {/* End of role="application" div */}

        {/* Graph Legend - Responsive */}
        {showLegend && (
          <GraphLegend
            position={isMobile ? 'bottom-left' : legendPosition}
            compact={dimensions.width < 640 || dimensions.height < 500 || isMobile}
          />
        )}

        {/* Basic zoom controls (always visible) - Larger on mobile */}
        <div
          className={`graph-controls ${isMobile ? 'mobile' : ''}`}
          role="toolbar"
          aria-label="Graph zoom controls"
        >
          <button
            className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
            onClick={handleZoomIn}
            aria-label="Zoom in"
            aria-keyshortcuts="+"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
            onClick={handleZoomOut}
            aria-label="Zoom out"
            aria-keyshortcuts="-"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className={`graph-controls-button ${viewPreferences.darkMode ? 'dark' : ''}`}
            onClick={handleReset}
            aria-label="Reset view"
            aria-keyshortcuts="r"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 4V8H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 8L7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Enhanced Node tooltip (shown when hovering) with better positioning */}
        {hoveredNode && (
          <GraphTooltip
            node={hoveredNode}
            position={{
              x: (hoveredNode.x || 0) + dimensions.width / 2,
              y: (hoveredNode.y || 0) + dimensions.height / 2
            }}
            isDarkMode={viewPreferences.darkMode}
            isMobile={isMobile}
            viewportDimensions={dimensions}
            onShowDetails={(nodeId) => {
              setSelectedNode(nodeId);
              highlightNode(nodeId);

              // Find the relationship path between the root and this node
              if (graphData) {
                const rootId = graphData.metadata?.rootId || ipId;
                const pathLinks = findPath(graphData, rootId, nodeId);
                if (pathLinks) {
                  highlightPath(pathLinks);
                }
              }
            }}
          />
        )}

        {/* Path highlight overlay */}
        {selectedNode && viewPreferences.highlightedPath && (
          <PathHighlight
            path={viewPreferences.highlightedPath}
            sourceNode={graphData?.nodes.find(n => n.id === (graphData?.metadata?.rootId || ipId)) || null}
            targetNode={graphData?.nodes.find(n => n.id === selectedNode) || null}
            intermediateNodes={
              findRelationshipPath(
                graphData || { nodes: [], links: [] },
                graphData?.metadata?.rootId || ipId,
                selectedNode
              ).intermediateNodes
            }
            description={
              findRelationshipPath(
                graphData || { nodes: [], links: [] },
                graphData?.metadata?.rootId || ipId,
                selectedNode
              ).description
            }
            onClose={() => {
              highlightPath(null);
              highlightNode(null);
              setSelectedNode(null);
            }}
            isDarkMode={viewPreferences.darkMode}
          />
        )}
        
        {/* Mobile hint overlay for first-time users */}
        {isMobile && (
          <div
            className="mobile-hint-overlay"
            role="tooltip"
            aria-live="polite"
          >
            <div className="hint-container">
              <p>Tap to select • Double-tap to zoom • Pinch to zoom • Press and hold for details</p>
            </div>
          </div>
        )}

        {/* Text-based representation for screen readers */}
        {showDescription && graphData && (
          <GraphDescription
            graphData={graphData}
            selectedNode={selectedNode}
            isDarkMode={viewPreferences.darkMode}
            className="sr-only sr-only-focusable"
          />
        )}

        {/* Keyboard navigation controls and focus indicator */}
        {!isMobile && (
          <>
            {/* Visual indicator for currently focused node */}
            {isFocusMode && focusedNodeIndex >= 0 && graphData && graphData.nodes && (
              <div
                className="keyboard-focus-outline"
                style={{
                  left: ((graphData.nodes[focusedNodeIndex]?.x || 0) + dimensions.width / 2) - 15,
                  top: ((graphData.nodes[focusedNodeIndex]?.y || 0) + dimensions.height / 2) - 15,
                  width: 30,
                  height: 30
                }}
                aria-hidden="true"
              />
            )}

            {/* Keyboard navigation controls panel */}
            <KeyboardControls
              visible={isFocusMode}
              onEscape={() => setIsFocusMode(false)}
              onNodeSelect={(node) => handleNodeClick(node)}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              focusedNode={
                isFocusMode && focusedNodeIndex >= 0 && graphData?.nodes
                  ? graphData.nodes.filter(n => filters.nodeTypes.includes(n.type))[focusedNodeIndex] || null
                  : null
              }
              nodes={graphData?.nodes.filter(n => filters.nodeTypes.includes(n.type)) || []}
              focusedNodeIndex={focusedNodeIndex}
              isDarkMode={viewPreferences.darkMode}
            />
          </>
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