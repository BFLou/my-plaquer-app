// src/utils/markerUtils.ts
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
 * Creates a route marker with diamond shape for better visibility
 */
export const createRouteMarker = (
  L: any,
  plaque: Plaque,
  index: number,
  totalPoints: number
) => {
  // Determine marker style based on position in route
  let markerLabel, markerColor, markerClass;
  
  if (index === 0) {
    markerLabel = 'S';
    markerColor = '#3b82f6'; // Blue for start
    markerClass = 'route-marker-start';
  } else if (index === totalPoints - 1) {
    markerLabel = 'E';
    markerColor = '#ef4444'; // Red for end
    markerClass = 'route-marker-end';
  } else {
    markerLabel = (index + 1).toString();
    markerColor = '#10b981'; // Green for waypoints
    markerClass = 'route-marker-waypoint';
  }
  
  // Create diamond-shaped route marker
  return L.divIcon({
    className: `route-marker ${markerClass}`,
    html: `
      <div class="route-marker-container">
        <div class="route-marker-diamond" style="background-color: ${markerColor};">
          <div class="route-marker-content">${markerLabel}</div>
        </div>
        <div class="route-marker-label">${
          index === 0 ? 'Start' : 
            index === totalPoints - 1 ? 'End' : 
            `Stop ${index + 1}`
        }</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

/**
 * Creates a route distance marker for displaying segment information
 */
export const createDistanceMarker = (
  L: any,
  distance: number,
  walkingTime: string,
  formatDistance: (distance: number) => string
) => {
  return L.divIcon({
    className: 'distance-label',
    html: `
      <div class="route-distance-label">
        ${formatDistance(distance)} · ${walkingTime}
      </div>
    `,
    iconSize: [80, 20],
    iconAnchor: [40, 10]
  });
};

/**
 * Creates popup content for a plaque marker with improved styling
 */
export const createPlaquePopup = (
  plaque: Plaque,
  onPlaqueClick: (plaque: Plaque) => void,
  isRoutingMode: boolean = false,
  onAddToRoute?: (plaque: Plaque) => void
) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup p-3';
  
  // Create popup HTML with improved styling and conditional routing button
  popupContent.innerHTML = `
    <div class="max-w-xs">
      <div class="font-medium text-sm mb-1">${plaque.title || 'Unnamed Plaque'}</div>
      <div class="text-xs text-gray-600 mb-2">${plaque.location || plaque.address || ''}</div>
      ${plaque.erected ? `<div class="text-xs text-gray-500 mb-2">Erected: ${plaque.erected}</div>` : ''}
      ${plaque.visited ? `<div class="text-xs text-green-600 mb-2">✓ You've visited this plaque</div>` : ''}
      <div class="flex gap-2">
        <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
          View Details
        </button>
        ${isRoutingMode ? `
          <button class="add-to-route py-1.5 px-3 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors">
            Add to Route
          </button>
        ` : ''}
      </div>
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
 * Creates popup content for a route marker
 */
export const createRoutePopup = (
  plaque: Plaque,
  index: number,
  totalPoints: number,
  onPlaqueClick: (plaque: Plaque) => void,
  onRemoveFromRoute: (plaqueId: number) => void
) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup';
  
  // Create type label based on position
  let typeLabel = '';
  if (index === 0) typeLabel = 'Starting point';
  else if (index === totalPoints - 1) typeLabel = 'Final destination';
  else typeLabel = `Stop #${index + 1}`;
  
  popupContent.innerHTML = `
    <div class="max-w-xs">
      <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
      <div class="text-xs text-green-600 mt-1">• ${typeLabel} in walking route</div>
      <div class="flex gap-2 mt-3">
        <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
          View Details
        </button>
        <button class="remove-from-route py-1.5 px-3 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors">
          Remove
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners
  setTimeout(() => {
    const detailButton = popupContent.querySelector('.view-details');
    if (detailButton) {
      detailButton.addEventListener('click', () => {
        onPlaqueClick(plaque);
      });
    }
    
    const removeButton = popupContent.querySelector('.remove-from-route');
    if (removeButton) {
      removeButton.addEventListener('click', () => {
        onRemoveFromRoute(plaque.id);
      });
    }
  }, 0);
  
  return popupContent;
};

/**
 * Create directional arrow for route segments
 */
export const createDirectionalArrow = (L: any, startPoint: number[], endPoint: number[]) => {
  // Calculate the midpoint of the segment
  const midX = (startPoint[0] + endPoint[0]) / 2;
  const midY = (startPoint[1] + endPoint[1]) / 2;
  
  // Calculate the direction vector
  const dx = endPoint[0] - startPoint[0];
  const dy = endPoint[1] - startPoint[1];
  
  // Normalize the direction vector
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Calculate perpendicular vector
  const perpX = -unitY;
  const perpY = unitX;
  
  // Arrow size (adjust based on map zoom)
  const arrowSize = 0.0002;
  
  // Calculate arrow points
  const arrowPoints = [
    [midX - unitX * arrowSize * 2 + perpX * arrowSize, midY - unitY * arrowSize * 2 + perpY * arrowSize],
    [midX, midY],
    [midX - unitX * arrowSize * 2 - perpX * arrowSize, midY - unitY * arrowSize * 2 - perpY * arrowSize]
  ];
  
  // Create arrow polyline
  return L.polyline(arrowPoints, {
    color: '#10b981',
    weight: 3,
    opacity: 0.9
  });
};