import React from 'react';
import { render, screen } from '../../../test-utils';
import { 
  GraphLoadingState, 
  GraphStateHandler, 
  SkeletonLoader 
} from '@/components/IPGraph/GraphLoadingState';

describe('Graph Loading Components', () => {
  describe('SkeletonLoader', () => {
    it('renders skeleton with correct dimensions', () => {
      const { container } = render(
        <SkeletonLoader width={400} height={300} />
      );
      
      // Check SVG dimensions
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '400');
      expect(svg).toHaveAttribute('height', '300');
      
      // Should have circles for nodes
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      
      // Should have lines for connections
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });
    
    it('applies animation classes', () => {
      const { container } = render(
        <SkeletonLoader width={400} height={300} />
      );
      
      // Skeleton elements should have animation classes
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-pulse')).toBeInTheDocument();
    });
  });
  
  describe('GraphLoadingState', () => {
    it('renders loading spinner and message', () => {
      render(<GraphLoadingState height={400} />);
      
      // Should show loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading graph data/i)).toBeInTheDocument();
    });
    
    it('renders custom loading message', () => {
      const customMessage = 'Custom loading message';
      render(<GraphLoadingState height={400} message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
    
    it('adjusts height based on props', () => {
      const { container } = render(<GraphLoadingState height={500} />);
      
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveStyle('height: 500px');
    });
  });
  
  describe('GraphStateHandler', () => {
    it('renders loading state when isLoading is true', () => {
      render(
        <GraphStateHandler isLoading={true} error={null} isEmpty={false} height={400}>
          <div>Content</div>
        </GraphStateHandler>
      );
      
      // Should show loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      // Should not show content
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
    
    it('renders error state when there is an error', () => {
      const errorMessage = 'Test error message';
      render(
        <GraphStateHandler isLoading={false} error={errorMessage} isEmpty={false} height={400}>
          <div>Content</div>
        </GraphStateHandler>
      );
      
      // Should show error message
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      // Should not show content
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
    
    it('renders empty state when isEmpty is true', () => {
      const emptyMessage = 'No data available';
      render(
        <GraphStateHandler isLoading={false} error={null} isEmpty={true} emptyMessage={emptyMessage} height={400}>
          <div>Content</div>
        </GraphStateHandler>
      );
      
      // Should show empty message
      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
      // Should not show content
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
    
    it('renders children when there are no issues', () => {
      render(
        <GraphStateHandler isLoading={false} error={null} isEmpty={false} height={400}>
          <div>Content</div>
        </GraphStateHandler>
      );
      
      // Should show content
      expect(screen.getByText('Content')).toBeInTheDocument();
      // Should not show loading, error, or empty states
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
    
    it('calls onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(
        <GraphStateHandler isLoading={false} error="Error" isEmpty={false} height={400} onRetry={onRetry}>
          <div>Content</div>
        </GraphStateHandler>
      );
      
      // Click retry button
      screen.getByRole('button', { name: /retry/i }).click();
      
      // Should call onRetry
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});