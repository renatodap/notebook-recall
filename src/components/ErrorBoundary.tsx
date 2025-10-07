'use client';

import { type ErrorInfo } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const router = useRouter();

  // Determine error type and provide user-friendly message
  const getErrorMessage = (error: Error): { title: string; message: string; action: string } => {
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      return {
        title: 'Too Many Requests',
        message: 'The service is experiencing high demand. Please wait a moment and try again.',
        action: 'Retry in a moment'
      };
    }

    if (errorMsg.includes('503') || errorMsg.includes('service unavailable')) {
      return {
        title: 'Service Temporarily Unavailable',
        message: 'The AI service is temporarily unavailable. This is usually brief. Please try again in a few seconds.',
        action: 'Retry now'
      };
    }

    if (errorMsg.includes('network') || errorMsg.includes('fetch failed')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry connection'
      };
    }

    if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
      return {
        title: 'Authentication Error',
        message: 'Your session may have expired. Please sign in again.',
        action: 'Go to login'
      };
    }

    if (errorMsg.includes('400') || errorMsg.includes('validation')) {
      return {
        title: 'Invalid Input',
        message: 'The data provided could not be processed. Please check your input and try again.',
        action: 'Try again'
      };
    }

    // Default generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. This has been logged and we\'ll look into it.',
      action: 'Try again'
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </h2>
        </div>

        <p className="text-sm text-gray-600">
          {errorInfo.message}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label={errorInfo.action}
          >
            {errorInfo.action}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            aria-label="Go to dashboard"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleError = (error: Error, info: ErrorInfo) => {
    // Log to error reporting service (Sentry, etc.)
    console.error('Error caught by boundary:', error, info);

    // Send to error tracking service (dynamic import to avoid build issues)
    if (typeof window !== 'undefined') {
      import('@/lib/error-tracking').then(({ trackError }) => {
        trackError(error, {
          tags: {
            errorBoundary: 'react',
            componentStack: info.componentStack?.split('\n')[0] || 'unknown'
          },
          extra: {
            componentStack: info.componentStack,
            errorInfo: info
          }
        });
      }).catch(console.error);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Reset app state if needed
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
