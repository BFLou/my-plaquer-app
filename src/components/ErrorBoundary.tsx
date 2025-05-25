// src/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

export class MapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Map error caught by boundary:', error);
    
    // Check if it's a render loop error
    if (error.message.includes('Too many re-renders') || 
        error.message.includes('Maximum update depth exceeded')) {
      console.warn('Render loop detected, attempting recovery');
      return { hasError: true, error, errorCount: 1 };
    }
    
    // Check if it's a map-related error
    if (error.message.includes('Leaflet') || 
        error.message.includes('map') || 
        error.message.includes('L.')) {
      console.warn('Map error caught by boundary:', error);
      return { hasError: true, error, errorCount: 1 };
    }
    
    // For other errors, don't catch them here
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error boundary caught an error:', error, errorInfo);
    
    // Auto-recovery for render loop errors
    if (error.message.includes('Too many re-renders')) {
      console.log('Attempting auto-recovery from render loop...');
      
      // Clear any existing timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
      }
      
      // Reset error state after a delay
      this.resetTimeoutId = setTimeout(() => {
        console.log('Auto-recovering from render loop error...');
        this.setState({ hasError: false, error: undefined, errorCount: 0 });
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const isRenderLoop = this.state.error?.message.includes('Too many re-renders');
      
      if (isRenderLoop) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-orange-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.944-.833-2.714 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Render Loop Detected</h3>
              <p className="text-gray-600 mb-4">
                The app encountered a render loop. Auto-recovery is in progress...
              </p>
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin h-5 w-5 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-600">Recovering...</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.944-.833-2.714 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">
              There was an issue loading the map. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}