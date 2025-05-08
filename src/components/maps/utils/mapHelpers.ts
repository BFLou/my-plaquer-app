// src/components/maps/utils/mapHelpers.ts
import { Plaque } from '@/types/plaque';

/**
 * Convert latitude and longitude to map coordinates
 */
export const coordsToLatLng = (plaque: Plaque): [number, number] | null => {
  if (!plaque.latitude || !plaque.longitude) {
    return null;
  }
  
  const lat = parseFloat(plaque.latitude as unknown as string);
  const lng = parseFloat(plaque.longitude as unknown as string);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  return [lat, lng];
};

/**
 * Check if a plaque has valid coordinates
 */
export const hasValidCoords = (plaque: Plaque): boolean => {
  return coordsToLatLng(plaque) !== null;
};

/**
 * Get map bounds for a collection of plaques
 */
export const getPlaquesBounds = (plaques: Plaque[]): [[number, number], [number, number]] | null => {
  const validPlaques = plaques.filter(hasValidCoords);
  
  if (validPlaques.length === 0) {
    return null;
  }
  
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  
  validPlaques.forEach(plaque => {
    const coords = coordsToLatLng(plaque)!;
    minLat = Math.min(minLat, coords[0]);
    maxLat = Math.max(maxLat, coords[0]);
    minLng = Math.min(minLng, coords[1]);
    maxLng = Math.max(maxLng, coords[1]);
  });
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

/**
 * Create Leaflet LatLngBounds from array of plaques
 */
export const createBoundsFromPlaques = (plaques: Plaque[], L: any): any | null => {
  const validPlaques = plaques.filter(hasValidCoords);
  
  if (validPlaques.length === 0 || !L) {
    return null;
  }
  
  const latLngs = validPlaques.map(plaque => {
    const coords = coordsToLatLng(plaque)!;
    return L.latLng(coords[0], coords[1]);
  });
  
  return L.latLngBounds(latLngs);
};

/**
 * Show a toast notification on the map
 */
export const showMapToast = (
  message: string, 
  type: 'success' | 'info' | 'error' = 'info', 
  duration: number = 3000
): void => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `map-toast ${type}`;
  toast.innerHTML = `<div class="text-sm">${message}</div>`;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      document.body.removeChild(toast);
    }
  }, duration);
};

/**
 * Generate a color for a plaque marker based on its properties
 */
export const getPlaqueColor = (plaque: Plaque): string => {
  // Use plaque.color field if available
  if (plaque.color) {
    const color = plaque.color.toLowerCase();
    
    switch (color) {
      case 'blue':
        return '#3b82f6'; // blue-500
      case 'green':
        return '#10b981'; // green-500
      case 'brown':
        return '#b45309'; // amber-700
      case 'black':
        return '#1f2937'; // gray-800
      case 'grey':
      case 'gray':
        return '#4b5563'; // gray-600
    }
  }
  
  // Fallback to profession-based color
  if (plaque.profession) {
    const profession = plaque.profession.toLowerCase();
    
    if (profession.includes('author') || profession.includes('writer') || profession.includes('poet')) {
      return '#8b5cf6'; // violet-500
    }
    
    if (profession.includes('artist') || profession.includes('painter') || profession.includes('sculptor')) {
      return '#ec4899'; // pink-500
    }
    
    if (profession.includes('scient') || profession.includes('physic') || profession.includes('math')) {
      return '#14b8a6'; // teal-500
    }
    
    if (profession.includes('polit') || profession.includes('leader') || profession.includes('minister')) {
      return '#f59e0b'; // amber-500
    }
  }
  
  // Default color
  return '#3b82f6'; // blue-500
};

/**
 * Load Leaflet and related libraries asynchronously
 */
export const loadLeafletLibraries = async (): Promise<boolean> => {
  // Skip if already loaded
  if (window.L) return true;

  try {
    // Load CSS
    await Promise.all([
      loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'),
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css')
    ]);
    
    // Load JavaScript
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
    
    return true;
  } catch (error) {
    console.error('Error loading Leaflet libraries:', error);
    return false;
  }
};

/**
 * Helper to load CSS
 */
const loadCSS = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
    
    document.head.appendChild(link);
  });
};

/**
 * Helper to load JavaScript
 */
const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    
    document.head.appendChild(script);
  });
};

/**
 * Add custom map styles to document
 */
export const addMapCustomStyles = (): void => {
  if (document.getElementById('leaflet-custom-map-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'leaflet-custom-map-styles';
  style.innerHTML = `
    /* Custom marker styles */
    .custom-marker {
      background: transparent !important;
      border: none !important;
      transition: transform 0.2s;
    }
    
    .custom-marker:hover {
      z-index: 1000 !important;
    }
    
    /* Route animations */
    @keyframes dash {
      to {
        stroke-dashoffset: -1000;
      }
    }
    
    .animated-dash {
      animation: dash 30s linear infinite;
    }
    
    /* Pulse animation */
    @keyframes pulse {
      0% {
        transform: scale(0.8);
        opacity: 0.7;
      }
      70% {
        transform: scale(1.5);
        opacity: 0;
      }
      100% {
        transform: scale(0.8);
        opacity: 0;
      }
    }
    
    /* Toast notifications */
    .map-toast {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 200px;
      text-align: center;
      opacity: 0;
      animation: fadeIn 0.3s forwards;
    }
    
    .map-toast.success {
      border-left: 4px solid #10b981;
    }
    
    .map-toast.info {
      border-left: 4px solid #3b82f6;
    }
    
    .map-toast.error {
      border-left: 4px solid #ef4444;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, 10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  
  document.head.appendChild(style);
};