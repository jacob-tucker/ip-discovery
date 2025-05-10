'use client';

import React from 'react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  nodeCount?: number;
  className?: string;
  showText?: boolean;
  text?: string;
}

/**
 * Skeleton loader component that displays a placeholder animation
 * while the graph data is being loaded
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 400,
  nodeCount = 10,
  className = '',
  showText = true,
  text = 'Loading Derivative Galaxy...'
}) => {
  const { viewPreferences } = useGraphFilters();
  const isDarkMode = viewPreferences?.darkMode || false;
  
  // Calculate container dimensions
  const containerWidth = typeof width === 'number' ? `${width}px` : width;
  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  
  // Generate random positions for skeleton nodes
  const nodes = React.useMemo(() => {
    const centerX = 50;
    const centerY = 50;
    const result = [];
    
    // Add central node
    result.push({
      id: 'center',
      x: centerX,
      y: centerY,
      size: 12
    });
    
    // Add surrounding nodes at different distances
    for (let i = 0; i < nodeCount - 1; i++) {
      const angle = (i / (nodeCount - 1)) * Math.PI * 2;
      const distance = 20 + Math.random() * 20;
      const nodeSize = 5 + Math.random() * 5;
      
      result.push({
        id: `node-${i}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: nodeSize
      });
    }
    
    return result;
  }, [nodeCount]);
  
  // Generate lines between nodes
  const lines = React.useMemo(() => {
    const result = [];
    
    // Connect center node to each surrounding node
    for (let i = 1; i < nodes.length; i++) {
      result.push({
        id: `line-${i}`,
        x1: nodes[0].x,
        y1: nodes[0].y,
        x2: nodes[i].x,
        y2: nodes[i].y
      });
      
      // Add some connections between surrounding nodes (not all)
      if (i > 1 && i % 2 === 0 && i < nodes.length - 1) {
        result.push({
          id: `line-extra-${i}`,
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[i + 1].x,
          y2: nodes[i + 1].y
        });
      }
    }
    
    return result;
  }, [nodes]);

  return (
    <div 
      className={`skeleton-loader relative overflow-hidden rounded-lg ${className}`}
      style={{ 
        width: containerWidth, 
        height: containerHeight,
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(241, 245, 249, 0.7)'
      }}
      aria-busy="true"
      aria-label="Loading graph data"
    >
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#ffffff33' : '#00000022'} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Pulsing "graph" visual */}
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Lines between nodes */}
        {lines.map(line => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
            strokeWidth="1"
            strokeDasharray="4 2"
            className="animate-pulse"
          />
        ))}
        
        {/* Nodes */}
        {nodes.map((node, index) => (
          <circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.size}
            fill={index === 0 
              ? (isDarkMode ? 'rgba(255, 99, 71, 0.6)' : 'rgba(255, 99, 71, 0.8)') 
              : (isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)')
            }
            className={`animate-pulse`}
            style={{
              animationDelay: `${index * 120}ms`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </svg>
      
      {/* Loading spinner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin mb-2" />
        
        {showText && (
          <div 
            className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-600'} animate-pulse`}
          >
            {text}
          </div>
        )}
      </div>
      
      {/* Controls skeleton */}
      <div className="absolute top-4 right-4 h-8 w-24 rounded bg-gray-300 dark:bg-gray-700 animate-pulse opacity-70" />
      
      {/* Legend skeleton */}
      <div className="absolute bottom-4 left-4 h-20 w-32 rounded bg-gray-300 dark:bg-gray-700 animate-pulse opacity-70" />
    </div>
  );
};

/**
 * Skeleton loader specifically for the graph controls panel
 */
export const SkeletonControls: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { viewPreferences } = useGraphFilters();
  const isDarkMode = viewPreferences?.darkMode || false;
  
  return (
    <div 
      className={`rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-3 ${className}`}
      aria-busy="true"
      aria-label="Loading controls"
    >
      {/* Control panel header skeleton */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      
      {/* Search box skeleton */}
      <div className="h-8 w-full bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse" />
      
      {/* Filter sections */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center">
                  <div className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-700 animate-pulse mr-2" />
                  <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;