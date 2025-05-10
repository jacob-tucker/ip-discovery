'use client';

import React from 'react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';

interface GraphLoadingStateProps {
  showMessage?: boolean;
  height?: string | number;
  text?: string;
}

/**
 * Loading state component for graph visualization
 * Displays a loading spinner and optional message
 */
export const GraphLoadingState: React.FC<GraphLoadingStateProps> = ({ 
  showMessage = true,
  height = 400,
  text = 'Loading Derivative Galaxy...'
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center space-y-4"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      {showMessage && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
};

/**
 * Conditional loading wrapper component
 * Shows loading state when isLoading is true, otherwise renders children
 */
export const GraphLoadingWrapper: React.FC<{
  children: React.ReactNode;
  isLoading?: boolean; // Optional override for the loading state
  height?: string | number;
}> = ({ children, isLoading: isLoadingProp, height = 400 }) => {
  // Use either the provided loading state or get it from the global store
  const { isLoading } = useGraphFilters();
  const shouldShowLoading = isLoadingProp !== undefined ? isLoadingProp : isLoading;

  if (shouldShowLoading) {
    return <GraphLoadingState height={height} />;
  }

  return <>{children}</>;
};

/**
 * Handles different states for the graph (loading, error, empty)
 */
export const GraphStateHandler: React.FC<{
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: string | number;
}> = ({ 
  children, 
  isLoading: isLoadingProp, 
  error: errorProp, 
  isEmpty = false,
  emptyMessage = 'No graph data available',
  height = 400 
}) => {
  // Get states from the store if not provided as props
  const { isLoading: storeLoading, error: storeError } = useGraphFilters();
  
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : storeLoading;
  const error = errorProp !== undefined ? errorProp : storeError;

  if (isLoading) {
    return <GraphLoadingState height={height} />;
  }

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 text-red-800"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="24" 
          height="24" 
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
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none"
          className="mb-4 text-gray-400"
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        <p className="text-sm text-center">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};