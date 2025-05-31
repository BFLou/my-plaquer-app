// src/components/maps/utils/markerUtils.ts - COMPLETE: All marker utilities with simple debouncing
import { Plaque } from '@/types/plaque';

/**
 * Simple debounce utility to prevent rapid-fire function calls
 */
const createDebouncer = () => {
  const recentCalls = new Set<string>();
  
  return (key: string, fn: () => void, delay = 1000) => {
    if (recentCalls.has(key)) {
      console.log(`🔇 Debounced call: ${key}`);
      return;
    }
    
    recentCalls.add(key);
    fn();
    
    setTimeout(() => {
      recentCalls.delete(key);
    }, delay);
  };
};

// Global debouncer instance
const debouncer = createDebouncer();

/**
 * Creates a custom icon for a plaque marker with improved styling
 */
export const createPlaqueIcon = (
  L: any, 
  plaque: Plaque, 
  isFavorite: boolean = false, 
  isSelected: boolean = false
) => {
  // Determine color based on plaque color with improved contrast
  const colorMap: Record<string, string> = {
    'blue': '#3b82f6',
    'green': '#10b981',
    'brown': '#b45309',
    'black': '#1f2937',
    'grey': '#4b5563',
    'gray': '#4b5563'
  };
  
  // Default to blue if color is missing or not in the map
  const color = colorMap[(plaque.color?.toLowerCase() || 'blue').toLowerCase()] || '#3b82f6';
  
  // Create HTML for icon with improved styling and visibility
  const html = `
    <div class="flex items-center justify-center ${isSelected ? 'scale-125' : ''}">
      <div style="
        background-color: ${color}; 
        width: 36px; 
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 0 0 3px white, 0 3px 6px rgba(0,0,0,0.3);
        ${isFavorite ? 'border: 2px solid #f59e0b;' : ''}
        ${isSelected ? 'border: 3px solid #3b82f6; transform: scale(1.1);' : ''}
      ">
        ${plaque.visited ? 
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
        }
      </div>
    </div>
  `;
  
  return L.divIcon({
    className: `custom-marker ${isSelected ? 'selected-marker' : ''}`,
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

/**
 * Creates popup content for a plaque marker with FIXED route functionality
 * CRITICAL FIX: Separate handlers for View Details vs Add to Route
 */
export const createPlaquePopup = (
  plaque: Plaque,
  onViewDetails: (plaque: Plaque) => void,
  isRoutingMode: boolean = false,
  onAddToRoute: ((plaque: Plaque) => void) | null = null
) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup p-3 min-w-[250px]';
  
  // Generate unique IDs to prevent event handler conflicts
  const detailBtnId = `detail-btn-${plaque.id}-${Date.now()}`;
  const routeBtnId = `route-btn-${plaque.id}-${Date.now()}`;
  
  // Enhanced popup HTML with unique IDs
  popupContent.innerHTML = `
    <div class="space-y-3">
      <!-- Plaque Title -->
      <div class="font-semibold text-base text-gray-900 leading-tight">
        ${plaque.title || 'Unnamed Plaque'}
      </div>
      
      <!-- Location Info -->
      <div class="text-sm text-gray-600">
        ${plaque.location || plaque.address || 'Location not specified'}
      </div>
      
      <!-- Additional Info -->
      <div class="flex flex-wrap gap-2 text-xs">
        ${plaque.color && plaque.color.toLowerCase() !== 'unknown' ? `
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            ${plaque.color.charAt(0).toUpperCase() + plaque.color.slice(1)} plaque
          </span>
        ` : ''}
        ${plaque.profession && plaque.profession.toLowerCase() !== 'unknown' ? `
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
            ${plaque.profession.charAt(0).toUpperCase() + plaque.profession.slice(1)}
          </span>
        ` : ''}
        ${plaque.visited ? `
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
            ✓ Visited
          </span>
        ` : ''}
      </div>
      
      <!-- Action Buttons - FIXED LAYOUT WITH UNIQUE IDS -->
      <div class="flex gap-2 pt-2">
        <!-- View Details Button - ALWAYS AVAILABLE -->
        <button id="${detailBtnId}" class="view-details flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          View Details
        </button>
        
        <!-- Add to Route Button - ONLY IN ROUTE MODE -->
        ${isRoutingMode ? `
          <button id="${routeBtnId}" class="add-to-route py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add to Route
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // FIXED: Single-use event handlers with proper cleanup and debouncing
  const setupEventHandlers = () => {
    const detailButton = popupContent.querySelector(`#${detailBtnId}`) as HTMLButtonElement;
    const routeButton = popupContent.querySelector(`#${routeBtnId}`) as HTMLButtonElement;
    
    // ALWAYS handle View Details - regardless of route mode
    if (detailButton) {
      const handleDetailClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target as HTMLButtonElement;
        
        // Simple debouncing - disable button temporarily
        if (btn.disabled) return;
        
        console.log('🔍 View Details clicked for:', plaque.title);
        
        // Disable button temporarily to prevent double-clicks
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Loading...';
        
        try {
          onViewDetails(plaque);
        } catch (error) {
          console.error('Error opening plaque details:', error);
        } finally {
          // Re-enable after 1 second
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
          }, 1000);
        }
      };
      
      // Add single event listener
      detailButton.addEventListener('click', handleDetailClick, { capture: true });
    }
    
    // ONLY handle Add to Route in route mode
    if (routeButton && onAddToRoute && isRoutingMode) {
      const handleRouteClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target as HTMLButtonElement;
        
        // Prevent multiple rapid clicks
        if (button.disabled) return;
        
        // Use debouncer to prevent rapid-fire additions
        debouncer(`add-route-${plaque.id}`, () => {
          console.log('➕ Add to Route clicked for:', plaque.title);
          
          button.disabled = true;
          const originalHTML = button.innerHTML;
          
          try {
            onAddToRoute(plaque);
            
            // Visual feedback
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Added!
            `;
            button.classList.add('bg-green-600');
            
            // Reset after 2 seconds
            setTimeout(() => {
              button.innerHTML = originalHTML;
              button.classList.remove('bg-green-600');
              button.disabled = false;
            }, 2000);
            
          } catch (error) {
            console.error('Error adding to route:', error);
            // Reset button on error
            button.innerHTML = originalHTML;
            button.disabled = false;
          }
        }, 500); // 500ms debounce for route additions
      };
      
      // Add single event listener for route button
      routeButton.addEventListener('click', handleRouteClick, { capture: true });
    }
  };
  
  // Setup handlers immediately
  setupEventHandlers();
  
  return popupContent;
};

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Format distance based on unit preference
 */
export function formatDistance(distanceKm: number, useImperial = false): string {
  if (useImperial) {
    // Convert to miles (1 km = 0.621371 miles)
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${distanceKm.toFixed(1)} km`;
  }
}

/**
 * Create a marker cluster group with custom styling
 */
export const createMarkerCluster = (L: any) => {
  if (!L || !L.markerClusterGroup) {
    console.warn('MarkerClusterGroup plugin not available');
    return null;
  }
  
  return L.markerClusterGroup({
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    chunkInterval: 200,
    chunkDelay: 50,
    removeOutsideVisibleBounds: true,
    animate: true,
    animateAddingMarkers: false,
    disableClusteringAtZoom: 18,
    
    iconCreateFunction: function(cluster: any) {
      const count = cluster.getChildCount();
      let size = 36;
      let fontSize = '12px';
      
      if (count < 6) {
        size = 36;
        fontSize = '12px';
      } else if (count < 21) {
        size = 44;
        fontSize = '14px';
      } else {
        size = 52;
        fontSize = '16px';
      }
      
      return L.divIcon({
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: white;
            color: #3b82f6;
            border: 3px solid #3b82f6;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            ${count}
          </div>
        `,
        className: 'minimalist-cluster-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    }
  });
};

/**
 * Validate if coordinates are valid for London area
 */
export function isValidLondonCoordinate(lat: number, lon: number): boolean {
  // Check for NaN or undefined
  if (isNaN(lat) || isNaN(lon) || lat === undefined || lon === undefined) {
    return false;
  }
  
  // Check for reasonable bounds (London area with some buffer)
  // London is roughly between 51.2-51.7°N and -0.5-0.3°E
  const isValidLat = lat >= 51.0 && lat <= 52.0;
  const isValidLon = lon >= -1.0 && lon <= 1.0;
  
  return isValidLat && isValidLon;
}

/**
 * Parse coordinate string to number with validation
 */
export function parseCoordinate(coord: string | number | null | undefined): number | null {
  if (coord === null || coord === undefined) {
    return null;
  }
  
  const parsed = typeof coord === 'string' ? parseFloat(coord) : coord;
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Get marker color based on plaque properties
 */
export function getPlaqueMarkerColor(plaque: Plaque): string {
  // Use plaque.color field if available
  if (plaque.color) {
    const color = plaque.color.toLowerCase();
    
    const colorMap: Record<string, string> = {
      'blue': '#3b82f6',
      'green': '#10b981',
      'brown': '#b45309',
      'black': '#1f2937',
      'grey': '#4b5563',
      'gray': '#4b5563'
    };
    
    if (colorMap[color]) {
      return colorMap[color];
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
}

/**
 * Create a simple tooltip for markers
 */
export function createMarkerTooltip(plaque: Plaque): string {
  const title = plaque.title || 'Unnamed Plaque';
  const location = plaque.location || plaque.address || '';
  
  if (location) {
    return `${title}<br><small>${location}</small>`;
  }
  
  return title;
}

/**
 * Cleanup utility for removing markers safely
 */
export function safeRemoveMarker(map: any, marker: any): void {
  try {
    if (map && marker && map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  } catch (error) {
    console.warn('Error removing marker:', error);
  }
}