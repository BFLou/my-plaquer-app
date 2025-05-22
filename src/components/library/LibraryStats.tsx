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
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Collections */}
        <div className="text-center">
          <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <FolderOpen size={20} />
          </div>
          <div className="text-lg font-bold text-purple-600">{totalCollections}</div>
          <div className="text-xs text-gray-500">Collections</div>
        </div>

        {/* Plaques in Collections */}
        <div className="text-center">
          <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target size={20} />
          </div>
          <div className="text-lg font-bold text-blue-600">{totalPlaquesInCollections}</div>
          <div className="text-xs text-gray-500">Collected</div>
        </div>

        {/* Routes */}
        <div className="text-center">
          <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <RouteIcon size={20} />
          </div>
          <div className="text-lg font-bold text-green-600">{totalRoutes}</div>
          <div className="text-xs text-gray-500">Routes</div>
        </div>

        {/* Route Distance */}
        <div className="text-center">
          <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={20} />
          </div>
          <div className="text-lg font-bold text-amber-600">{totalRouteDistance.toFixed(1)}</div>
          <div className="text-xs text-gray-500">km Planned</div>
        </div>

        {/* Visits */}
        <div className="text-center">
          <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock size={20} />
          </div>
          <div className="text-lg font-bold text-red-600">{totalVisits}</div>
          <div className="text-xs text-gray-500">Visits</div>
        </div>

        {/* Unique Plaques Visited */}
        <div className="text-center">
          <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <MapPin size={20} />
          </div>
          <div className="text-lg font-bold text-indigo-600">{uniquePlaquesVisited}</div>
          <div className="text-xs text-gray-500">Unique Visits</div>
        </div>
      </div>
    </div>
  );
};

export default LibraryStats;