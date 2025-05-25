// src/App.tsx - Enhanced with smooth map behavior and improved routing
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import LibraryPage from './pages/LibraryPage';
import CollectionsPage from './pages/Collections';
import CollectionDetailPage from './pages/CollectionDetail';
import RoutesManagementPage from './pages/RoutesManagementPage';
import RouteDetailPage from './pages/RouteDetailPage';
import VisitsPage from './pages/VisitsPage';
import Discover from './pages/Discover';
import Home from './pages/Home';
import About from './pages/About';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import RequireAuth from './components/auth/RequireAuth';
import { Toaster } from 'sonner';

// Enhanced scroll restoration for better navigation experience
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only scroll to top for new page navigations, not for URL parameter changes
    const isParameterChange = location.search.includes('view=') || 
                             location.search.includes('search=') ||
                             location.search.includes('colors=') ||
                             location.search.includes('postcodes=');
    
    if (!isParameterChange) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);
  
  return null;
};

// Enhanced error boundary for map-related errors
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's a map-related error
    if (error.message.includes('Leaflet') || 
        error.message.includes('map') || 
        error.message.includes('L.')) {
      console.warn('Map error caught by boundary:', error);
      return { hasError: true, error };
    }
    
    // Re-throw non-map errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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

// Performance optimization for route transitions
const OptimizedRoute: React.FC<{ element: React.ComponentType<any> }> = ({ element: Component }) => {
  return (
    <React.Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <Component />
    </React.Suspense>
  );
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      
      {/* Enhanced Discover route with map error boundary */}
      <Route 
        path="/discover" 
        element={
          <MapErrorBoundary>
            <Discover />
          </MapErrorBoundary>
        } 
      />
      
      {/* Library routes - Main landing page */}
      <Route path="/library" element={
        <RequireAuth>
          <OptimizedRoute element={LibraryPage} />
        </RequireAuth>
      } />
      
      {/* Collections routes under Library */}
      <Route path="/library/collections" element={
        <RequireAuth>
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/collections/:id" element={
        <RequireAuth>
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Routes management under Library */}
      <Route path="/library/routes" element={
        <RequireAuth>
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/routes/:id" element={
        <RequireAuth>
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Visits under Library */}
      <Route path="/library/visits" element={
        <RequireAuth>
          <OptimizedRoute element={VisitsPage} />
        </RequireAuth>
      } />
      
      {/* Legacy redirects for backward compatibility */}
      <Route path="/collections" element={
        <RequireAuth>
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/collections/:id" element={
        <RequireAuth>
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      <Route path="/routes" element={
        <RequireAuth>
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/routes/:id" element={
        <RequireAuth>
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Profile routes */}
      <Route path="/profile" element={
        <RequireAuth>
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      <Route path="/profile/:tab" element={
        <RequireAuth>
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      {/* Settings routes */}
      <Route path="/settings" element={
        <RequireAuth>
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      <Route path="/settings/:tab" element={
        <RequireAuth>
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      {/* 404 Not Found route */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.582-5.17-3.74M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Page Not Found</h3>
            <p className="text-gray-600 mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors inline-block"
            >
              Go Home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
};

// Enhanced App Component with Global State Management
function App() {
  // Global app initialization
  useEffect(() => {
    // Set up global error handlers for better debugging
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Handle specific map-related errors
      if (event.reason?.message?.includes('Leaflet') || 
          event.reason?.message?.includes('map')) {
        console.warn('Map-related promise rejection caught:', event.reason);
        event.preventDefault(); // Prevent the default browser behavior
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      
      // Handle specific map-related errors
      if (event.error?.message?.includes('Leaflet') || 
          event.error?.message?.includes('map')) {
        console.warn('Map-related error caught:', event.error);
        event.preventDefault(); // Prevent the default browser behavior
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Performance optimization: Preload critical resources
    const preloadCriticalResources = () => {
      // Preload Leaflet CSS and JS
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'prefetch';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('link');
      leafletJS.rel = 'prefetch';
      leafletJS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(leafletJS);
    };

    // Preload after a short delay to not block initial rendering
    setTimeout(preloadCriticalResources, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Enhanced Toaster configuration
  const toasterConfig = {
    position: 'bottom-right' as const,
    expand: true,
    richColors: true,
    closeButton: true,
    duration: 4000,
    style: {
      fontSize: '14px',
    },
    toastOptions: {
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      className: 'custom-toast',
    },
  };

  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          {/* Global scroll restoration */}
          <ScrollToTop />
          
          {/* Main application routes */}
          <AppRoutes />
          
          {/* Enhanced toast notifications */}
          <Toaster {...toasterConfig} />
          
          {/* Performance monitoring in development */}
          {process.env.NODE_ENV === 'development' && (
            <div 
              id="performance-monitor" 
              style={{ 
                position: 'fixed', 
                bottom: '10px', 
                left: '10px', 
                zIndex: 9999,
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                display: 'none'
              }}
            />
          )}
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

// Development-only performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Monitor navigation performance
  const observer = new PerformanceObserver((list) => {
    const monitor = document.getElementById('performance-monitor');
    if (monitor) {
      const entries = list.getEntries();
      const navigation = entries.find(entry => entry.entryType === 'navigation') as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = Math.round(navigation.loadEventEnd - navigation.navigationStart);
        monitor.textContent = `Load: ${loadTime}ms`;
        monitor.style.display = loadTime > 2000 ? 'block' : 'none'; // Show if slow
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    console.warn('Performance observer not supported');
  }
}

export default App;