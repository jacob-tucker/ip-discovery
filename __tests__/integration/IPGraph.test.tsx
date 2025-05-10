import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import DerivativeGraph from '@/components/IPGraph/DerivativeGraph';
import { useGraphData } from '@/lib/hooks/useDerivativeData';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { mockGraphData } from '../test-utils';

// Mock the graph data hook
jest.mock('@/lib/hooks/useDerivativeData', () => ({
  ...jest.requireActual('@/lib/hooks/useDerivativeData'),
  useGraphData: jest.fn(),
  useDerivativeRelations: jest.fn(() => ({ data: null, isLoading: false, error: null }))
}));

// Mock react-force-graph-2d with a more interactive test implementation
jest.mock('react-force-graph-2d', () => ({
  ForceGraph2D: jest.fn().mockImplementation(({ 
    graphData,
    onNodeClick, 
    onNodeHover,
    nodeCanvasObject,
    linkCanvasObject,
    ...props 
  }) => {
    // Create a simple mock canvas context for testing
    const mockCtx = {
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      textAlign: '',
      lineWidth: 1,
      setLineDash: jest.fn(),
      save: jest.fn(),
      restore: jest.fn()
    };
    
    return (
      <div data-testid="force-graph-2d" {...props}>
        {/* Render each node as a clickable element */}
        <div data-testid="graph-nodes">
          {graphData?.nodes.map(node => (
            <div 
              key={node.id}
              data-testid={`node-${node.id}`}
              onClick={() => onNodeClick(node)}
              onMouseEnter={() => onNodeHover(node)}
              onMouseLeave={() => onNodeHover(null)}
              data-node-id={node.id}
              data-node-type={node.type}
            >
              {node.title || node.id}
              {/* Trigger the nodeCanvasObject to test rendering */}
              {nodeCanvasObject && nodeCanvasObject(node, mockCtx)}
            </div>
          ))}
        </div>
        
        {/* Render links */}
        <div data-testid="graph-links">
          {graphData?.links.map(link => (
            <div 
              key={link.id}
              data-testid={`link-${link.id}`}
              data-link-source={typeof link.source === 'object' ? link.source.id : link.source}
              data-link-target={typeof link.target === 'object' ? link.target.id : link.target}
              data-link-type={link.type}
            >
              {/* Trigger the linkCanvasObject to test rendering */}
              {linkCanvasObject && linkCanvasObject(link, mockCtx)}
            </div>
          ))}
        </div>
        
        {/* Mock API */}
        <div className="graph-api">
          <button 
            data-testid="zoom-in" 
            onClick={() => props.zoom && props.zoom(2, 500)}
          >
            API Zoom In
          </button>
          <button 
            data-testid="center-at" 
            onClick={() => props.centerAt && props.centerAt(0, 0, 500)}
          >
            API Center At
          </button>
        </div>
      </div>
    );
  })
}));

