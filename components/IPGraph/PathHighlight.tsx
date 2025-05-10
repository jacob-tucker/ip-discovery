"use client";

import React, { useState, useEffect } from 'react';
import { GraphLink, GraphNode, RelationshipType } from '@/types/graph';

interface PathHighlightProps {
  path: GraphLink[] | null;
  sourceNode: GraphNode | null;
  targetNode: GraphNode | null;
  intermediateNodes: GraphNode[];
  description: string;
  onClose: () => void;
  isDarkMode: boolean;
}

/**
 * Component to display highlighted path information
 * 
 * Shows a visual overlay with details about the relationship path between nodes
 */
export default function PathHighlight({
  path,
  sourceNode,
  targetNode,
  intermediateNodes,
  description,
  onClose,
  isDarkMode
}: PathHighlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation on mount
  useEffect(() => {
    // Small delay to trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle close with exit animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation to complete
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  // Format relationship type for display
  const formatRelationshipType = (type?: RelationshipType | string): string => {
    if (!type) return 'Unknown';
    
    // Return capitalized version
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  if (!sourceNode || !targetNode) {
    return null;
  }
  
  return (
    <div 
      className={`path-highlight-overlay ${isDarkMode ? 'dark' : ''} ${isVisible ? 'visible' : ''}`}
      onClick={handleClose}
    >
      <div 
        className="path-highlight-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="path-header">
          <h3>Relationship Path</h3>
          <button 
            className="close-button"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="path-summary">
          <div className="path-endpoint">
            <div 
              className="endpoint-indicator"
              style={{ backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }}
            ></div>
            <div className="endpoint-details">
              <p className="endpoint-title">{sourceNode.title}</p>
              <p className="endpoint-type">{sourceNode.type}</p>
            </div>
          </div>
          
          <div className="path-connection">
            {path && path.length > 0 ? (
              <div className="connection-line">
                <div className="connection-arrow"></div>
                {path.length === 1 && path[0].data?.relationshipType && (
                  <div className="connection-label">
                    {formatRelationshipType(path[0].data.relationshipType)}
                  </div>
                )}
              </div>
            ) : (
              <div className="connection-none">No connection</div>
            )}
          </div>
          
          <div className="path-endpoint">
            <div 
              className="endpoint-indicator"
              style={{ backgroundColor: isDarkMode ? '#34d399' : '#10b981' }}
            ></div>
            <div className="endpoint-details">
              <p className="endpoint-title">{targetNode.title}</p>
              <p className="endpoint-type">{targetNode.type}</p>
            </div>
          </div>
        </div>
        
        <div className="path-description">
          <p>{description}</p>
        </div>
        
        {intermediateNodes.length > 0 && (
          <div className="intermediate-nodes">
            <h4>Intermediary IP Assets</h4>
            <ul>
              {intermediateNodes.map((node) => (
                <li key={node.id} className="intermediate-node">
                  <div 
                    className="node-indicator"
                    style={{ backgroundColor: isDarkMode ? '#f87171' : '#ef4444' }}
                  ></div>
                  <span>{node.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="path-message">
          <p>The highlighted path shows how these IP assets are connected in the graph.</p>
        </div>
      </div>
    </div>
  );
}