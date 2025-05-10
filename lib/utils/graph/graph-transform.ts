/**
 * Utility functions for transforming API data to graph format
 * and handling graph data manipulations
 */

import { 
  GraphData, 
  GraphNode, 
  GraphLink, 
  NodeType, 
  LinkType,
  RelationshipType,
  DerivativeRelationsResponse,
  IPRelationship
} from '@/types/graph';

// Force graph simulation constants
const NODE_DISTANCE_MULTIPLIER = {
  [NodeType.ROOT]: 1,
  [NodeType.ANCESTOR]: 1.5,
  [NodeType.DERIVATIVE]: 1,
  [NodeType.SIBLING]: 2,
  [NodeType.RELATED]: 2.5,
  [NodeType.DISPUTED]: 3,
  [NodeType.COLLABORATOR]: 1.8
};

// Link strength modifiers by relationship type
const LINK_STRENGTH_MODIFIER = {
  [LinkType.DERIVES_FROM]: 1,
  [LinkType.DERIVED_BY]: 0.8,
  [LinkType.COMMON_ANCESTOR]: 0.6,
  [LinkType.RELATED]: 0.4,
  [LinkType.COLLABORATION]: 0.7,
  [LinkType.DISPUTE]: 0.3
};

/**
 * Transforms derivative relations API response to graph data format
 * @param data - Derivative relations data from API
 * @returns Formatted graph data for visualization
 */
