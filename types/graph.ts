/**
 * Type definitions for the Derivative Galaxy graph
 */

import { IPAsset } from './ip';

/**
 * Graph node representing an IP asset in the Derivative Galaxy
 */
export interface GraphNode {
  id: string;           // Unique identifier (ipId)
  title: string;        // IP asset title
  description?: string; // IP asset description
  image?: string;       // Thumbnail image URL
  mediaUrl?: string;    // Media content URL
  mediaType?: string;   // Media content type
  type: NodeType;       // Type of node (root, ancestor, derivative, etc.)
  createdAt?: string;   // Creation timestamp
  lastModified?: string; // Last modification timestamp
  data?: any;           // Raw IP asset data
  size?: number;        // Node size (can be calculated based on importance)
  color?: string;       // Node color (can be set based on type)
  highlighted?: boolean; // Whether the node is currently highlighted
  
  // Force-directed graph properties (managed by visualization library)
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
  id: string;           // Unique identifier for the link
  source: string;       // Source node ID
  target: string;       // Target node ID
  type: LinkType;       // Type of relationship
  relationshipId?: string; // ID of the relationship in Story Protocol
  strength?: number;    // Link strength (affects force simulation)
  distance?: number;    // Preferred distance between nodes
  color?: string;       // Link color
  width?: number;       // Link width
  highlighted?: boolean; // Whether the link is currently highlighted
  bidirectional?: boolean; // Whether the relationship is bidirectional
  createdAt?: string;   // When the relationship was established
  data?: RelationshipData; // Additional relationship metadata
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: GraphMetadata;
}

/**
 * Metadata about the graph itself
 */
export interface GraphMetadata {
  rootId: string;          // ID of the central node
  totalNodes: number;      // Total number of nodes
  totalLinks: number;      // Total number of links
  depth: number;           // Maximum distance from root
  createdAt: string;       // When the graph data was generated
  lastUpdated: string;     // When the graph data was last updated
}

/**
 * Detailed metadata about a relationship between IPs
 */
