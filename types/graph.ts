/**
 * Type definitions for the Derivative Galaxy graph
 */

/**
 * Graph node representing an IP asset in the Derivative Galaxy
 */
export interface GraphNode {
  id: string;           // Unique identifier (ipId)
  title: string;        // IP asset title
  image?: string;       // Thumbnail image URL
  type: NodeType;       // Type of node (original, derivative, related)
  data: any;            // Raw IP asset data
  x?: number;           // X position (set by force simulation)
  y?: number;           // Y position (set by force simulation)
  vx?: number;          // X velocity (set by force simulation)
  vy?: number;          // Y velocity (set by force simulation)
  fx?: number;          // Fixed X position (if node is pinned)
  fy?: number;          // Fixed Y position (if node is pinned)
}

/**
 * Graph link representing a relationship between IP assets
 */
export interface GraphLink {
  source: string;       // Source node ID
  target: string;       // Target node ID
  type: LinkType;       // Type of relationship
  data?: any;           // Additional relationship data
  value?: number;       // Link strength (optional, used by force simulation)
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Types of nodes in the graph
 */
export enum NodeType {
  ROOT = 'root',            // The central IP being viewed
  ANCESTOR = 'ancestor',    // Parent/source IP that this IP derives from
  DERIVATIVE = 'derivative', // Child/derivative IP created from this IP
  SIBLING = 'sibling',      // IP that shares a common ancestor
  RELATED = 'related'       // IP that's related but not directly connected
}

/**
 * Types of relationships between nodes
 */
export enum LinkType {
  DERIVES_FROM = 'derivesFrom',  // Target derives from source
  DERIVED_BY = 'derivedBy',      // Source is derived by target
  COMMON_ANCESTOR = 'commonAncestor', // Nodes share ancestor
  RELATED = 'related'      // General relation not falling in above categories
}

/**
 * Filter options for the graph
 */
export interface GraphFilters {
  nodeTypes: NodeType[];
  linkTypes: LinkType[];
  searchQuery: string;
  maxDistance: number;  // How many hops away from root to display
  showLabels: boolean;
}

/**
 * Graph view preferences
 */
export interface GraphViewPreferences {
  autoZoom: boolean;    // Auto-zoom to fit graph
  darkMode: boolean;    // Dark mode toggle
  nodeSize: number;     // Base node size
  linkWidth: number;    // Base link width
  highlightedNode: string | null; // Currently highlighted node
  highlightedPath: GraphLink[] | null; // Currently highlighted path
}

/**
 * Response type for derivative relationships API
 */
export interface DerivativeRelationsResponse {
  // The root IP with details
  root: {
    ipId: string;
    title: string;
    image?: string;
    metadata: any;
  };
  
  // Parent/ancestor IPs that this IP derives from
  ancestors: Array<{
    ipId: string;
    title: string;
    image?: string;
    relationshipType: string;
    metadata: any;
  }>;
  
  // Child/derivative IPs created from this IP
  derivatives: Array<{
    ipId: string;
    title: string;
    image?: string;
    relationshipType: string; 
    metadata: any;
  }>;
  
  // IPs that are related in other ways (siblings, etc)
  related: Array<{
    ipId: string;
    title: string;
    image?: string;
    relationshipType: string;
    metadata: any;
  }>;
}