describe('IP Graph Integration', () => {
  // Setup mock data
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful data loading
    (useGraphData as jest.Mock).mockReturnValue({
      data: mockGraphData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
    
    // Reset zustand store
    useGraphFilters.setState({
      filters: {
        nodeTypes: ['ROOT', 'DERIVATIVE', 'RELATED'],
        linkTypes: ['DERIVES_FROM', 'DERIVED_BY', 'RELATED'],
        showLabels: true
      },
      viewPreferences: {
        darkMode: false,
        nodeSize: 15,
        highlightedNode: null,
        highlightedPath: null,
        physics: {
          enabled: true
        }
      },
      selectedNode: null,
      zoomLevel: 1,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  });
  
  describe('Node interaction flow', () => {
    it('selects a node, highlights it, and shows its details', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Initially, no node is selected
      expect(useGraphFilters.getState().selectedNode).toBeNull();
      
      // Click on a derivative node
      const node = screen.getByTestId('node-deriv1');
      fireEvent.click(node);
      
      // Node should be selected in the store
      expect(useGraphFilters.getState().selectedNode).toBe('deriv1');
      
      // Node should be highlighted
      expect(useGraphFilters.getState().viewPreferences.highlightedNode).toBe('deriv1');
    });
    
    it('shows a tooltip when hovering over a node', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Initially, no tooltip is shown
      expect(screen.queryByText('Derivative 1')).not.toBeInTheDocument();
      
      // Hover over a node
      const node = screen.getByTestId('node-deriv1');
      fireEvent.mouseEnter(node);
      
      // Tooltip should appear
      await waitFor(() => {
        expect(screen.getByText('Derivative 1')).toBeInTheDocument();
      });
      
      // Hover out
      fireEvent.mouseLeave(node);
      
      // Tooltip should disappear
      await waitFor(() => {
        expect(screen.queryByText('Derivative 1')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Filter and control interaction', () => {
    it('updates graph when filters are changed', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Find the RELATED node type filter checkbox
      const relatedFilter = screen.getByLabelText(/related/i);
      
      // Uncheck it
      fireEvent.click(relatedFilter);
      
      // Store should be updated
      expect(useGraphFilters.getState().filters.nodeTypes).not.toContain('RELATED');
      
      // Re-check the filter
      fireEvent.click(relatedFilter);
      
      // Store should be updated
      expect(useGraphFilters.getState().filters.nodeTypes).toContain('RELATED');
    });
    
    it('updates zoom level when zoom controls are used', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Initial zoom level
      expect(useGraphFilters.getState().zoomLevel).toBe(1);
      
      // Click zoom in button
      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);
      
      // Zoom level should increase
      await waitFor(() => {
        expect(useGraphFilters.getState().zoomLevel).toBeGreaterThan(1);
      });
      
      // Click zoom out button
      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      fireEvent.click(zoomOutButton);
      
      // Zoom level should decrease
      await waitFor(() => {
        expect(useGraphFilters.getState().zoomLevel).toBeLessThan(1.2);
      });
    });
    
    it('resets view when reset button is clicked', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // First change some settings
      act(() => {
        useGraphFilters.setState({
          zoomLevel: 2,
          selectedNode: 'deriv1',
          viewPreferences: {
            ...useGraphFilters.getState().viewPreferences,
            highlightedNode: 'deriv1',
            highlightedPath: [{ id: 'link1', source: 'root1', target: 'deriv1' }]
          }
        });
      });
      
      // Click reset button
      const resetButton = screen.getByLabelText(/reset view/i);
      fireEvent.click(resetButton);
      
      // View should be reset
      await waitFor(() => {
        const state = useGraphFilters.getState();
        expect(state.zoomLevel).toBe(1);
        expect(state.selectedNode).toBeNull();
        expect(state.viewPreferences.highlightedNode).toBeNull();
        expect(state.viewPreferences.highlightedPath).toBeNull();
      });
    });
  });
  
  describe('Accessibility interactions', () => {
    it('supports keyboard navigation', async () => {
      render(<DerivativeGraph ipId="root1" />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Press Tab to enter focus mode
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Focus mode should be active
      await waitFor(() => {
        const keyboardControls = screen.getByText(/keyboard navigation/i);
        expect(keyboardControls).toBeInTheDocument();
      });
      
      // Press arrow keys to navigate between nodes
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      // A node should be focused
      await waitFor(() => {
        expect(screen.getByText(/selected node/i)).toBeInTheDocument();
      });
      
      // Press Enter to select the focused node
      fireEvent.keyDown(document, { key: 'Enter' });
      
      // A node should be selected
      await waitFor(() => {
        expect(useGraphFilters.getState().selectedNode).not.toBeNull();
      });
      
      // Press Escape to exit focus mode
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Focus mode should be inactive
      await waitFor(() => {
        expect(screen.queryByText(/keyboard navigation/i)).not.toBeInTheDocument();
      });
    });
    
    it('shows graph description when showDescription is true', async () => {
      render(<DerivativeGraph ipId="root1" showDescription={true} />);
      
      // Wait for graph to render
      await screen.findByTestId('force-graph-2d');
      
      // Should show graph description
      const description = screen.getByLabelText(/ip relationship graph description/i);
      expect(description).toBeInTheDocument();
      
      // Description should contain relevant information
      expect(description).toHaveTextContent(/graph overview/i);
      expect(description).toHaveTextContent(/node types/i);
      
      // Should contain root node info
      expect(description).toHaveTextContent(/root ip/i);
    });
  });
  
  describe('Error handling', () => {
    it('shows error UI and allows retry', async () => {
      // Mock an error
      (useGraphData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Failed to load graph data',
        refetch: jest.fn()
      });
      
      render(<DerivativeGraph ipId="root1" />);
      
      // Should show error message
      expect(screen.getByText(/failed to load graph data/i)).toBeInTheDocument();
      
      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      // Mock successful data for retry
      const mockRefetch = jest.fn().mockResolvedValue({ data: mockGraphData });
      (useGraphData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Failed to load graph data',
        refetch: mockRefetch
      });
      
      // Click retry
      fireEvent.click(retryButton);
      
      // Should attempt to refetch
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });
});