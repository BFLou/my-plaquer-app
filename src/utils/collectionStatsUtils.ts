// src/utils/collectionStatsUtils.js

/**
 * Format a date string to a relative time string (e.g. "2 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted relative time
 */
export const formatTimeAgo = (dateString) => {
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

/**
 * Get statistics for a single collection
 * @param {object} collection - Collection object
 * @param {array} allPlaques - Array of all plaques
 * @param {array} userVisits - Array of user visit records
 * @returns {object} - Collection with added statistics
 */
export const getCollectionStats = (collection, allPlaques, userVisits) => {
  // Get plaques for this collection
  const collectionPlaqueIds = collection.plaques || [];
  const collectionPlaques = allPlaques.filter(plaque => 
    collectionPlaqueIds.includes(plaque.id)
  );
  
  // Get visit statistics for this collection
  const { visitedCount, visitedPercentage } = getVisitedStats(
    collection, 
    collectionPlaques, 
    userVisits
  );
  
  // Get profession statistics for this collection
  const professionStats = getProfessionStats(collectionPlaques);
  
  // Return enhanced collection with stats
  return {
    ...collection,
    plaqueCount: collectionPlaqueIds.length,
    visitedCount,
    visitedPercentage,
    professionStats
  };
};

/**
 * Get visit statistics for a collection
 * @param {object} collection - Collection object
 * @param {array} plaques - Array of plaques in the collection
 * @param {array} userVisits - Array of user visit records
 * @returns {object} - Visit statistics
 */
export const getVisitedStats = (collection, plaques, userVisits) => {
  // Default return if no plaques or visits
  if (!plaques || plaques.length === 0) {
    return { visitedCount: 0, visitedPercentage: 0 };
  }
  
  // Get visited plaque IDs from user visits
  const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
  
  // Count visited plaques in this collection
  const visitedCount = plaques.filter(plaque => 
    visitedPlaqueIds.includes(plaque.id)
  ).length;
  
  // Calculate percentage (avoid division by zero)
  const visitedPercentage = plaques.length > 0 
    ? Math.round((visitedCount / plaques.length) * 100) 
    : 0;
  
  return { visitedCount, visitedPercentage };
};

/**
 * Get profession statistics for plaques
 * @param {array} plaques - Array of plaque objects
 * @returns {array} - Array of profession counts
 */
export const getProfessionStats = (plaques) => {
  if (!plaques || plaques.length === 0) return [];
  
  // Count occurrences of each profession
  const professionCounts = plaques.reduce((counts, plaque) => {
    const profession = plaque.profession || 'Unknown';
    counts[profession] = (counts[profession] || 0) + 1;
    return counts;
  }, {});
  
  // Convert to array and sort by count (descending)
  const professionStats = Object.entries(professionCounts).map(([profession, count]) => ({
    profession,
    count
  })).sort((a, b) => b.count - a.count);
  
  return professionStats;
};

/**
 * Calculate statistics for all collections
 * @param {array} collections - Array of collection objects
 * @param {array} allPlaques - Array of all plaques
 * @param {array} userVisits - Array of user visit records
 * @returns {array} - Array of collections with enhanced statistics
 */
export const getAllCollectionsStats = (collections, allPlaques, userVisits) => {
  return collections.map(collection => 
    getCollectionStats(collection, allPlaques, userVisits)
  );
};

export default {
  formatTimeAgo,
  getCollectionStats,
  getVisitedStats,
  getProfessionStats,
  getAllCollectionsStats
};