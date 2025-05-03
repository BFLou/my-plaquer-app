/**
 * Map utility functions for PlaqueMap component
 */

/**
 * Creates a marker icon based on plaque properties
 * @param {Object} plaque - The plaque object
 * @param {boolean} isFavorite - Whether the plaque is marked as favorite
 * @param {boolean} isSelected - Whether the plaque is currently selected
 * @returns {Object} Leaflet divIcon object
 */
export const createPlaqueIcon = (plaque, isFavorite = false, isSelected = false) => {
    // Determine marker color based on plaque color
    let markerColor = 'blue';
    if (plaque.color) {
      const color = plaque.color.toLowerCase();
      if (color === 'blue') markerColor = 'blue';
      else if (color === 'green') markerColor = 'green';
      else if (color === 'brown' || color === 'bronze') markerColor = 'amber';
      else if (color === 'black' || color === 'grey' || color === 'gray') markerColor = 'gray';
      else markerColor = 'blue';
    }
    
    // Create icon HTML
    const iconHtml = `
      <div class="bg-white rounded-full p-1 shadow-md ${isFavorite ? 'ring-2 ring-amber-500' : ''}">
        <div class="bg-${markerColor}-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
          ${plaque.visited ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
          }
        </div>
      </div>
    `;
    
    // We need to access L from the window object
    const L = (window).L;
    if (!L) {
      console.error("Leaflet not available to create icon");
      return null;
    }
    
    return L.divIcon({
      className: `custom-marker ${isSelected ? 'selected-marker' : ''}`,
      html: iconHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };
  
  /**
   * Creates a popup for a plaque marker
   * @param {Object} plaque - The plaque object
   * @param {Function} onPlaqueClick - Callback function when plaque details are requested
   * @returns {HTMLElement} Popup content element
   */
  export const createPlaquePopup = (plaque, onPlaqueClick) => {
    const popupContent = document.createElement('div');
    popupContent.className = 'plaque-popup';
    
    // Create popup content
    popupContent.innerHTML = `
      <div class="font-semibold">${plaque.title}</div>
      <div class="text-xs text-gray-600">${plaque.location || plaque.address || ''}</div>
      ${plaque.color ? `<div class="mt-1 text-xs">${plaque.color} Plaque</div>` : ''}
      <button class="view-details mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded w-full">View Details</button>
    `;
    
    // Add click handler to the View Details button
    const detailButton = popupContent.querySelector('.view-details');
    if (detailButton && onPlaqueClick) {
      detailButton.addEventListener('click', () => {
        onPlaqueClick(plaque);
      });
    }
    
    return popupContent;
  };