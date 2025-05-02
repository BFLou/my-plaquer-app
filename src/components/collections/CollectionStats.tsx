import React from 'react';
import { type Collection } from './CollectionCard';
import { type Plaque } from '../plaques/PlaqueCard';

type CollectionStatsProps = {
  collection: Collection;
  plaques: Plaque[];
  className?: string;
};

export const CollectionStats = ({ collection, plaques, className = '' }: CollectionStatsProps) => {
  // Calculate stats
  const visitedCount = plaques.filter(p => p.visited).length;
  const visitedPercentage = plaques.length > 0 ? Math.round((visitedCount / plaques.length) * 100) : 0;
  
  const professions: Record<string, number> = {};
  plaques.forEach(plaque => {
    professions[plaque.profession] = (professions[plaque.profession] || 0) + 1;
  });
  
  // Sort professions by count
  const topProfessions = Object.entries(professions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="font-medium mb-3">Collection Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Total Plaques</div>
          <div className="text-2xl font-bold">{plaques.length}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Visited</div>
          <div className="text-2xl font-bold">{visitedCount} <span className="text-sm font-normal text-gray-500">({visitedPercentage}%)</span></div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Top Professions</div>
          <div className="text-sm font-medium">
            {topProfessions.length > 0 ? (
              topProfessions.map(([profession, count], index) => (
                <div key={profession} className="flex justify-between items-center">
                  <span>{profession}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Last Update</div>
          <div className="text-sm font-medium">{collection.updated}</div>
        </div>
      </div>
    </div>
  );
};

export default CollectionStats;