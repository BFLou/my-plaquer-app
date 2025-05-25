// src/components/OptimizedRoute.tsx
import React from 'react';

interface OptimizedRouteProps {
  element: React.ComponentType<any>;
}

export const OptimizedRoute: React.FC<OptimizedRouteProps> = ({ element: Component }) => {
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