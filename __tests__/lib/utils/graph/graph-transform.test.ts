import {
  transformToGraphData,
  findPath,
  findNodeNeighbors,
  findRelationshipPath,
  createHighlightedGraph,
  applyFilters,
  getNodeColor,
  getLinkColor,
  getNodeLabel
} from '@/lib/utils/graph/graph-transform';
import { NodeType, LinkType, RelationshipType } from '@/types/graph';
import { mockGraphData } from '../../../test-utils';

// Mock IP relationship data
const mockApiResponse = {
  root: {
    ipId: 'root1',
    title: 'Root IP',
    description: 'A root IP',
    createdAt: '2023-01-01T00:00:00Z',
    metadata: {}
  },
  ancestors: [
    {
      ipId: 'ancestor1',
      title: 'Ancestor 1',
      description: 'An ancestor IP',
      relationshipType: 'inspiration',
      createdAt: '2022-01-01T00:00:00Z',
      relationshipId: 'rel-a1',
      distance: 1,
      direction: 'unidirectional'
    }
  ],
  derivatives: [
    {
      ipId: 'deriv1',
      title: 'Derivative 1',
      description: 'A derivative IP',
      relationshipType: 'remix',
      createdAt: '2023-02-01T00:00:00Z',
      relationshipId: 'rel-d1',
      distance: 1,
      direction: 'unidirectional'
    },
    {
      ipId: 'deriv2',
      title: 'Derivative 2',
      description: 'A second derivative IP',
      relationshipType: 'sequel',
      createdAt: '2023-03-01T00:00:00Z',
      relationshipId: 'rel-d2',
      distance: 1,
      direction: 'unidirectional'
    }
  ],
  related: [
    {
      ipId: 'related1',
      title: 'Related 1',
      description: 'A related IP',
      relationshipType: 'reference',
      createdAt: '2023-04-01T00:00:00Z',
      relationshipId: 'rel-r1',
      distance: 1,
      direction: 'bidirectional'
    }
  ],
  disputed: [],
  metadata: {
    directRelationships: 4,
    updatedAt: '2023-05-01T00:00:00Z'
  }
};

