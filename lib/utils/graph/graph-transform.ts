/**
 * Utility functions for transforming API data to graph format
 */

import { 
  GraphData, 
  GraphNode, 
  GraphLink, 
  NodeType, 
  LinkType,
  DerivativeRelationsResponse 
} from '@/types/graph';

/**
 * Transforms derivative relations API response to graph data format
 * @param data - Derivative relations data from API
 * @returns Formatted graph data for visualization
 */
export function transformToGraphData(data: DerivativeRelationsResponse): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  // Add root node
  const rootNode: GraphNode = {
    id: data.root.ipId,
    title: data.root.title,
    image: data.root.image,
    type: NodeType.ROOT,
    data: data.root.metadata || {}
  };
  
  nodes.push(rootNode);
  
  // Process ancestors
  data.ancestors.forEach(ancestor => {
    // Add ancestor node
    nodes.push({
      id: ancestor.ipId,
      title: ancestor.title,
      image: ancestor.image,
      type: NodeType.ANCESTOR,
      data: ancestor.metadata || {}
    });
    
    // Add link from ancestor to root
    links.push({
      source: ancestor.ipId,
      target: data.root.ipId,
      type: LinkType.DERIVES_FROM,
      data: { relationshipType: ancestor.relationshipType }
    });
  });
  
  // Process derivatives
  data.derivatives.forEach(derivative => {
    // Add derivative node
    nodes.push({
      id: derivative.ipId,
      title: derivative.title,
      image: derivative.image,
      type: NodeType.DERIVATIVE,
      data: derivative.metadata || {}
    });
    
    // Add link from root to derivative
    links.push({
      source: data.root.ipId,
      target: derivative.ipId,
      type: LinkType.DERIVED_BY,
      data: { relationshipType: derivative.relationshipType }
    });
  });
  
  // Process related IPs
  data.related.forEach(related => {
    // Add related node
    nodes.push({
      id: related.ipId,
      title: related.title,
      image: related.image,
      type: NodeType.RELATED,
      data: related.metadata || {}
    });
    
    // Add link between root and related
    links.push({
      source: data.root.ipId,
      target: related.ipId,
      type: LinkType.RELATED,
      data: { relationshipType: related.relationshipType }
    });
  });
  
  return { nodes, links };
}

/**
 * Applies filters to graph data
 * @param graphData - The original graph data
 * @param nodeTypes - Array of node types to include
 * @param linkTypes - Array of link types to include
 * @param searchQuery - Optional search term to filter by title
 * @param maxDistance - Maximum hop distance from root node
 * @returns Filtered graph data
 */
export function applyFilters(
  graphData: GraphData,
  nodeTypes: NodeType[],
  linkTypes: LinkType[],
  searchQuery: string = '',
  maxDistance: number = 2
): GraphData {
  // Step 1: Filter nodes by type and search query
  const filteredNodes = graphData.nodes.filter(node => {
    const matchesType = nodeTypes.includes(node.type);
    const matchesSearch = searchQuery 
      ? node.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesType && matchesSearch;
  });
  
  // Get filtered node IDs for link filtering
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
  
  // Step 2: Filter links by type and ensure both source and target exist in filtered nodes
  const filteredLinks = graphData.links.filter(link => {
    const matchesType = linkTypes.includes(link.type);
    const sourceExists = filteredNodeIds.has(typeof link.source === 'object' ? link.source.id : link.source);
    const targetExists = filteredNodeIds.has(typeof link.target === 'object' ? link.target.id : link.target);
    
    return matchesType && sourceExists && targetExists;
  });
  
  return {
    nodes: filteredNodes,
    links: filteredLinks
  };
}

/**
 * Calculates node colors based on node type
 * @param node - The graph node
 * @param isHighlighted - Whether the node is highlighted
 * @returns Color value for the node
 */
export function getNodeColor(node: GraphNode, isHighlighted: boolean = false): string {
  if (isHighlighted) {
    return '#FFD700'; // Gold for highlighted nodes
  }
  
  // Colors by node type
  switch (node.type) {
    case NodeType.ROOT:
      return '#FF5733'; // Coral for root
    case NodeType.ANCESTOR:
      return '#33A1FF'; // Blue for ancestors
    case NodeType.DERIVATIVE:
      return '#33FF57'; // Green for derivatives
    case NodeType.SIBLING:
      return '#F033FF'; // Purple for siblings
    case NodeType.RELATED:
      return '#FFBD33'; // Amber for related
    default:
      return '#AAAAAA'; // Gray for unknown
  }
}

/**
 * Calculates link colors based on link type
 * @param link - The graph link
 * @param isHighlighted - Whether the link is highlighted
 * @returns Color value for the link
 */
export function getLinkColor(link: GraphLink, isHighlighted: boolean = false): string {
  if (isHighlighted) {
    return '#FFD700'; // Gold for highlighted links
  }
  
  // Colors by link type
  switch (link.type) {
    case LinkType.DERIVES_FROM:
      return '#33A1FF'; // Blue for derives from
    case LinkType.DERIVED_BY:
      return '#33FF57'; // Green for derived by
    case LinkType.COMMON_ANCESTOR:
      return '#F033FF'; // Purple for common ancestor
    case LinkType.RELATED:
      return '#FFBD33'; // Amber for related
    default:
      return '#CCCCCC'; // Light gray for unknown
  }
}