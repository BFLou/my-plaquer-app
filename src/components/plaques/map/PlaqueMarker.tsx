// src/components/plaques/map/PlaqueMarker.tsx

import React from 'react';
import { Plaque } from '@/types/plaque';

// Helper function to create a marker for a plaque
export const createPlaqueMarker = (plaque: Plaque, options: any) => {
  const { 
    L, 
    onMarkerClick, 
    onViewDetails,
    onAddToRoute,
    favorites = [], 
    selectedMarkerId = null,
    createPopupContent
  } = options;
  
  try {
    const lat = parseFloat(plaque.latitude as string);
    const lng = parseFloat(plaque.longitude as string);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Invalid coordinates for plaque ${plaque.id}`);
      return null;
    }
    
    // Get plaque color
    const plaqueColor = (plaque.color?.toLowerCase() || 'blue') as string;
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
          <div class="bg-white rounded-full p-1 shadow-md ${favorites.includes(plaque.id) ? 'ring-2 ring-amber-500' : ''}">
            <div style="background-color: ${bgColor}" class="text-white rounded-full w-7 h-7 flex items-center justify-center">
              ${plaque.visited ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    });
    
    // Create the compact popup content
    const popupContent = createPopupContent(plaque, {
      onViewDetails: () => {
        if (onViewDetails) onViewDetails(plaque);
        marker.closePopup();
      },
      onAddToRoute: onAddToRoute ? () => onAddToRoute(plaque) : undefined,
      isFavorite: favorites.includes(plaque.id),
      compact: true // Use compact version for initial click
    });
    
    // Create popup with specified options
    const popup = L.popup({
      closeButton: true,
      autoClose: true,
      className: 'plaque-popup-container compact-popup',
      offset: [0, -14] // Adjust offset to position the popup better
    }).setContent(popupContent);
    
    // Bind popup to marker
    marker.bindPopup(popup);
    
    // Add click handler
    marker.on('click', function(e) {
      // Stop propagation to prevent zoom issues
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