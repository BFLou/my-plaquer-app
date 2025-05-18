// src/components/collections/CollectionStats.tsx
import React from 'react';
import { Clock, CheckCircle, User, BrainCircuit } from 'lucide-react';

type Collection = {
  id: number | string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[];
  updated_at: any; // Can be Date, Timestamp, or string
  is_favorite?: boolean;
};

type Plaque = {
  id: number;
  title: string;
  profession?: string;
  color?: string;
  visited?: boolean;
  [key: string]: any;
};

type Visit = {
  plaque_id: number;
  visited_at: string;
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
    
    // Count plaques with visited=true property
    const visitedByProperty = plaques.filter(plaque => plaque.visited === true).length;
    
    // Also count plaques that exist in userVisits array
    const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
    const visitedInArray = plaques.filter(plaque => 
      visitedPlaqueIds.includes(plaque.id)
    ).length;
    
    // Use the greater of the two counts (should be the same in properly synced state)
    const visitedCount = Math.max(visitedByProperty, visitedInArray);
    
    const visitedPercentage = Math.round((visitedCount / plaques.length) * 100);
    
    // Debug log
    console.log(`Stats: ${visitedCount} visited (${visitedByProperty} by property, ${visitedInArray} in visits array) out of ${plaques.length} (${visitedPercentage}%)`);
    
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
    // If no date value is provided, return 'recently'
    if (!dateString) return 'recently';
    
    try {
      let date: Date;
      
      // Handle different date formats
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else if (dateString && typeof dateString === 'object' && 'toDate' in dateString) {
        // Firebase Timestamp object with toDate method
        date = dateString.toDate();
      } else if (dateString && typeof dateString === 'object' && 'seconds' in dateString) {
        // Firebase server timestamp object with seconds
        date = new Date(dateString.seconds * 1000);
      } else {
        return 'recently';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return 'recently';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Format based on time difference
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      
      const diffInDays = Math.floor(diffInSeconds / 86400);
      if (diffInDays === 1) return 'yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      }
      
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return 'recently';
    }
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