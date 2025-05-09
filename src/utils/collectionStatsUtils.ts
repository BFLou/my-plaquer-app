// src/utils/collectionStatsUtils.ts

type Collection = {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[];
  updated_at: string;
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
  collection: Collection, 
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
 * Format time ago from a date string
 */
export function formatTimeAgo(dateString: string): string {
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
    collection, 
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
  getPlaqueCount,
  getCollectionStats,
  getAllCollectionsStats
};