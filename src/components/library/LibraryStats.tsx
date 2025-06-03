// src/components/library/LibraryStats.tsx
import React from 'react';
import { 
  FolderOpen, 
  Route as RouteIcon, 
  MapPin, 
  TrendingUp, 
  Clock,
  Target
} from 'lucide-react';

interface LibraryStatsProps {
  totalCollections: number;
  totalRoutes: number;
  totalVisits: number;
  uniquePlaquesVisited: number;
  totalPlaquesInCollections: number;
  totalRouteDistance: number;
  className?: string;
}

const LibraryStats: React.FC<LibraryStatsProps> = ({
  totalCollections,
  totalRoutes,
  totalVisits,
  uniquePlaquesVisited,
  totalPlaquesInCollections,
  totalRouteDistance,
  className = ''
}) => {
  const stats = [
    {
      icon: FolderOpen,
      value: totalCollections,
      label: 'Collections',
      color: 'purple'
    },
    {
      icon: Target,
      value: totalPlaquesInCollections,
      label: 'Collected',
      color: 'blue'
    },
    {
      icon: RouteIcon,
      value: totalRoutes,
      label: 'Routes',
      color: 'green'
    },
    {
      icon: TrendingUp,
      value: `${totalRouteDistance.toFixed(1)}km`,
      label: 'Planned',
      color: 'amber'
    },
    {
      icon: Clock,
      value: totalVisits,
      label: 'Visits',
      color: 'red'
    },
    {
      icon: MapPin,
      value: uniquePlaquesVisited,
      label: 'Unique',
      color: 'indigo'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      {/* Mobile: 2 columns, Tablet: 3 columns, Desktop: 6 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`bg-${stat.color}-100 text-${stat.color}-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div className={`text-base sm:text-lg font-bold text-${stat.color}-600`}>
                {typeof stat.value === 'string' ? stat.value : stat.value}
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryStats;