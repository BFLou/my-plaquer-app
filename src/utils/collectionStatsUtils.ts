// src/utils/collectionStatsUtils.ts
import { formatDistance } from 'date-fns';

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

/**
 * Get visit statistics for a collection
 */
export function getVisitedStats(
  plaques: Plaque[],
  userVisits: Visit[]
) {
  if (!plaques.length) return { visitedCount: 0, visitedPercentage: 0 };
  
  const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
  const visitedCount = plaques.filter(plaque => 
    plaque.visited || visitedPlaqueIds.includes(plaque.id)
  ).length;
  
  const visitedPercentage = Math.round((visitedCount / plaques.length) * 100);
  
  return { visitedCount, visitedPercentage };
}

/**
 * Get profession statistics for a collection
 */
export function getProfessionStats(plaques: Plaque[]) {
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
}

/**
 * Format time ago from a date string, Timestamp, or Date object
 * Handles Firestore timestamp objects properly
 */
export function formatTimeAgo(dateValue: any): string {
  // If no date value is provided, return 'recently'
  if (!dateValue) return 'recently';
  
  try {
    let date: Date;
    
    // Case 1: Firebase Timestamp object with toDate method
    if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    }
    // Case 2: Firebase server timestamp object with seconds & nanoseconds
    else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Case 3: JavaScript Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Case 4: String date 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // Case 5: Numeric timestamp (milliseconds)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Default fallback
    else {
      return 'recently';
    }
    
    // Verify the date is valid
    if (!date || isNaN(date.getTime())) {
      return 'recently';
    }
    
    // Calculate the time difference
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Format the output based on the difference
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    
  } catch (error) {
    // If any error occurs during processing, return 'recently'
    return 'recently';
  }
}


/**
 * Alternative implementation using date-fns if available
 */
export function formatTimeAgoWithDateFns(dateValue: any): string {
  try {
    let date: Date;
    
    // Handle Firebase Timestamp object
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      date = dateValue.toDate();
    }
    // Handle Firebase server timestamp
    else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Handle JavaScript Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle numeric timestamps
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Handle date strings
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    else {
      return 'recently';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'recently';
    }
    
    // Use date-fns to calculate relative time
    return formatDistance(date, new Date(), { addSuffix: true });
    
  } catch (error) {
    console.error('Error in formatTimeAgoWithDateFns:', error);
    return 'recently';
  }
}

/**
 * Get the plaque count for a collection (handles array or number)
 */
export function getPlaqueCount(collection: Collection): number {
  if (Array.isArray(collection.plaques)) {
    return collection.plaques.length;
  }
  return typeof collection.plaques === 'number' ? collection.plaques : 0;
}

/**
 * Enhance a collection with computed statistics
 */
export function getCollectionStats(
  collection: Collection, 
  allPlaques: Plaque[],
  userVisits: Visit[] = []
) {
  // Get plaques for this collection
  const plaques = allPlaques.filter(plaque => 
    collection.plaques.includes(plaque.id)
  );
  
  // Calculate visited stats
  const { visitedCount, visitedPercentage } = getVisitedStats(
    plaques, 
    userVisits
  );
  
  // Calculate profession stats
  const professionStats = getProfessionStats(plaques);
  
  return {
    ...collection,
    plaqueCount: plaques.length,
    visitedCount,
    visitedPercentage,
    professionStats
  };
}

/**
 * Enhance all collections with computed statistics
 */
export function getAllCollectionsStats(
  collections: Collection[],
  allPlaques: Plaque[],
  userVisits: Visit[] = []
) {
  return collections.map(collection => 
    getCollectionStats(collection, allPlaques, userVisits)
  );
}

export default {
  getVisitedStats,
  getProfessionStats,
  formatTimeAgo,
  formatTimeAgoWithDateFns,
  getPlaqueCount,
  getCollectionStats,
  getAllCollectionsStats
};