describe('Graph Transformation Utilities', () => {
  describe('transformToGraphData', () => {
    it('transforms API response to graph data format', () => {
      const result = transformToGraphData(mockApiResponse);
      
      // Check nodes
      expect(result.nodes).toHaveLength(4); // root + 1 ancestor + 2 derivatives
      expect(result.nodes[0].id).toBe('root1');
      expect(result.nodes[0].type).toBe(NodeType.ROOT);
      
      // Check links
      expect(result.links).toHaveLength(4); // 1 ancestor + 2 derivatives + 1 related
      
      // Check metadata
      expect(result.metadata?.rootId).toBe('root1');
      expect(result.metadata?.depth).toBe(4);
    });

    it('handles empty data', () => {
      const emptyResponse = {
        root: mockApiResponse.root,
        ancestors: [],
        derivatives: [],
        related: [],
        disputed: [],
        metadata: { directRelationships: 0 }
      };
      
      const result = transformToGraphData(emptyResponse);
      
      expect(result.nodes).toHaveLength(1); // Just the root node
      expect(result.links).toHaveLength(0); // No links
    });
  });

  describe('findPath', () => {
    it('finds a direct path between two nodes', () => {
      const path = findPath(mockGraphData, 'root1', 'deriv1');
      
      expect(path).toHaveLength(1);
      expect(path?.[0].source).toBe('root1');
      expect(path?.[0].target).toBe('deriv1');
    });

    it('returns null when no path exists', () => {
      // Create a disconnected graph
      const disconnectedGraph = {
        ...mockGraphData,
        links: mockGraphData.links.filter(link => 
          link.source !== 'root1' && link.target !== 'deriv1'
        )
      };
      
      const path = findPath(disconnectedGraph, 'root1', 'deriv1');
      expect(path).toBeNull();
    });

    it('returns empty array for same source and target', () => {
      const path = findPath(mockGraphData, 'root1', 'root1');
      expect(path).toEqual([]);
    });
  });

  describe('findNodeNeighbors', () => {
    it('finds all neighbors of a node', () => {
      const { nodes, links } = findNodeNeighbors(mockGraphData, 'root1');
      
      expect(nodes).toHaveLength(3); // All three connected nodes
      expect(links).toHaveLength(3); // All three links from root
      
      // Check that all neighbors are included
      const neighborIds = nodes.map(node => node.id);
      expect(neighborIds).toContain('deriv1');
      expect(neighborIds).toContain('deriv2');
      expect(neighborIds).toContain('related1');
    });

    it('returns empty arrays for a node with no neighbors', () => {
      // Use a node that doesn't exist
      const { nodes, links } = findNodeNeighbors(mockGraphData, 'nonexistent');
      
      expect(nodes).toHaveLength(0);
      expect(links).toHaveLength(0);
    });
  });

  describe('findRelationshipPath', () => {
    it('describes direct relationships', () => {
      const result = findRelationshipPath(mockGraphData, 'root1', 'deriv1');
      
      expect(result.path).toHaveLength(1);
      expect(result.intermediateNodes).toHaveLength(0);
      expect(result.description).toContain('Direct relationship');
      expect(result.distance).toBe(1);
    });

    it('handles no relationship cases', () => {
      // Create a disconnected graph
      const disconnectedGraph = {
        ...mockGraphData,
        links: mockGraphData.links.filter(link => 
          link.source !== 'root1' && link.target !== 'deriv1'
        )
      };
      
      const result = findRelationshipPath(disconnectedGraph, 'root1', 'deriv1');
      
      expect(result.path).toBeNull();
      expect(result.intermediateNodes).toHaveLength(0);
      expect(result.description).toBe('No relationship found');
      expect(result.distance).toBe(0);
    });

    it('handles same node case', () => {
      const result = findRelationshipPath(mockGraphData, 'root1', 'root1');
      
      expect(result.path).toHaveLength(0);
      expect(result.intermediateNodes).toHaveLength(0);
      expect(result.description).toBe('Same IP');
      expect(result.distance).toBe(0);
    });
  });

  describe('createHighlightedGraph', () => {
    it('highlights specific nodes and links', () => {
      const highlightedNodeIds = ['root1', 'deriv1'];
      const highlightedLinks = [mockGraphData.links[0]]; // First link
      
      const result = createHighlightedGraph(
        mockGraphData, 
        highlightedNodeIds,
        highlightedLinks
      );
      
      // Check that nodes are highlighted correctly
      const rootNode = result.nodes.find(node => node.id === 'root1');
      const deriv1Node = result.nodes.find(node => node.id === 'deriv1');
      const deriv2Node = result.nodes.find(node => node.id === 'deriv2');
      
      expect(rootNode?.highlighted).toBe(true);
      expect(deriv1Node?.highlighted).toBe(true);
      expect(deriv2Node?.highlighted).toBeFalsy();
      
      // Check that links are highlighted correctly
      const firstLink = result.links[0];
      const secondLink = result.links[1];
      
      expect(firstLink.highlighted).toBe(true);
      expect(secondLink.highlighted).toBeFalsy();
      
      // Check opacity values
      expect(rootNode?.opacity).toBe(1);
      expect(deriv1Node?.opacity).toBe(1);
      expect(deriv2Node?.opacity).toBe(0.3);
    });

    it('handles empty graph data', () => {
      const result = createHighlightedGraph(
        { nodes: [], links: [] },
        ['root1']
      );
      
      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });
  });

  describe('applyFilters', () => {
    it('filters nodes by type', () => {
      const result = applyFilters(
        mockGraphData,
        [NodeType.ROOT, NodeType.DERIVATIVE], // Only root and derivatives
        [LinkType.DERIVES_FROM, LinkType.DERIVED_BY, LinkType.RELATED],
      );
      
      // Should include root and 2 derivatives, but not related
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.some(node => node.type === NodeType.RELATED)).toBe(false);
    });

    it('filters by search query', () => {
      const result = applyFilters(
        mockGraphData,
        [NodeType.ROOT, NodeType.DERIVATIVE, NodeType.RELATED],
        [LinkType.DERIVES_FROM, LinkType.DERIVED_BY, LinkType.RELATED],
        'Derivative 1'
      );
      
      // Should include root and matching derivative
      const nodeIds = result.nodes.map(node => node.id);
      expect(nodeIds).toContain('root1');
      expect(nodeIds).toContain('deriv1');
      expect(nodeIds).not.toContain('deriv2');
      
      // Check that the matching node is highlighted
      const matchingNode = result.nodes.find(node => node.id === 'deriv1');
      expect(matchingNode?.highlighted).toBe(true);
    });

    it('always includes the root node', () => {
      const result = applyFilters(
        mockGraphData,
        [NodeType.DERIVATIVE], // No ROOT type
        [LinkType.DERIVED_BY],
      );
      
      // Root should still be included
      const nodeIds = result.nodes.map(node => node.id);
      expect(nodeIds).toContain('root1');
    });
  });

  describe('getNodeColor', () => {
    it('returns correct colors for different node types', () => {
      const rootColor = getNodeColor({ id: 'root1', type: NodeType.ROOT });
      const derivColor = getNodeColor({ id: 'deriv1', type: NodeType.DERIVATIVE });
      const relatedColor = getNodeColor({ id: 'related1', type: NodeType.RELATED });
      
      expect(rootColor).toBe('#FF5733'); // Coral for root
      expect(derivColor).toBe('#33FF57'); // Green for derivatives
      expect(relatedColor).toBe('#FFBD33'); // Amber for related
    });

    it('returns highlight color for highlighted nodes', () => {
      const color = getNodeColor({ id: 'root1', type: NodeType.ROOT }, true);
      expect(color).toBe('#FFD700'); // Gold for highlighted
    });
  });

  describe('getLinkColor', () => {
    it('returns correct colors for different link types', () => {
      const derivesFromColor = getLinkColor({ id: 'link1', type: LinkType.DERIVES_FROM });
      const derivedByColor = getLinkColor({ id: 'link2', type: LinkType.DERIVED_BY });
      const relatedColor = getLinkColor({ id: 'link3', type: LinkType.RELATED });
      
      expect(derivesFromColor).toBe('#33A1FF'); // Blue for derives from
      expect(derivedByColor).toBe('#33FF57'); // Green for derived by
      expect(relatedColor).toBe('#FFBD33'); // Amber for related
    });

    it('returns highlight color for highlighted links', () => {
      const color = getLinkColor({ id: 'link1', type: LinkType.DERIVES_FROM }, true);
      expect(color).toBe('#FFD700'); // Gold for highlighted
    });
  });

  describe('getNodeLabel', () => {
    it('truncates long labels', () => {
      const longTitle = 'This is a very long title that should be truncated';
      const label = getNodeLabel({ id: 'node1', title: longTitle }, 15);
      
      expect(label).toBe('This is a very ...');
      expect(label.length).toBe(18); // 15 chars + '...'
    });

    it('uses ID when title is not available', () => {
      const label = getNodeLabel({ id: 'a1b2c3d4e5f6g7h8' });
      expect(label).toBe('a1b2c3d4...');
    });

    it('returns full title when within max length', () => {
      const shortTitle = 'Short title';
      const label = getNodeLabel({ id: 'node1', title: shortTitle }, 20);
      
      expect(label).toBe(shortTitle);
    });
  });
});