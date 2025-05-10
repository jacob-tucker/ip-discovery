"use client";

import React from 'react';
import { GraphNode, NodeType, RelationshipType } from '@/types/graph';

interface GraphTooltipProps {
  node: GraphNode;
  position: { x: number; y: number };
  isDarkMode: boolean;
  isMobile: boolean;
  viewportDimensions: { width: number; height: number };
  onClose?: () => void;
  onShowDetails?: (nodeId: string) => void;
}

/**
 * Enhanced tooltip component for displaying detailed node information
 * 
 * Shows IP asset information with improved styling and additional metadata
 */
export default function GraphTooltip({
  node,
  position,
  isDarkMode,
  isMobile,
  viewportDimensions,
  onClose,
  onShowDetails
}: GraphTooltipProps) {
  // Calculate tooltip position to ensure it stays within viewport
  const calculatePosition = () => {
    const tooltipWidth = isMobile ? 180 : 280;
    const tooltipHeight = isMobile ? 120 : 180;
    const padding = 20;
    
    // Start with default position (right of node)
    let left = position.x + padding;
    let top = position.y - tooltipHeight / 2;
    
    // Adjust if off-screen right
    if (left + tooltipWidth > viewportDimensions.width) {
      left = position.x - tooltipWidth - padding;
    }
    
    // Adjust if off-screen left
    if (left < 0) {
      left = Math.min(padding, viewportDimensions.width - tooltipWidth - padding);
      top = position.y + padding; // Move below node if can't fit on sides
    }
    
    // Adjust if off-screen top
    if (top < 0) {
      top = padding;
    }
    
    // Adjust if off-screen bottom
    if (top + tooltipHeight > viewportDimensions.height) {
      top = viewportDimensions.height - tooltipHeight - padding;
    }
    
    return { left, top };
  };
  
  // Format node type for display
  const formatNodeType = (type: NodeType): string => {
    switch (type) {
      case NodeType.ROOT:
        return 'Root IP';
      case NodeType.ANCESTOR:
        return 'Source IP';
      case NodeType.DERIVATIVE:
        return 'Derivative IP';
      case NodeType.SIBLING:
        return 'Related IP (Sibling)';
      case NodeType.RELATED:
        return 'Related IP';
      case NodeType.DISPUTED:
        return 'Disputed IP';
      case NodeType.COLLABORATOR:
        return 'Collaborator IP';
      default:
        return type;
    }
  };
  
  // Format relationship type for display
  const formatRelationshipType = (type?: RelationshipType | string): string => {
    if (!type) return '';
    
    // Return capitalized version
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const pos = calculatePosition();
  const relationshipType = node.data?.relationshipType;
  
  return (
    <div 
      className={`graph-tooltip ${isDarkMode ? 'dark' : ''} ${isMobile ? 'mobile' : ''}`}
      style={{
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        zIndex: 1000,
        width: isMobile ? '180px' : '280px',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      {/* Header with title and close button */}
      <div className="tooltip-header">
        <h3 className="tooltip-title" title={node.title}>
          {node.title?.length > 25 
            ? node.title.substring(0, 22) + '...' 
            : node.title}
        </h3>
        {onClose && (
          <button 
            className="tooltip-close"
            onClick={onClose}
            aria-label="Close tooltip"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Type badge */}
      <div className="tooltip-type-badge" style={{ 
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)' 
      }}>
        {formatNodeType(node.type)}
      </div>
      
      {/* Description if available */}
      {node.description && !isMobile && (
        <div className="tooltip-description">
          {node.description.length > 80 
            ? node.description.substring(0, 77) + '...' 
            : node.description}
        </div>
      )}
      
      {/* Relationship type if available */}
      {relationshipType && (
        <div className="tooltip-relationship">
          {formatRelationshipType(relationshipType)}
        </div>
      )}
      
      {/* Creation date and additional metadata */}
      {!isMobile && (
        <div className="tooltip-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(node.createdAt)}</span>
          </div>
          
          {node.data?.distance && node.data.distance > 0 && (
            <div className="metadata-item">
              <span className="metadata-label">Distance:</span>
              <span className="metadata-value">{node.data.distance} hop{node.data.distance > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Details button */}
      {onShowDetails && !isMobile && (
        <button 
          className="tooltip-details-button"
          onClick={() => onShowDetails(node.id)}
          aria-label="View full details"
        >
          View Details
        </button>
      )}
    </div>
  );
}

// Add CSS keyframe for fade-in animation
const fadeInStyle = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// Add style tag to document if it doesn't exist already
if (typeof window !== 'undefined' && !document.getElementById('graph-tooltip-styles')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'graph-tooltip-styles';
  styleTag.innerHTML = fadeInStyle;
  document.head.appendChild(styleTag);
}