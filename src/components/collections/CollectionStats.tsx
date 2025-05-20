// src/components/collections/CollectionStats.jsx
import React from 'react';
import { Clock, CheckCircle, User, BrainCircuit, MapPin, Star } from 'lucide-react';
import { capitalizeWords } from '@/utils/stringUtils';

export const CollectionStats = ({ 
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
    
    return { visitedCount, visitedPercentage };
  };
  
  // Calculate profession statistics
  const getProfessionStats = () => {
    if (!plaques.length) return [];
    
    const professionCounts = {};
    
    plaques.forEach(plaque => {
      if (!plaque.profession) {
        professionCounts['Unknown'] = (professionCounts['Unknown'] || 0) + 1;
        return;
      }
      
      // Capitalize the profession before adding to counts
      const capitalizedProfession = capitalizeWords(plaque.profession);
      professionCounts[capitalizedProfession] = (professionCounts[capitalizedProfession] || 0) + 1;
    });
    
    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);
  };
  
  // Calculate color statistics
  const getColorStats = () => {
    if (!plaques.length) return [];
    
    const colorCounts = {};
    
    plaques.forEach(plaque => {
      if (!plaque.color) {
        colorCounts['Unknown'] = (colorCounts['Unknown'] || 0) + 1;
        return;
      }
      
      // Capitalize the color before adding to counts
      const capitalizedColor = capitalizeWords(plaque.color);
      colorCounts[capitalizedColor] = (colorCounts[capitalizedColor] || 0) + 1;
    });
    
    return Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get area/location statistics
  const getAreaStats = () => {
    if (!plaques.length) return [];
    
    const areaCounts = {};
    
    plaques.forEach(plaque => {
      let area = plaque.area || plaque.postcode || 'Unknown';
      
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });
    
    return Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get stats
  const { visitedCount, visitedPercentage } = getVisitedStats();
  const professionStats = getProfessionStats();
  const colorStats = getColorStats();
  const areaStats = getAreaStats();
  
  return (
    <div className={`${className}`}>
      <h3 className="font-medium text-lg mb-4">Collection Stats</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Plaques */}
        <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center">
          <div className="p-3 bg-blue-100 rounded-full mb-2">
            <MapPin className="text-blue-600" size={24} />
          </div>
          <div className="text-2xl font-bold text-blue-600">{plaques.length}</div>
          <div className="text-blue-700 text-sm">Total Plaques</div>
        </div>
        
        {/* Visited */}
        <div className="bg-green-50 p-4 rounded-lg flex flex-col items-center">
          <div className="p-3 bg-green-100 rounded-full mb-2">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {visitedCount} 
            <span className="text-sm font-normal text-green-500 ml-1">
              ({visitedPercentage}%)
            </span>
          </div>
          <div className="text-green-700 text-sm">Visited</div>
        </div>
        
        {/* Most Common Profession */}
        <div className="bg-purple-50 p-4 rounded-lg flex flex-col items-center">
          <div className="p-3 bg-purple-100 rounded-full mb-2">
            <User className="text-purple-600" size={24} />
          </div>
          <div className="text-lg font-bold text-purple-600 text-center truncate max-w-full">
            {professionStats.length > 0 ? professionStats[0].profession : 'None'}
          </div>
          <div className="text-purple-700 text-sm">Top Profession</div>
        </div>
        
        {/* Most Common Color */}
        <div className="bg-amber-50 p-4 rounded-lg flex flex-col items-center">
          <div className="p-3 bg-amber-100 rounded-full mb-2">
            <Star className="text-amber-600" size={24} />
          </div>
          <div className="text-lg font-bold text-amber-600 text-center truncate max-w-full">
            {colorStats.length > 0 ? colorStats[0].color : 'None'}
          </div>
          <div className="text-amber-700 text-sm">Most Common Color</div>
        </div>
      </div>
      
      {/* Additional stats in expandable sections */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Professions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="font-medium mb-3">Top Professions</h4>
          {professionStats.length > 0 ? (
            <div className="space-y-2">
              {professionStats.slice(0, 5).map(({ profession, count }, index) => (
                <div key={profession || index} className="flex justify-between items-center text-sm">
                  <span className="truncate">{profession || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${(count / plaques.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No profession data available</p>
          )}
        </div>
        
        {/* Locations */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="font-medium mb-3">Locations</h4>
          {areaStats.length > 0 ? (
            <div className="space-y-2">
              {areaStats.slice(0, 5).map(({ area, count }, index) => (
                <div key={area || index} className="flex justify-between items-center text-sm">
                  <span className="truncate">{area || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(count / plaques.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No location data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionStats;