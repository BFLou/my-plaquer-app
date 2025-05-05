import { Plaque } from '@/types/plaque';

/**
 * Creates a custom icon for a plaque marker
 */
export const createPlaqueIcon = (
  L: any, 
  plaque: Plaque, 
  isFavorite: boolean = false, 
  isSelected: boolean = false
) => {
  // Determine color based on plaque color
  const colorMap: Record<string, string> = {
    'blue': '#3b82f6',
    'green': '#10b981',
    'brown': '#b45309',
    'black': '#1f2937',
    'grey': '#4b5563',
    'gray': '#4b5563'
  };
  
  const color = colorMap[(plaque.color || 'blue').toLowerCase()] || '#3b82f6';
  
  // Create HTML for icon
  const html = `
    <div class="flex items-center justify-center bg-white rounded-full p-1 shadow-md ${isFavorite ? 'ring-2 ring-amber-500' : ''} ${isSelected ? 'ring-2 ring-blue-500 scale-125' : ''}">
      <div style="background-color: ${color}; width: 28px; height: 28px;" class="text-white rounded-full flex items-center justify-center">
        ${plaque.visited ? 
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
        }
      </div>
    </div>
  `;
  
  return L.divIcon({
    className: `custom-marker ${isSelected ? 'selected-marker' : ''}`,
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

/**
 * Creates popup content for a plaque marker
 */
export const createPlaquePopup = (
  plaque: Plaque,
  onPlaqueClick: (plaque: Plaque) => void,
  isRoutingMode: boolean = false,
  onAddToRoute: ((plaque: Plaque) => void) | null = null
) => {
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