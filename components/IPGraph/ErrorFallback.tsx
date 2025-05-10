'use client';

import React from 'react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { StoryProtocolErrorType } from '@/lib/api/story-protocol';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  retry?: () => void;
  errorType?: string;
  title?: string;
  message?: string;
  showDetails?: boolean;
  className?: string;
}

/**
 * Error fallback component that displays different error messages based on error type
 * and provides helpful actions like retry or reset
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retry,
  errorType,
  title,
  message,
  showDetails = false,
  className = ''
}) => {
  // Access error state from global store if not provided directly
  const { error: storeError, setError } = useGraphFilters();
  const actualError = error || storeError;
  
  // Determine error details
  const resolvedTitle = title || getErrorTitle(actualError, errorType);
  const resolvedMessage = message || getErrorMessage(actualError, errorType);

  // Handle retry action
  const handleRetry = () => {
    if (retry) {
      retry();
    } else {
      // If no retry function is provided, refresh the page
      window.location.reload();
    }
  };

  // Handle dismiss/reset action
  const handleReset = () => {
    if (resetError) {
      resetError();
    } else if (setError) {
      setError(null);
    }
  };

  return (
    <div 
      className={`relative rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm overflow-hidden dark:bg-red-950 dark:border-red-900 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Background pattern for visual interest */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="error-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 15L15 0M15 30L30 15" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#error-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-4 text-center">
        {/* Error icon */}
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900 dark:text-red-200">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Error title */}
        <h3 className="mb-1 text-base font-medium text-red-800 dark:text-red-200">
          {resolvedTitle}
        </h3>

        {/* Error message */}
        <p className="mb-4 max-w-md text-sm text-red-600 dark:text-red-300">
          {resolvedMessage}
        </p>

        {/* Action buttons */}
        <div className="flex space-x-3">
          {retry && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="mr-2 -ml-1 h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Try Again
            </button>
          )}
          <button
            onClick={handleReset}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors dark:bg-transparent dark:text-red-200 dark:border-red-700 dark:hover:bg-red-900"
          >
            Dismiss
          </button>
        </div>

        {/* Error details (only show if requested) */}
        {showDetails && actualError && (
          <div className="mt-4 max-w-full overflow-auto rounded border border-red-200 bg-white p-3 text-left text-xs font-mono text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200">
            <p className="whitespace-pre-wrap break-words">
              {actualError.stack || actualError.message || String(actualError)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Gets an appropriate error title based on the error type
 */
function getErrorTitle(error: Error | null | undefined, errorType?: string): string {
  if (!error) return 'Something went wrong';

  // Check for Story Protocol specific error types
  if (error.name === 'StoryProtocolError') {
    // Use errorType from the StoryProtocolError
    const specificType = (error as any).type as StoryProtocolErrorType;
    
    switch (specificType) {
      case 'network_error':
        return 'Network Error';
      case 'timeout_error':
        return 'Request Timeout';
      case 'rate_limit_error':
        return 'Rate Limit Exceeded';
      case 'api_error':
        return 'API Error';
      case 'data_error':
        return 'Data Error';
      default:
        return 'Story Protocol Error';
    }
  }

  // Handle custom error type string
  if (errorType) {
    switch (errorType.toLowerCase()) {
      case 'network':
        return 'Network Error';
      case 'timeout':
        return 'Request Timeout';
      case 'auth':
        return 'Authentication Error';
      case 'permission':
        return 'Permission Denied';
      case 'notfound':
        return 'Not Found';
      case 'data':
        return 'Data Error';
      case 'validation':
        return 'Validation Error';
      default:
        return errorType;
    }
  }

  // Handle standard error names
  switch (error.name) {
    case 'SyntaxError':
      return 'Data Parse Error';
    case 'TypeError':
      return 'Type Error';
    case 'ReferenceError':
      return 'Reference Error';
    case 'RangeError':
      return 'Range Error';
    case 'URIError':
      return 'URI Error';
    case 'EvalError':
      return 'Eval Error';
    default:
      return 'Unexpected Error';
  }
}

/**
 * Gets an appropriate error message based on the error type
 */
function getErrorMessage(error: Error | null | undefined, errorType?: string): string {
  if (!error) return 'An unexpected error occurred. Please try again later.';

  // For Story Protocol errors
  if (error.name === 'StoryProtocolError') {
    const specificType = (error as any).type as StoryProtocolErrorType;
    
    switch (specificType) {
      case 'network_error':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'timeout_error':
        return 'The request took too long to complete. This might be due to network issues or the server is busy.';
      case 'rate_limit_error':
        return 'You have made too many requests. Please wait a moment before trying again.';
      case 'api_error':
        return 'The server encountered an error while processing your request. Our team has been notified.';
      case 'data_error':
        return 'There was an issue with the data received from the server. Please try again.';
      default:
        return error.message || 'An error occurred while communicating with Story Protocol.';
    }
  }

  // For specific error types
  if (errorType) {
    switch (errorType.toLowerCase()) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'timeout':
        return 'The request took too long to complete. Please try again later.';
      case 'auth':
        return 'You need to be authenticated to access this feature. Please sign in and try again.';
      case 'permission':
        return 'You do not have permission to access this resource.';
      case 'notfound':
        return 'The requested resource could not be found. It may have been removed or doesn\'t exist.';
      case 'data':
        return 'There was an issue with the data. Please try again or contact support if the problem persists.';
      case 'validation':
        return 'Some of the provided information is invalid. Please check your inputs and try again.';
    }
  }

  // For general errors, use the error message or a fallback
  return error.message || 'An unexpected error occurred. Please try again later.';
}

export default ErrorFallback;