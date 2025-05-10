"use client";

import React from 'react';
import { GraphData, GraphNode, NodeType } from '@/types/graph';

interface GraphDescriptionProps {
  graphData: GraphData | null;
  selectedNode: string | null;
  className?: string;
  isDarkMode?: boolean;
}

/**
 * GraphDescription Component
 * 
 * Provides a text-based, screen reader friendly description of the graph.
 * Offers an alternative representation of the visual graph for accessibility.
 */
export default function GraphDescription({
  graphData,
  selectedNode,
  className = '',
  isDarkMode = false
}: GraphDescriptionProps) {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className={`graph-description ${className} ${isDarkMode ? 'dark' : ''}`}>
        <h2 id="graph-description-heading">IP Relationship Graph Description</h2>
        <p>No relationship data is available for this IP asset.</p>
      </div>
    );
  }
  
  // Find root node
  const rootNode = graphData.nodes.find(node => node.type === NodeType.ROOT);
  
  // Find currently selected node
  const currentNode = selectedNode 
    ? graphData.nodes.find(node => node.id === selectedNode) 
    : null;
  
  // Count nodes by type
  const nodeCounts = graphData.nodes.reduce((counts, node) => {
    counts[node.type] = (counts[node.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Determine key relationships
  const directDerivatives = rootNode 
    ? graphData.links
        .filter(link => 
          (typeof link.source === 'object' ? link.source.id : link.source) === rootNode.id)
        .map(link => {
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return graphData.nodes.find(node => node.id === targetId);
        })
        .filter(Boolean) as GraphNode[]
    : [];
  
  // Find path between root and selected node
  const findPath = (startId: string, endId: string) => {
    if (!graphData || startId === endId) return null;
    
    const visited = new Set<string>();
    const queue: Array<{ id: string, path: string[] }> = [{ id: startId, path: [startId] }];
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (id === endId) return path;
      
      if (visited.has(id)) continue;
      visited.add(id);
      
      // Find all links from this node
      const links = graphData.links.filter(link => {
        const source = typeof link.source === 'object' ? link.source.id : link.source;
        return source === id;
      });
      
      for (const link of links) {
        const nextId = typeof link.target === 'object' ? link.target.id : link.target;
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }
    
    return null;
  };
  
  // Create path description if there's a selected node
  let pathDescription = '';
  if (rootNode && currentNode && rootNode.id !== currentNode.id) {
    const path = findPath(rootNode.id, currentNode.id);
    if (path) {
      const nodeNames = path.map(id => {
        const node = graphData.nodes.find(n => n.id === id);
        return node ? node.title : id;
      });
      
      pathDescription = `Path from ${nodeNames[0]} to ${nodeNames[nodeNames.length - 1]}: ${nodeNames.join(' → ')}`;
    }
  }
  
  return (
    <div 
      className={`graph-description ${className} ${isDarkMode ? 'dark' : ''}`}
      tabIndex={0}
      aria-labelledby="graph-description-heading"
    >
      <h2 id="graph-description-heading" className="sr-only">IP Relationship Graph Description</h2>
      
      <div>
        <h3>Graph Overview</h3>
        <p>
          This graph displays relationships between IP assets, with {graphData.nodes.length} total nodes 
          and {graphData.links.length} connections.
          {rootNode ? ` The primary IP asset is "${rootNode.title}"` : ''}
        </p>
        
        <h3>Node Types</h3>
        <ul>
          {Object.entries(nodeCounts).map(([type, count]) => (
            <li key={type}>
              {type}: {count} node{count !== 1 ? 's' : ''}
            </li>
          ))}
        </ul>
        
        {rootNode && directDerivatives.length > 0 && (
          <>
            <h3>Direct Derivatives</h3>
            <p>
              {rootNode.title} has {directDerivatives.length} direct derivative{directDerivatives.length !== 1 ? 's' : ''}:
            </p>
            <ul>
              {directDerivatives.map(node => (
                <li key={node.id}>
                  {node.title} ({node.type})
                  {node.data?.relationshipType ? ` - ${node.data.relationshipType}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {currentNode && currentNode.id !== rootNode?.id && (
          <>
            <h3>Selected Node</h3>
            <p>
              Currently selected: {currentNode.title} ({currentNode.type})
              {currentNode.data?.relationshipType 
                ? ` - ${currentNode.data.relationshipType} of original` 
                : ''}
            </p>
            {pathDescription && (
              <p>
                {pathDescription}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}