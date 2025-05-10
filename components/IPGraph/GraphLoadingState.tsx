'use client';

import React from 'react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import ErrorFallback from './ErrorFallback';
import { SkeletonLoader } from './SkeletonLoader';

interface GraphLoadingStateProps {
  showMessage?: boolean;
  height?: string | number;
  text?: string;
  useSkeleton?: boolean;
}

/**
 * Loading state component for graph visualization
 * Displays a loading spinner or skeleton and optional message
 */
export const GraphLoadingState: React.FC<GraphLoadingStateProps> = ({ 
  showMessage = true,
  height = 400,
  text = 'Loading Derivative Galaxy...',
  useSkeleton = true
}) => {
  const { viewPreferences } = useGraphFilters();
  const isDarkMode = viewPreferences?.darkMode || false;
  
  if (useSkeleton) {
    return (
      <SkeletonLoader 
        height={height} 
        showText={showMessage} 
        text={text} 
      />
    );
  }
  
  return (
    <div 
      className="flex flex-col items-center justify-center space-y-4"
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.05)' : 'rgba(248, 250, 252, 0.5)',
        borderRadius: '0.5rem'
      }}
    >
      <div className="h-10 w-10 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin" />
      
      {showMessage && (
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {text}
        </p>
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
  useSkeleton?: boolean;
}> = ({ 
  children, 
  isLoading: isLoadingProp, 
  height = 400,
  useSkeleton = true
}) => {
  // Use either the provided loading state or get it from the global store
  const { isLoading } = useGraphFilters();
  const shouldShowLoading = isLoadingProp !== undefined ? isLoadingProp : isLoading;

  if (shouldShowLoading) {
    return <GraphLoadingState height={height} useSkeleton={useSkeleton} />;
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
  onRetry?: () => void;
  errorDetails?: Error;
}> = ({ 
  children, 
  isLoading: isLoadingProp, 
  error: errorProp, 
  isEmpty = false,
  emptyMessage = 'No graph data available',
  height = 400,
  onRetry,
  errorDetails
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
      <ErrorFallback 
        error={errorDetails || new Error(error)}
        message={error}
        retry={onRetry}
        className="w-full"
        showDetails={process.env.NODE_ENV !== 'production'}
      />
    );
  }

  if (isEmpty) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
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
        <p className="text-sm text-center max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};