export function transformToGraphData(data: DerivativeRelationsResponse): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const relationshipMap = new Map<string, GraphLink>();
  
  // Add root node
  const rootNode: GraphNode = {
    id: data.root.ipId,
    title: data.root.title,
    description: data.root.description,
    image: data.root.image,
    mediaUrl: data.root.mediaUrl,
    mediaType: data.root.mediaType,
    type: NodeType.ROOT,
    createdAt: data.root.createdAt,
    data: data.root.metadata || {}
  };
  
  nodes.push(rootNode);
  nodeMap.set(rootNode.id, rootNode);
  
  // Process ancestors
  data.ancestors.forEach(ancestor => {
    // Add ancestor node if not already in the map
    if (!nodeMap.has(ancestor.ipId)) {
      const node = createNodeFromRelationship(ancestor, NodeType.ANCESTOR);
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
    
    // Add link from ancestor to root
    const linkId = `${ancestor.ipId}->${data.root.ipId}`;
    if (!relationshipMap.has(linkId)) {
      const link = createLinkFromRelationship(
        ancestor, 
        ancestor.ipId, 
        data.root.ipId, 
        LinkType.DERIVES_FROM,
        getRelationshipTypeFromString(ancestor.relationshipType)
      );
      links.push(link);
      relationshipMap.set(linkId, link);
    }
  });
  
  // Process derivatives
  data.derivatives.forEach(derivative => {
    // Add derivative node if not already in the map
    if (!nodeMap.has(derivative.ipId)) {
      const node = createNodeFromRelationship(derivative, NodeType.DERIVATIVE);
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
    
    // Add link from root to derivative
    const linkId = `${data.root.ipId}->${derivative.ipId}`;
    if (!relationshipMap.has(linkId)) {
      const link = createLinkFromRelationship(
        derivative, 
        data.root.ipId, 
        derivative.ipId, 
        LinkType.DERIVED_BY,
        getRelationshipTypeFromString(derivative.relationshipType)
      );
      links.push(link);
      relationshipMap.set(linkId, link);
    }
  });
  
  // Process related IPs
  data.related.forEach(related => {
    // Add related node if not already in the map
    if (!nodeMap.has(related.ipId)) {
      const node = createNodeFromRelationship(related, NodeType.RELATED);
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
    
    // Add link between root and related
    const linkId = `${data.root.ipId}->${related.ipId}`;
    if (!relationshipMap.has(linkId)) {
      const link = createLinkFromRelationship(
        related, 
        data.root.ipId, 
        related.ipId, 
        LinkType.RELATED,
        getRelationshipTypeFromString(related.relationshipType)
      );
      links.push(link);
      relationshipMap.set(linkId, link);
    }
  });
  
  // Process disputed relationships if available
  if (data.disputed && data.disputed.length > 0) {
    data.disputed.forEach(disputed => {
      // Add disputed node if not already in the map
      if (!nodeMap.has(disputed.ipId)) {
        const node = createNodeFromRelationship(disputed, NodeType.DISPUTED);
        nodes.push(node);
        nodeMap.set(node.id, node);
      }
      
      // Add link between root and disputed
      const linkId = `${data.root.ipId}->${disputed.ipId}`;
      if (!relationshipMap.has(linkId)) {
        const link = createLinkFromRelationship(
          disputed, 
          data.root.ipId, 
          disputed.ipId, 
          LinkType.DISPUTE,
          getRelationshipTypeFromString(disputed.relationshipType)
        );
        links.push(link);
        relationshipMap.set(linkId, link);
      }
    });
  }
  
  return { 
    nodes, 
    links,
    metadata: {
      rootId: data.root.ipId,
      totalNodes: nodes.length,
      totalLinks: links.length,
      depth: data.metadata?.directRelationships || 0,
      createdAt: new Date().toISOString(),
      lastUpdated: data.metadata?.updatedAt || new Date().toISOString()
    }
  };
}

/**
 * Creates a graph node from an IP relationship
 * @param relationship - IP relationship data
 * @param nodeType - Type of node to create
 * @returns GraphNode object
 */
function createNodeFromRelationship(
  relationship: IPRelationship, 
  nodeType: NodeType
): GraphNode {
  return {
    id: relationship.ipId,
    title: relationship.title,
    description: relationship.description,
    image: relationship.image,
    type: nodeType,
    createdAt: relationship.createdAt,
    data: {
      relationshipType: relationship.relationshipType,
      approvalStatus: relationship.approvalStatus,
      distance: relationship.distance || 1,
      ...relationship.metadata
    }
  };
}

/**
 * Creates a graph link from an IP relationship
 * @param relationship - IP relationship data
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param linkType - Type of link to create
 * @param relationshipType - Specific relationship type
 * @returns GraphLink object
 */
function createLinkFromRelationship(
  relationship: IPRelationship,
  sourceId: string,
  targetId: string,
  linkType: LinkType,
  relationshipType: RelationshipType
): GraphLink {
  // Calculate link strength based on relationship type
  const baseStrength = LINK_STRENGTH_MODIFIER[linkType] || 0.5;
  const distance = relationship.distance || 1;
  
  // Weaken strength for more distant relationships
  const strengthMultiplier = Math.max(0.1, 1 / (distance * 1.5));
  
  return {
    id: `${sourceId}->${targetId}`,
    source: sourceId,
    target: targetId,
    type: linkType,
    relationshipId: relationship.relationshipId,
    strength: baseStrength * strengthMultiplier,
    distance: distance * 30, // Typical link distance in pixels
    bidirectional: relationship.direction === 'bidirectional',
    createdAt: relationship.createdAt,
    data: {
      relationshipType,
      approvalStatus: relationship.approvalStatus,
      verificationStatus: relationship.verificationStatus,
      licenseId: relationship.licenseId,
      royaltyInfo: relationship.royaltyInfo,
      distance: relationship.distance || 1,
      direction: relationship.direction
    }
  };
}

/**
 * Converts a string relationship type to enum value
 * @param type - Relationship type string from API
 * @returns Mapped RelationshipType enum value
 */
function getRelationshipTypeFromString(type: string): RelationshipType {
  // Try to match the type directly
  const exactMatch = Object.values(RelationshipType).find(
    enumValue => enumValue.toLowerCase() === type.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch as RelationshipType;
  }
  
  // If not found, try to match based on keywords
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('remix') || lowerType.includes('derivative')) {
    return RelationshipType.REMIX;
  } else if (lowerType.includes('adapt')) {
    return RelationshipType.ADAPTATION;
  } else if (lowerType.includes('translat')) {
    return RelationshipType.TRANSLATION;
  } else if (lowerType.includes('sample')) {
    return RelationshipType.SAMPLE;
  } else if (lowerType.includes('sequel')) {
    return RelationshipType.SEQUEL;
  } else if (lowerType.includes('prequel')) {
    return RelationshipType.PREQUEL;
  } else if (lowerType.includes('spin') || lowerType.includes('offshoot')) {
    return RelationshipType.SPINOFF;
  } else if (lowerType.includes('inspir')) {
    return RelationshipType.INSPIRATION;
  } else if (lowerType.includes('homage') || lowerType.includes('tribute')) {
    return RelationshipType.HOMAGE;
  } else if (lowerType.includes('parody') || lowerType.includes('satire')) {
    return RelationshipType.PARODY;
  } else if (lowerType.includes('reference')) {
    return RelationshipType.REFERENCE;
  }
  
  // Default to OTHER if no match found
  return RelationshipType.OTHER;
}

/**
 * Finds path between two nodes in the graph
 * @param graphData - The graph data
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @returns Array of links that form the path, or null if no path found
 */
export function findPath(
  graphData: GraphData,
  sourceId: string,
  targetId: string
): GraphLink[] | null {
  // If source and target are the same, return empty path
  if (sourceId === targetId) {
    return [];
  }
  
  // Build adjacency list for faster traversal
  const adjacencyList = new Map<string, {target: string, link: GraphLink}[]>();
  
  // Initialize adjacency list
  graphData.nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  // Add links to adjacency list (considering bidirectional links)
  graphData.links.forEach(link => {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Add source -> target direction
    const sourceList = adjacencyList.get(source) || [];
    sourceList.push({ target, link });
    adjacencyList.set(source, sourceList);
    
    // If bidirectional, add target -> source direction too
    if (link.bidirectional) {
      const targetList = adjacencyList.get(target) || [];
      targetList.push({ target: source, link });
      adjacencyList.set(target, targetList);
    }
  });
  
  // Use breadth-first search to find shortest path
  const queue: {node: string, path: GraphLink[]}[] = [{ node: sourceId, path: [] }];
  const visited = new Set<string>([sourceId]);
  
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    const neighbors = adjacencyList.get(node) || [];
    
    for (const { target, link } of neighbors) {
      if (target === targetId) {
        // Found the target, return the path
        return [...path, link];
      }
      
      if (!visited.has(target)) {
        visited.add(target);
        queue.push({ node: target, path: [...path, link] });
      }
    }
  }
  
  // No path found
  return null;
}

