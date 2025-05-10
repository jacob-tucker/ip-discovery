import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { GraphErrorBoundary, withGraphErrorBoundary } from '@/components/IPGraph/GraphErrorBoundary';

// Mock console.error to avoid printing expected errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ErrorComponent = () => {
  throw new Error('Test error');
  return null;
};

// Component to test HOC
const TestComponent = () => <div>Test Component</div>;
const WrappedTestComponent = withGraphErrorBoundary(TestComponent);

describe('GraphErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <GraphErrorBoundary>
        <div>No error here</div>
      </GraphErrorBoundary>
    );
    
    expect(screen.getByText('No error here')).toBeInTheDocument();
  });
  
  it('renders fallback UI when an error occurs', () => {
    // Suppress React error boundary console logs for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <GraphErrorBoundary>
        <ErrorComponent />
      </GraphErrorBoundary>
    );
    
    // Should show error UI
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
  
  it('shows retry button in fallback UI', () => {
    // Suppress React error boundary console logs for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockReset = jest.fn();
    
    render(
      <GraphErrorBoundary onReset={mockReset}>
        <ErrorComponent />
      </GraphErrorBoundary>
    );
    
    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    
    // Should call onReset
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
  
  it('supports custom fallback render props', () => {
    // Suppress React error boundary console logs for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const customFallback = ({ error, resetErrorBoundary }) => (
      <div>
        <p>Custom error UI: {error.message}</p>
        <button onClick={resetErrorBoundary}>Custom Retry</button>
      </div>
    );
    
    render(
      <GraphErrorBoundary fallbackRender={customFallback}>
        <ErrorComponent />
      </GraphErrorBoundary>
    );
    
    // Should show custom error UI
    expect(screen.getByText(/Custom error UI: Test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom Retry/i })).toBeInTheDocument();
  });
  
  describe('withGraphErrorBoundary HOC', () => {
    it('renders the wrapped component when no error occurs', () => {
      render(<WrappedTestComponent />);
      
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
    
    it('renders error UI when wrapped component throws', () => {
      // Suppress React error boundary console logs for this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make a component that throws wrapped in the HOC
      const ThrowingWrapped = withGraphErrorBoundary(ErrorComponent);
      
      render(<ThrowingWrapped />);
      
      // Should show error UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});