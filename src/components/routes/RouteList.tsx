// src/components/routes/RouteList.tsx
import React from 'react';
import { RouteData } from '@/hooks/useRoutes';
import RouteListItem from './RouteListItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Route as RouteIcon } from 'lucide-react';

interface RouteListProps {
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

const RouteList: React.FC<RouteListProps> = ({
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
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
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
    <div className="space-y-3">
      {routes.map((route) => (
        <RouteListItem
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

export default RouteList;