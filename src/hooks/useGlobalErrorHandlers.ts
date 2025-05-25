// src/hooks/useGlobalErrorHandlers.ts
import { useEffect } from 'react';

export const useGlobalErrorHandlers = () => {
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
      
      // Handle render loop errors
      if (event.reason?.message?.includes('Too many re-renders')) {
        console.warn('Render loop promise rejection caught:', event.reason);
        event.preventDefault();
        // Force page reload after a delay
        setTimeout(() => {
          console.log('Forcing page reload due to persistent render loop...');
          window.location.reload();
        }, 3000);
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
      
      // Handle render loop errors
      if (event.error?.message?.includes('Too many re-renders')) {
        console.warn('Render loop error caught:', event.error);
        event.preventDefault();
        // Force page reload after a delay
        setTimeout(() => {
          console.log('Forcing page reload due to persistent render loop...');
          window.location.reload();
        }, 3000);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Performance optimization: Preload critical resources
    const preloadCriticalResources = () => {
      try {
        // Preload Leaflet CSS and JS
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'prefetch';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);

        const leafletJS = document.createElement('link');
        leafletJS.rel = 'prefetch';
        leafletJS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(leafletJS);
      } catch (error) {
        console.warn('Error preloading resources:', error);
      }
    };

    // Preload after a short delay to not block initial rendering
    setTimeout(preloadCriticalResources, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
};