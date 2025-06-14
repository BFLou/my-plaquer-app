// src/utils/urlUtils.ts - Clean canonical URL generation utility
export const generatePlaqueUrl = (plaqueId: number): string => {
  return `${window.location.origin}/plaque/${plaqueId}`;
};

// Optional: Additional URL utilities for future use
export const generateCollectionUrl = (collectionId: string): string => {
  return `${window.location.origin}/library/collections/${collectionId}`;
};

export const generateRouteUrl = (routeId: string): string => {
  return `${window.location.origin}/library/routes/${routeId}`;
};

// Helper to parse plaque URL and extract context
export const parsePlaqueUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/^\/plaque\/(\d+)$/);

    if (!pathMatch) return null;

    return {
      plaqueId: parseInt(pathMatch[1], 10),
      source: urlObj.searchParams.get('source'),
      route: urlObj.searchParams.get('route'),
      collection: urlObj.searchParams.get('collection'),
    };
  } catch {
    return null;
  }
};