/**
 * Applies filters to graph data
 * @param graphData - The original graph data
 * @param nodeTypes - Array of node types to include
 * @param linkTypes - Array of link types to include
 * @param searchQuery - Optional search term to filter by title
 * @param maxDistance - Maximum hop distance from root node
 * @param relationshipTypes - Optional specific relationship types to include
 * @returns Filtered graph data
 */
export function applyFilters(
  graphData: GraphData,
  nodeTypes: NodeType[],
  linkTypes: LinkType[],
  searchQuery: string = '',
  maxDistance: number = 2,
  relationshipTypes?: RelationshipType[]
): GraphData {
  if (!graphData || !graphData.nodes || !graphData.links) {
    return { nodes: [], links: [] };
  }
  
  const rootNode = graphData.nodes.find(node => node.type === NodeType.ROOT);
  if (!rootNode) {
    return { nodes: [], links: [] };
  }
  
  // Step 1: Filter by distance from root
  // This requires a breadth-first traversal from the root
  const nodeDistances = calculateNodeDistances(graphData, rootNode.id);
  
  // Step 2: Filter nodes by type, search query, and distance
  const filteredNodes = graphData.nodes.filter(node => {
    // Always include the root node
    if (node.type === NodeType.ROOT) {
      return true;
    }
    
    const distance = nodeDistances.get(node.id) || Infinity;
    const withinDistance = distance <= maxDistance;
    const matchesType = nodeTypes.includes(node.type);
    const matchesSearch = searchQuery 
      ? (node.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         node.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    return matchesType && matchesSearch && withinDistance;
  });
  
  // Get filtered node IDs for link filtering
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
  
  // Step 3: Filter links by type and ensure both source and target exist in filtered nodes
  const filteredLinks = graphData.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const matchesType = linkTypes.includes(link.type);
    const sourceExists = filteredNodeIds.has(sourceId);
    const targetExists = filteredNodeIds.has(targetId);
    
    // If relationship types are specified, check that the link matches one of them
    const matchesRelationshipType = relationshipTypes && link.data?.relationshipType
      ? relationshipTypes.includes(link.data.relationshipType)
      : true;
    
    return matchesType && sourceExists && targetExists && matchesRelationshipType;
  });
  
  // Create a new graph data object with filtered nodes and links
  const result: GraphData = {
    nodes: filteredNodes,
    links: filteredLinks,
    metadata: graphData.metadata
  };
  
  // If search query is provided, highlight matching nodes
  if (searchQuery && filteredNodes.length > 0) {
    const matchingNodeIds = filteredNodes
      .filter(node => 
        node.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(node => node.id);
    
    if (matchingNodeIds.length > 0) {
      // Add highlighting to matching nodes
      result.nodes = result.nodes.map(node => ({
        ...node,
        highlighted: matchingNodeIds.includes(node.id)
      }));
    }
  }
  
  return result;
}

