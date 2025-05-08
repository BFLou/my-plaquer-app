// src/components/maps/utils/markerUtils.ts
// This replaces your existing markerUtils.ts file

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
 * Creates popup content for a plaque marker with improved styling
 */
export const createPlaquePopup = (
  plaque: Plaque,
  onPlaqueClick: (plaque: Plaque) => void,
  isRoutingMode: boolean = false,
  onAddToRoute: ((plaque: Plaque) => void) | null = null
) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup p-3';
  
  // Create popup HTML with improved styling and conditional routing button
  popupContent.innerHTML = `
    <div class="font-semibold text-sm mb-2">${plaque.title || 'Unnamed Plaque'}</div>
    <div class="text-xs text-gray-600 mb-3">${plaque.location || plaque.address || ''}</div>
    <div class="flex gap-2">
      <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">
        View Details
      </button>
      ${isRoutingMode ? `
        <button class="add-to-route py-1.5 px-3 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
          Add to Route
        </button>
      ` : ''}
    </div>
  `;
  
  // Add event listeners after a small delay to ensure DOM is ready
  setTimeout(() => {
    const detailButton = popupContent.querySelector('.view-details');
    if (detailButton) {
      detailButton.addEventListener('click', () => {
        onPlaqueClick(plaque);
      });
    }
    
    const routeButton = popupContent.querySelector('.add-to-route');
    if (routeButton && onAddToRoute) {
      routeButton.addEventListener('click', () => {
        onAddToRoute(plaque);
      });
    }
  }, 10);
  
  return popupContent;
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};