export interface RelationshipData {
  relationshipType: RelationshipType;
  approvalStatus?: ApprovalStatus;
  licenseTermsId?: string;
  licenseType?: string;
  royaltyInfo?: RoyaltyInfo;
  remixType?: RemixType;
  verificationStatus?: VerificationStatus;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Types of nodes in the graph
 */
export enum NodeType {
  ROOT = 'root',            // The central IP being viewed
  ANCESTOR = 'ancestor',    // Parent/source IP that this IP derives from
  DERIVATIVE = 'derivative', // Child/derivative IP created from this IP
  SIBLING = 'sibling',      // IP that shares a common ancestor
  COLLABORATOR = 'collaborator', // IP with the same creator/collaborator
  RELATED = 'related',      // IP that's related but not directly connected
  DISPUTED = 'disputed'     // IP with an active dispute
}

/**
 * Types of relationships between nodes
 */
export enum LinkType {
  DERIVES_FROM = 'derivesFrom',    // Target derives from source (parent->child)
  DERIVED_BY = 'derivedBy',        // Source is derived by target (child->parent)
  COMMON_ANCESTOR = 'commonAncestor', // Nodes share ancestor (sibling relationship)
  COLLABORATION = 'collaboration', // Collaboration relationship
  RELATED = 'related',             // General relation not falling in above categories
  DISPUTE = 'dispute'              // Dispute relationship
}

/**
 * More specific relationship types within the Story Protocol ecosystem
 */
export enum RelationshipType {
  REMIX = 'remix',             // Creative derivative
  ADAPTATION = 'adaptation',   // Adapted for different medium
  TRANSLATION = 'translation', // Translated to different language
  SAMPLE = 'sample',           // Sample of original work
  SEQUEL = 'sequel',           // Continuation of original story
  PREQUEL = 'prequel',         // Story set before original
  SPINOFF = 'spinoff',         // Story branching from original
  INSPIRATION = 'inspiration', // Inspired by but substantially different
  HOMAGE = 'homage',           // Tribute to original
  PARODY = 'parody',           // Satirical derivative
  REFERENCE = 'reference',     // References the original
  OTHER = 'other'              // Other relationship type
}

/**
 * More specific types of remixes
 */
export enum RemixType {
  VISUAL = 'visual',          // Visual remix (image, video)
  AUDIO = 'audio',            // Audio remix
  TEXT = 'text',              // Text remix
  CODE = 'code',              // Code remix
  MIXED_MEDIA = 'mixedMedia', // Multiple media types
  INTERACTIVE = 'interactive', // Interactive experience
  OTHER = 'other'             // Other remix type
}

/**
 * Approval status for a relationship
 */
export enum ApprovalStatus {
  APPROVED = 'approved',           // Explicitly approved by IP owner
  PENDING = 'pending',             // Waiting for approval
  REJECTED = 'rejected',           // Explicitly rejected
  AUTO_APPROVED = 'autoApproved',  // Automatically approved based on license
  NOT_REQUIRED = 'notRequired'     // Approval not required
}

/**
 * Verification status for a relationship
 */
export enum VerificationStatus {
  VERIFIED = 'verified',           // Verified by a trusted source
  UNVERIFIED = 'unverified',       // Not yet verified
  DISPUTED = 'disputed',           // Disputed relationship
  IN_REVIEW = 'inReview'           // Currently under review
}

/**
 * Royalty information for a relationship
 */
export interface RoyaltyInfo {
  type: RoyaltyType;
  percentage?: number;  // Royalty percentage (0-100)
  flatFee?: number;     // Flat fee amount
  token?: string;       // Token used for royalty
  paid?: boolean;       // Whether royalties have been paid
  lastPayment?: string; // Timestamp of last payment
}

/**
 * Types of royalty arrangements
 */
export enum RoyaltyType {
  PERCENTAGE = 'percentage', // Percentage of revenue
  FLAT_FEE = 'flatFee',      // One-time flat fee
  HYBRID = 'hybrid',         // Combination of percentage and flat fee
  NONE = 'none'              // No royalties
}

/**
 * Filter options for the graph
 */
export interface GraphFilters {
  nodeTypes: NodeType[];
  linkTypes: LinkType[];
  relationshipTypes?: RelationshipType[];
  remixTypes?: RemixType[];
  approvalStatuses?: ApprovalStatus[];
  verificationStatuses?: VerificationStatus[];
  searchQuery: string;
  maxDistance: number;  // How many hops away from root to display
  showLabels: boolean;
  minCreationDate?: string;
  maxCreationDate?: string;
  creators?: string[];  // Filter by creator address
  tags?: string[];      // Filter by tags
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
  physics: PhysicsSettings; // Force simulation settings
  labels: LabelSettings;   // Label display settings
  nodeColorScheme: string; // Color scheme for nodes
  linkColorScheme: string; // Color scheme for links
  groupingEnabled: boolean; // Enable node grouping
}

/**
 * Physics settings for force simulation
 */
export interface PhysicsSettings {
  gravity: number;      // Gravity strength (-100 to 100)
  linkStrength: number; // Link strength (0 to 100)
  friction: number;     // Friction (0 to 1)
  chargeStrength: number; // Repulsion strength (-1000 to 0)
  enabled: boolean;     // Whether physics simulation is enabled
}

/**
 * Label display settings
 */
export interface LabelSettings {
  showNodeLabels: boolean;
  showLinkLabels: boolean;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  padding: number;
  maxLength: number;  // Max characters before truncation
}

/**
 * Search result for graph entities
 */
export interface GraphSearchResult {
  nodes: GraphNode[];
  links: GraphLink[];
  query: string;
  totalResults: number;
}

/**
 * Response type for derivative relationships API
 */
export interface DerivativeRelationsResponse {
  // The root IP with details
  root: IPNode;
  
  // Parent/ancestor IPs that this IP derives from
  ancestors: IPRelationship[];
  
  // Child/derivative IPs created from this IP
  derivatives: IPRelationship[];
  
  // IPs that are related in other ways (siblings, etc)
  related: IPRelationship[];
  
  // IP relationships with active disputes
  disputed?: IPRelationship[];
  
  // Metadata about the relationships
  metadata?: {
    totalRelationships: number;
    directRelationships: number;
    indirectRelationships: number;
    updatedAt: string;
  };
}

/**
 * IP node data structure
 */
export interface IPNode {
  ipId: string;
  title: string;
  description?: string;
  image?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt?: string;
  creators?: {
    address: string;
    name?: string;
    contributionType?: string;
  }[];
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * IP relationship data structure
 */
export interface IPRelationship {
  ipId: string;
  title: string;
  description?: string;
  image?: string;
  relationshipType: RelationshipType | string;
  relationshipId?: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  approvalStatus?: ApprovalStatus;
  createdAt?: string;
  remixType?: RemixType;
  verificationStatus?: VerificationStatus;
  licenseId?: string;
  royaltyInfo?: RoyaltyInfo;
  distance?: number; // How many hops from root (1 = direct, 2+ = indirect)
  metadata?: Record<string, any>;
}