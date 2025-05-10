import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import DerivativeGraph from '@/components/IPGraph/DerivativeGraph';
import { useGraphData } from '@/lib/hooks/useDerivativeData';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { mockGraphData } from '../../../test-utils';

// Mock the hooks
jest.mock('@/lib/hooks/useDerivativeData', () => ({
  useGraphData: jest.fn(),
  useDerivativeRelations: jest.fn(() => ({ data: null, isLoading: false, error: null }))
}));

jest.mock('react-force-graph-2d', () => ({
  ForceGraph2D: jest.fn().mockImplementation(({ children, onNodeClick, onNodeHover, ...props }) => (
    <div data-testid="force-graph-2d" {...props}>
      {/* Mock the node click handler */}
      <button 
        onClick={() => onNodeClick({ 
          id: 'node1', 
          title: 'Test Node', 
          type: 'ROOT',
          x: 0, 
          y: 0 
        })}
        data-testid="mock-node"
      >
        Click Node
      </button>
      
      {/* Mock the node hover handler */}
      <div 
        onMouseEnter={() => onNodeHover({ 
          id: 'node1', 
          title: 'Test Node', 
          type: 'ROOT',
          x: 0, 
          y: 0 
        })}
        onMouseLeave={() => onNodeHover(null)}
        data-testid="mock-hover-area"
      >
        Hover Area
      </div>
      
      {children}
    </div>
  ))
}));

describe('DerivativeGraph Component', () => {
  // Setup mock data and state
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
        nodeTypes: ['ROOT', 'DERIVATIVE'],
        linkTypes: ['DERIVES_FROM', 'DERIVED_BY'],
        showLabels: true
      },
      viewPreferences: {
        darkMode: false,
        nodeSize: 15,
        highlightedNode: null,
        highlightedPath: null
      },
      selectedNode: null,
      zoomLevel: 1,
      isLoading: false,
      error: null
    });
  });
  
  it('renders the graph when data is loaded', () => {
    render(<DerivativeGraph ipId="test-ip" />);
    
    // Force graph should be rendered
    expect(screen.getByTestId('force-graph-2d')).toBeInTheDocument();
    
    // Controls should be rendered
    expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset view/i)).toBeInTheDocument();
  });
  
  it('renders loading state when data is loading', () => {
    // Mock loading state
    (useGraphData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });
    
    render(<DerivativeGraph ipId="test-ip" />);
    
    // Loading spinner should be rendered
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Force graph should not be rendered
    expect(screen.queryByTestId('force-graph-2d')).not.toBeInTheDocument();
  });
  
  it('renders error state when there is an error', () => {
    // Mock error state
    const errorMessage = 'Failed to load graph data';
    (useGraphData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: errorMessage,
      refetch: jest.fn()
    });
    
    render(<DerivativeGraph ipId="test-ip" />);
    
    // Error message should be rendered
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Retry button should be rendered
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
  
  it('handles node click events', async () => {
    const onNodeClick = jest.fn();
    render(<DerivativeGraph ipId="test-ip" onNodeClick={onNodeClick} />);
    
    // Click the mock node
    fireEvent.click(screen.getByTestId('mock-node'));
    
    // External handler should be called
    expect(onNodeClick).toHaveBeenCalledTimes(1);
    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'node1',
      type: 'ROOT'
    }));
    
    // Selected node should be updated in the store
    await waitFor(() => {
      expect(useGraphFilters.getState().selectedNode).toBe('node1');
    });
  });
  
  it('handles node hover events', () => {
    render(<DerivativeGraph ipId="test-ip" />);
    
    // No tooltip initially
    expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
    
    // Hover over the mock area
    fireEvent.mouseEnter(screen.getByTestId('mock-hover-area'));
    
    // Tooltip should appear
    const tooltip = screen.getByText('Test Node');
    expect(tooltip).toBeInTheDocument();
    
    // Mouse leave
    fireEvent.mouseLeave(screen.getByTestId('mock-hover-area'));
    
    // Tooltip should disappear
    expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
  });
  
  it('renders with dark mode when enabled', () => {
    // Enable dark mode in the store
    useGraphFilters.setState({
      viewPreferences: {
        ...useGraphFilters.getState().viewPreferences,
        darkMode: true
      }
    });
    
    const { container } = render(<DerivativeGraph ipId="test-ip" />);
    
    // Container should have dark class
    expect(container.querySelector('.graph-container')).toHaveClass('dark');
  });
  
  it('renders with custom dimensions', () => {
    const { container } = render(
      <DerivativeGraph ipId="test-ip" width={800} height={600} />
    );
    
    // Container should have the specified dimensions
    const graphContainer = container.querySelector('.graph-container');
    expect(graphContainer).toHaveStyle('width: 800px');
    expect(graphContainer).toHaveStyle('height: 600px');
  });
  
  it('respects showControls and showLegend props', () => {
    // Render without controls and legend
    render(<DerivativeGraph ipId="test-ip" showControls={false} showLegend={false} />);
    
    // Controls should not be rendered
    expect(screen.queryByTestId('graph-controls-panel')).not.toBeInTheDocument();
    
    // Legend should not be rendered
    expect(screen.queryByText('Legend')).not.toBeInTheDocument();
  });
  
  it('shows text description when showDescription is true', () => {
    render(<DerivativeGraph ipId="test-ip" showDescription={true} />);
    
    // Check for graph description
    expect(screen.getByLabelText('IP Relationship Graph Description')).toBeInTheDocument();
  });
});