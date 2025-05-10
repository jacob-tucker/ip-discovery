'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Context provider for passing error information to functional components
 */
const ErrorContext = React.createContext<{ error: Error | null }>({ error: null });

/**
 * Hook to access error information from within the error boundary
 */
export const useGraphError = () => React.useContext(ErrorContext);

/**
 * Error boundary component for graph visualization
 * Catches errors in graph components and displays a fallback UI
 */
export class GraphErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Graph component error:', error, errorInfo);
  }

  componentDidMount(): void {
    // Reset error state in the global store
    const setError = useGraphFilters.getState().setError;
    setError(null);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    // Update global error state when local state changes
    if (prevState.error !== this.state.error) {
      const setError = useGraphFilters.getState().setError;
      setError(this.state.error?.message || null);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Provide error context to descendants
      return (
        <ErrorContext.Provider value={{ error: this.state.error }}>
          {this.props.fallback || <DefaultErrorFallback error={this.state.error} />}
        </ErrorContext.Provider>
      );
    }

    // Normal rendering when there's no error
    return (
      <ErrorContext.Provider value={{ error: null }}>
        {this.props.children}
      </ErrorContext.Provider>
    );
  }
}

/**
 * Default fallback component displayed when an error occurs
 */
const DefaultErrorFallback = ({ error }: { error: Error | null }) => {
  const { setError } = useGraphFilters();
  const resetError = () => {
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 text-red-800 min-h-[400px]">
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        width="48" 
        height="48" 
        viewBox="0 0 24 24" 
        fill="none"
        className="mb-4 text-red-600"
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 className="text-lg font-medium mb-2">Graph Visualization Error</h3>
      <p className="text-sm mb-4 text-center max-w-md">
        {error?.message || 'An error occurred while rendering the derivative galaxy graph.'}
      </p>
      <div className="space-y-2">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

/**
 * Higher-order component to wrap a component with the error boundary
 */
export function withGraphErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return (props: P) => (
    <GraphErrorBoundary fallback={fallback}>
      <Component {...props} />
    </GraphErrorBoundary>
  );
}