// src/components/collections/CollectionStats.tsx
import React from 'react';
import { Clock, CheckCircle, User, BrainCircuit } from 'lucide-react';

type Collection = {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[] | number;
  updated_at: string;
  is_favorite?: boolean;
};

type Plaque = {
  id: number;
  title: string;
  profession?: string;
  color?: string;
  visited?: boolean;
  location?: string;
  address?: string;
  inscription?: string;
  image?: string;
  [key: string]: any;
};

type Visit = {
  plaque_id: number;
  visited_at: string;
  notes?: string;
  location?: any;
  [key: string]: any;
};

type CollectionStatsProps = {
  collection: Collection;
  plaques: Plaque[];
  userVisits: Visit[];
  className?: string;
};

/**
 * CollectionStats component displays various statistics about a collection
 */
export const CollectionStats: React.FC<CollectionStatsProps> = ({ 
  collection, 
  plaques, 
  userVisits, 
  className = '' 
}) => {
  // Calculate visit statistics
  const getVisitedStats = () => {
    if (!plaques.length) return { visitedCount: 0, visitedPercentage: 0 };
    
    const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
    const visitedCount = plaques.filter(plaque => 
      plaque.visited || visitedPlaqueIds.includes(plaque.id)
    ).length;
    
    const visitedPercentage = Math.round((visitedCount / plaques.length) * 100);
    
    return { visitedCount, visitedPercentage };
  };
  
  // Calculate profession statistics
  const getProfessionStats = () => {
    if (!plaques.length) return [];
    
    const professionCounts: Record<string, number> = {};
    
    plaques.forEach(plaque => {
      if (!plaque.profession) {
        professionCounts['Unknown'] = (professionCounts['Unknown'] || 0) + 1;
        return;
      }
      
      professionCounts[plaque.profession] = (professionCounts[plaque.profession] || 0) + 1;
    });
    
    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);
  };
  
  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  };

  // Get stats
  const { visitedCount, visitedPercentage } = getVisitedStats();
  const professionStats = getProfessionStats();
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="font-medium mb-3">Collection Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Plaques */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Total Plaques</div>
          <div className="text-2xl font-bold">{plaques.length}</div>
        </div>
        
        {/* Visited */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Visited</div>
          <div className="text-2xl font-bold">
            {visitedCount} 
            <span className="text-sm font-normal text-gray-500 ml-1">
              ({visitedPercentage}%)
            </span>
          </div>
        </div>
        
        {/* Top Professions */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Top Professions</div>
          <div className="text-sm font-medium">
            {professionStats.length > 0 ? (
              professionStats.slice(0, 3).map(({ profession, count }, index) => (
                <div key={profession || index} className="flex justify-between items-center">
                  <span>{profession || 'Unknown'}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
        
        {/* Last Update */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Last Update</div>
          <div className="text-sm font-medium">
            {formatTimeAgo(collection.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionStats;