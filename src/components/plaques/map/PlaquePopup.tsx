// src/components/plaques/map/PlaquePopup.tsx
import { Plaque } from '@/types/plaque';

type PopupOptions = {
  onViewDetails?: () => void;
  onAddToRoute?: () => void;
  isFavorite?: boolean;
  compact?: boolean;
  isRoutingMode?: boolean;
};

/**
 * Creates popup content for a plaque marker
 * @param plaque - The plaque data
 * @param options - Options for popup creation
 * @returns - DOM element for the popup content
 */
export const createPlaquePopupContent = (
  plaque: Plaque, 
  options: PopupOptions
): HTMLElement => {
  const { onViewDetails, onAddToRoute, isFavorite, compact = false, isRoutingMode = false } = options;
  
  // Create a DOM element for the popup
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup';
  
  if (compact) {
    // Compact popup design for initial click
    popupContent.innerHTML = `
      <div class="p-2 max-w-[200px]">
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
      </div>
    `;
  } else {
    // Full popup with image for when the user wants more info but not full panel
    let imageHtml = '';
    if (plaque.image) {
      imageHtml = `
        <div class="w-full h-24 mb-2 bg-gray-100 overflow-hidden rounded">
          <img src="${plaque.image}" alt="${plaque.title || 'Plaque'}" class="w-full h-full object-cover hover:scale-105 transition-transform" />
        </div>
      `;
    }
    
    let addToRouteButton = '';
    if (isRoutingMode) {
      addToRouteButton = `
        <button class="add-to-route mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded w-full hover:bg-green-600 transition-colors">
          Add to Route
        </button>
      `;
    }
    
    popupContent.innerHTML = `
      ${imageHtml}
      <div class="p-2">
        <div class="font-semibold">${plaque.title || 'Unnamed Plaque'}</div>
        <div class="text-xs text-gray-600">${plaque.location || plaque.address || ''}</div>
        ${plaque.color ? `<div class="mt-1 text-xs">${plaque.color} Plaque</div>` : ''}
        ${plaque.erected ? `<div class="mt-1 text-xs">Erected: ${plaque.erected}</div>` : ''}
        <button class="view-details mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded w-full hover:bg-blue-600 transition-colors">View Details</button>
        ${addToRouteButton}
      </div>
    `;
  }
  
  // Add click handler to the View Details button
  setTimeout(() => {
    const detailButton = popupContent.querySelector('.view-details');
    if (detailButton) {
      detailButton.addEventListener('click', () => {
        if (onViewDetails) onViewDetails();
      });
    }
    
    // Add click handler to the Add to Route button if it exists
    const routeButton = popupContent.querySelector('.add-to-route');
    if (routeButton && onAddToRoute) {
      routeButton.addEventListener('click', () => {
        onAddToRoute();
      });
    }
  }, 0);
  
  return popupContent;
};

export default createPlaquePopupContent;