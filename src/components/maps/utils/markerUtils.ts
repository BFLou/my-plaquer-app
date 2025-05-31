// src/components/maps/utils/markerUtils.ts - COMPLETE: All marker utilities
import { Plaque } from '@/types/plaque';

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
 * Creates popup content for a plaque marker with enhanced route functionality
 */
export const createPlaquePopup = (
  plaque: Plaque,
  onViewDetails: (plaque: Plaque) => void,
  isRoutingMode: boolean = false,
  onAddToRoute: ((plaque: Plaque) => void) | null = null
) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup p-3 min-w-[250px]';
  
  // Enhanced popup HTML with better styling
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
      
      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2">
        <button class="view-details flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          View Details
        </button>
        
        ${isRoutingMode ? `
          <button class="add-to-route py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-1">
            Add to Route
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // Enhanced event handlers with better error handling
  const setupEventHandlers = () => {
    const detailButton = popupContent.querySelector('.view-details');
    const routeButton = popupContent.querySelector('.add-to-route');
    
    if (detailButton) {
      const handleDetailClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          onViewDetails(plaque);
        } catch (error) {
          console.error('Error opening plaque details:', error);
        }
      };
      
      detailButton.addEventListener('click', handleDetailClick, { capture: true });
    }
    
    if (routeButton && onAddToRoute) {
      const handleRouteClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          onAddToRoute(plaque);
          // Visual feedback
          const button = e.target as HTMLButtonElement;
          const originalText = button.innerHTML;
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
            button.innerHTML = originalText;
            button.classList.remove('bg-green-600');
          }, 2000);
        } catch (error) {
          console.error('Error adding to route:', error);
        }
      };
      
      routeButton.addEventListener('click', handleRouteClick, { capture: true });
    }
  };
  
  // Use setTimeout to ensure DOM is ready
  setTimeout(setupEventHandlers, 0);
  
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