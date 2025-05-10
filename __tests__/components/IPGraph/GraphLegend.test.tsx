import React from 'react';
import { render, screen } from '../../../test-utils';
import GraphLegend from '@/components/IPGraph/GraphLegend';
import { NodeType, LinkType } from '@/types/graph';

describe('GraphLegend Component', () => {
  it('renders with all node and link types in expanded mode', () => {
    render(<GraphLegend position="bottom-left" compact={false} />);
    
    // Should show the legend heading
    expect(screen.getByText('Legend')).toBeInTheDocument();
    
    // Should display all node types
    const nodeTypes = Object.values(NodeType);
    for (const nodeType of nodeTypes) {
      // Check if any element with this text exists
      const elements = screen.getAllByText(new RegExp(nodeType, 'i'));
      expect(elements.length).toBeGreaterThan(0);
    }
    
    // Should display all link types
    const linkTypes = Object.values(LinkType);
    for (const linkType of linkTypes) {
      // Check if any element with this text exists
      const elements = screen.getAllByText(new RegExp(linkType.replace('_', ' '), 'i'));
      expect(elements.length).toBeGreaterThan(0);
    }
  });
  
  it('renders in compact mode with fewer items', () => {
    render(<GraphLegend position="bottom-left" compact={true} />);
    
    // Should still show the legend heading
    expect(screen.getByText('Legend')).toBeInTheDocument();
    
    // Should display fewer items (compact mode)
    const allItems = screen.getAllByRole('listitem');
    
    // In compact mode, usually shows fewer items than all node + link types
    const totalTypes = Object.values(NodeType).length + Object.values(LinkType).length;
    expect(allItems.length).toBeLessThan(totalTypes);
  });
  
  it('applies the correct position class', () => {
    const { container, rerender } = render(<GraphLegend position="top-right" />);
    
    // Check if container has the position class
    expect(container.firstChild).toHaveClass('top-right');
    
    // Rerender with a different position
    rerender(<GraphLegend position="bottom-left" />);
    
    // Check if container has the new position class
    expect(container.firstChild).toHaveClass('bottom-left');
  });
  
  it('toggles between expanded and collapsed states', () => {
    const { container } = render(<GraphLegend position="bottom-left" />);
    
    // Get the toggle button
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    
    // Initially expanded
    expect(container.firstChild).not.toHaveClass('collapsed');
    
    // Click to collapse
    toggleButton.click();
    expect(container.firstChild).toHaveClass('collapsed');
    
    // Click to expand again
    toggleButton.click();
    expect(container.firstChild).not.toHaveClass('collapsed');
  });
  
  it('respects the showToggle prop', () => {
    // Render with toggle hidden
    const { rerender } = render(<GraphLegend position="bottom-left" showToggle={false} />);
    
    // Toggle button should not be visible
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    
    // Rerender with toggle shown
    rerender(<GraphLegend position="bottom-left" showToggle={true} />);
    
    // Toggle button should now be visible
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});