/**
 * Calculates the distance of each node from a source node
 * @param graphData - The graph data
 * @param sourceId - Source node ID to start traversal from
 * @returns Map of node IDs to their distance from the source
 */
function calculateNodeDistances(
  graphData: GraphData,
  sourceId: string
): Map<string, number> {
  const distances = new Map<string, number>();
  distances.set(sourceId, 0);
  
  // Build adjacency list for faster traversal
  const adjacencyList = new Map<string, string[]>();
  
  // Initialize adjacency list
  graphData.nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  // Add links to adjacency list (considering bidirectional links)
  graphData.links.forEach(link => {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Add source -> target direction
    const sourceList = adjacencyList.get(source) || [];
    sourceList.push(target);
    adjacencyList.set(source, sourceList);
    
    // If bidirectional, add target -> source direction too
    if (link.bidirectional) {
      const targetList = adjacencyList.get(target) || [];
      targetList.push(source);
      adjacencyList.set(target, targetList);
    }
  });
  
  // Use breadth-first search to find shortest distances
  const queue: {node: string, distance: number}[] = [{ node: sourceId, distance: 0 }];
  const visited = new Set<string>([sourceId]);
  
  while (queue.length > 0) {
    const { node, distance } = queue.shift()!;
    
    const neighbors = adjacencyList.get(node) || [];
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distances.set(neighbor, distance + 1);
        queue.push({ node: neighbor, distance: distance + 1 });
      }
    }
  }
  
  return distances;
}

/**
 * Calculates node colors based on node type
 * @param node - The graph node
 * @param isHighlighted - Whether the node is highlighted
 * @returns Color value for the node
 */
export function getNodeColor(node: GraphNode, isHighlighted: boolean = false): string {
  if (isHighlighted || node.highlighted) {
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
    case NodeType.COLLABORATOR:
      return '#FF9233'; // Orange for collaborators
    case NodeType.RELATED:
      return '#FFBD33'; // Amber for related
    case NodeType.DISPUTED:
      return '#FF3355'; // Red for disputed
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
  if (isHighlighted || link.highlighted) {
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
    case LinkType.COLLABORATION:
      return '#FF9233'; // Orange for collaboration
    case LinkType.RELATED:
      return '#FFBD33'; // Amber for related
    case LinkType.DISPUTE:
      return '#FF3355'; // Red for disputed
    default:
      return '#CCCCCC'; // Light gray for unknown
  }
}

/**
 * Gets a properly formatted label for a node, handling truncation
 * @param node - The graph node
 * @param maxLength - Maximum length before truncation
 * @returns Formatted label string
 */
export function getNodeLabel(node: GraphNode, maxLength: number = 20): string {
  if (!node.title) {
    return node.id.substring(0, 8) + '...';
  }
  
  if (node.title.length <= maxLength) {
    return node.title;
  }
  
  return node.title.substring(0, maxLength) + '...';
}