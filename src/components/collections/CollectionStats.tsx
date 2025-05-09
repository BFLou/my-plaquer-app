// src/components/collections/CollectionStats.jsx
import React from 'react';
import { Clock, CheckCircle, User, BrainCircuit } from 'lucide-react';
import { getProfessionStats, getVisitedStats } from '../../utils/collectionStatsUtils';

/**
 * Updated CollectionStats component that calculates statistics based on actual data
 */
export const CollectionStats = ({ 
  collection, 
  plaques, 
  userVisits, 
  className = '' 
}) => {
  // Calculate visit statistics
  const { visitedCount, visitedPercentage } = getVisitedStats(
    collection, 
    plaques, 
    userVisits
  );
  
  // Calculate profession statistics
  const professionStats = getProfessionStats(plaques);
  
  // Format the updated time
  const formatUpdatedText = (dateString) => {
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
            {formatUpdatedText(collection.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionStats;