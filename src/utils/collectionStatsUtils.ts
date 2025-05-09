// src/utils/collectionStatsUtils.js

/**
 * Collection Statistics Utility Functions
 * These functions calculate statistics for collections based on the user_data
 */

// Gets the plaques for a collection from allPlaques using the collection's plaque IDs
export const getCollectionPlaques = (collection, allPlaques) => {
  if (!collection || !collection.plaques || !Array.isArray(collection.plaques)) {
    return [];
  }
  
  return allPlaques.filter(plaque => collection.plaques.includes(plaque.id));
};

// Calculate visited statistics for a collection
export const getVisitedStats = (collection, plaques, userVisits) => {
  if (!collection || !plaques || !userVisits) {
    return { 
      visitedCount: 0, 
      visitedPercentage: 0, 
      hasVisits: false 
    };
  }
  
  // Extract all plaque IDs from visits
  const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
  
  // Count plaques in collection that have been visited
  const visitedCount = plaques.filter(p => visitedPlaqueIds.includes(p.id)).length;
  const visitedPercentage = plaques.length > 0 
    ? Math.round((visitedCount / plaques.length) * 100) 
    : 0;
    
  return {
    visitedCount,
    visitedPercentage,
    hasVisits: visitedCount > 0
  };
};

// Calculate profession statistics for plaques in a collection
export const getProfessionStats = (plaques) => {
  if (!plaques || !Array.isArray(plaques) || plaques.length === 0) {
    return [];
  }
  
  // Count professions
  const professionCounts = {};
  plaques.forEach(plaque => {
    if (plaque.profession) {
      professionCounts[plaque.profession] = (professionCounts[plaque.profession] || 0) + 1;
    }
  });
  
  // Convert to array and sort by count (descending)
  const topProfessions = Object.entries(professionCounts)
    .map(([profession, count]) => ({ profession, count }))
    .sort((a, b) => b.count - a.count);
    
  return topProfessions;
};

// Calculate color statistics for plaques in a collection
export const getColorStats = (plaques) => {
  if (!plaques || !Array.isArray(plaques) || plaques.length === 0) {
    return [];
  }
  
  // Count colors
  const colorCounts = {};
  plaques.forEach(plaque => {
    const color = plaque.color || plaque.colour || 'unknown';
    if (color !== 'unknown') {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  });
  
  // Convert to array and sort by count (descending)
  const colorStats = Object.entries(colorCounts)
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);
    
  return colorStats;
};

// Format an ISO date into a readable "time ago" string
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
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

// Get comprehensive stats for a single collection
export const getCollectionStats = (collection, allPlaques, userVisits) => {
  if (!collection) return null;
  
  // Get plaques for this collection
  const plaques = getCollectionPlaques(collection, allPlaques);
  
  // Get visit statistics
  const visitStats = getVisitedStats(collection, plaques, userVisits);
  
  // Get profession statistics
  const professionStats = getProfessionStats(plaques);
  
  // Get color statistics
  const colorStats = getColorStats(plaques);
  
  // Calculate updated time
  const updatedTimeAgo = formatTimeAgo(collection.updated_at);
  
  // Return comprehensive stats object
  return {
    id: collection.id,
    name: collection.name,
    plaqueCount: plaques.length,
    visitedCount: visitStats.visitedCount,
    visitedPercentage: visitStats.visitedPercentage,
    hasVisits: visitStats.hasVisits,
    topProfessions: professionStats.slice(0, 3),
    colors: colorStats,
    updatedTimeAgo,
    plaques
  };
};

// Get stats for all collections
export const getAllCollectionsStats = (collections, allPlaques, userVisits) => {
  if (!collections || !Array.isArray(collections)) return [];
  
  return collections.map(collection => 
    getCollectionStats(collection, allPlaques, userVisits)
  );
};