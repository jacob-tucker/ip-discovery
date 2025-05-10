import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import GraphControls from '@/components/IPGraph/GraphControls';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';

// Mock the graph ref
const mockGraphRef = {
  current: {
    centerAt: jest.fn(),
    zoom: jest.fn(),
    d3Force: jest.fn(),
    graphData: jest.fn(() => ({
      nodes: [{ id: 'node1' }],
      links: []
    }))
  }
};

describe('GraphControls Component', () => {
  // Mock handlers
  const mockHandlers = {
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onReset: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
        physics: {
          enabled: true,
          friction: 0.9,
          chargeStrength: -80
        }
      }
    });
  });
  
  it('renders zoom controls', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
      />
    );
    
    // Check for zoom buttons
    expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset view/i)).toBeInTheDocument();
  });
  
  it('calls zoom handlers when buttons are clicked', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
      />
    );
    
    // Click zoom in button
    fireEvent.click(screen.getByLabelText(/zoom in/i));
    expect(mockHandlers.onZoomIn).toHaveBeenCalledTimes(1);
    
    // Click zoom out button
    fireEvent.click(screen.getByLabelText(/zoom out/i));
    expect(mockHandlers.onZoomOut).toHaveBeenCalledTimes(1);
    
    // Click reset button
    fireEvent.click(screen.getByLabelText(/reset view/i));
    expect(mockHandlers.onReset).toHaveBeenCalledTimes(1);
  });
  
  it('renders filter controls section', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
      />
    );
    
    // Check for filter controls
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
    
    // Should have node type filters
    expect(screen.getByLabelText(/root/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/derivative/i)).toBeInTheDocument();
  });
  
  it('updates filters when checkboxes are toggled', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
      />
    );
    
    // Find the related checkbox (not checked by default)
    const relatedCheckbox = screen.getByLabelText(/related/i);
    expect(relatedCheckbox).not.toBeChecked();
    
    // Click to check it
    fireEvent.click(relatedCheckbox);
    
    // Store should be updated
    const { filters } = useGraphFilters.getState();
    expect(filters.nodeTypes).toContain('RELATED');
  });
  
  it('updates view preferences when settings are changed', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
      />
    );
    
    // Find the dark mode toggle
    const darkModeToggle = screen.getByLabelText(/dark mode/i);
    expect(darkModeToggle).not.toBeChecked();
    
    // Click to enable dark mode
    fireEvent.click(darkModeToggle);
    
    // Store should be updated
    const { viewPreferences } = useGraphFilters.getState();
    expect(viewPreferences.darkMode).toBe(true);
  });
  
  it('renders in mobile mode correctly', () => {
    render(
      <GraphControls 
        graphRef={mockGraphRef} 
        rootId="root1"
        onZoomIn={mockHandlers.onZoomIn}
        onZoomOut={mockHandlers.onZoomOut}
        onReset={mockHandlers.onReset}
        isMobile={true}
      />
    );
    
    // In mobile mode, the control panel should have a mobile class
    const controlPanel = screen.getByTestId('graph-controls-panel');
    expect(controlPanel).toHaveClass('mobile');
  });
});