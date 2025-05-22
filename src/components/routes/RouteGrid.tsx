// src/components/routes/RouteGrid.tsx
import React from 'react';
import { RouteData } from '@/hooks/useRoutes';
import RouteCard from './RouteCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Route as RouteIcon } from 'lucide-react';

interface RouteGridProps {
  routes: RouteData[];
  selectedRoutes: string[];
  onToggleSelect: (id: string) => void;
  onView: (route: RouteData) => void;
  onEdit: (route: RouteData) => void;
  onDuplicate: (route: RouteData) => void;
  onDelete: (route: RouteData) => void;
  onToggleFavorite?: (route: RouteData) => void;
  isLoading?: boolean;
  onCreateRoute?: () => void;
}

const RouteGrid: React.FC<RouteGridProps> = ({
  routes,
  selectedRoutes,
  onToggleSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  isLoading = false,
  onCreateRoute
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <EmptyState
        icon={RouteIcon}
        title="No routes found"
        description="Start creating routes to explore multiple plaques in one trip"
        actionLabel="Create Your First Route"
        onAction={onCreateRoute}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {routes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          isSelected={selectedRoutes.includes(route.id)}
          onToggleSelect={() => onToggleSelect(route.id)}
          onView={onView}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default RouteGrid;