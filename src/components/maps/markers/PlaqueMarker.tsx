import { Plaque } from '@/types/plaque';

type MarkerOptions = {
  L: any;
  onMarkerClick?: (plaque: Plaque) => void;
  onViewDetails?: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  favorites?: number[];
  selectedMarkerId?: number | null;
  isRoutingMode?: boolean;
};

/**
 * Helper function to create a marker for a plaque
 * @param plaque - The plaque data
 * @param options - Options for marker creation
 * @returns - Leaflet marker or null if creation failed
 */
export const createPlaqueMarker = (
  plaque: Plaque, 
  options: MarkerOptions
): any | null => {
  const { 
    L, 
    onMarkerClick, 
    onViewDetails,
    onAddToRoute,
    favorites = [], 
    selectedMarkerId = null,
    isRoutingMode = false
  } = options;
  
  if (!L) {
    console.error('Leaflet library not loaded');
    return null;
  }
  
  try {
    // Check if plaque has valid coordinates
    if (!plaque.latitude || !plaque.longitude) {
      console.warn(`Missing coordinates for plaque ${plaque.id}`);
      return null;
    }
    
    const lat = parseFloat(plaque.latitude as unknown as string);
    const lng = parseFloat(plaque.longitude as unknown as string);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Invalid coordinates for plaque ${plaque.id}: lat=${plaque.latitude}, lng=${plaque.longitude}`);
      return null;
    }
    
    // Get plaque color with fallback to blue
    const plaqueColor = (plaque.color?.toLowerCase() || 'blue');
    const bgColor = {
      'blue': '#3b82f6',
      'green': '#10b981',
      'brown': '#b45309',
      'black': '#4b5563',
      'grey': '#4b5563'
    }[plaqueColor] || '#3b82f6';
    
    // Create marker with custom icon
    const marker = L.marker([lat, lng], { 
      icon: L.divIcon({
        className: `custom-marker ${selectedMarkerId === plaque.id ? 'selected-marker' : ''}`,
        html: `
          <div class="flex items-center justify-center bg-white rounded-full p-1 shadow-md ${favorites.includes(plaque.id) ? 'ring-2 ring-amber-500' : ''}">
            <div style="background-color: ${bgColor}" class="text-white rounded-full w-7 h-7 flex items-center justify-center">
              ${plaque.visited ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    });
    
    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'plaque-popup p-2';
    
    // Create popup HTML with conditional routing button
    popupContent.innerHTML = `
      <div class="font-semibold text-sm mb-1">${plaque.title || 'Unnamed Plaque'}</div>
      <div class="text-xs text-gray-600 mb-2 truncate">${plaque.location || plaque.address || ''}</div>
      <div class="flex gap-2">
        <button class="view-details py-1 px-2 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">View Details</button>
        ${isRoutingMode ? `
          <button class="add-to-route py-1 px-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
            Add to Route
          </button>
        ` : ''}
      </div>
    `;
    
    // Add event listeners for buttons
    const viewDetailsBtn = popupContent.querySelector('.view-details');
    if (viewDetailsBtn && onViewDetails) {
      viewDetailsBtn.addEventListener('click', () => {
        onViewDetails(plaque);
      });
    }
    
    const addToRouteBtn = popupContent.querySelector('.add-to-route');
    if (addToRouteBtn && onAddToRoute) {
      addToRouteBtn.addEventListener('click', () => {
        onAddToRoute(plaque);
      });
    }
    
    // Create popup with specified options
    const popup = L.popup({
      closeButton: true,
      autoClose: true,
      className: 'plaque-popup-container',
      offset: [0, -14] // Adjust offset to position the popup better
    }).setContent(popupContent);
    
    // Bind popup to marker
    marker.bindPopup(popup);
    
    // Add click handler
    marker.on('click', function(e: any) {
      // Stop propagation to prevent map click
      L.DomEvent.stopPropagation(e);
      
      // Notify parent component about the click
      if (onMarkerClick) onMarkerClick(plaque);
      
      // Open the popup
      marker.openPopup();
    });
    
    // Add drop-in animation
    setTimeout(() => {
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.classList.add('marker-drop-animation');
      }
    }, 10);
    
    return marker;
  } catch (error) {
    console.error(`Error creating marker for plaque ${plaque.id}:`, error);
    return null;
  }
};

export default createPlaqueMarker;