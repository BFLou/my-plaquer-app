import React from 'react';
import { Star } from 'lucide-react';
import { Plaque } from '@/types/plaque';

type PlaquePopupContentProps = {
  plaque: Plaque;
  onViewDetails: () => void;
  onAddToRoute: () => void;
  isFavorite?: boolean;
};

export const createPlaquePopupContent = (
  plaque: Plaque, 
  options: { 
    onViewDetails: () => void, 
    onAddToRoute: () => void,
    isFavorite?: boolean
  }
): HTMLElement => {
  const { onViewDetails, onAddToRoute, isFavorite } = options;
  
  // Create a DOM element for the popup
  const popupContent = document.createElement('div');
  popupContent.className = 'plaque-popup';
  
  // Add image if available
  if (plaque.image) {
    popupContent.innerHTML = `
      <div class="w-full h-24 mb-2 bg-gray-100 overflow-hidden rounded">
        <img src="${plaque.image}" alt="${plaque.title}" class="w-full h-full object-cover hover:scale-105 transition-transform" />
      </div>
    `;
  }
  
  popupContent.innerHTML += `
    <div class="font-semibold">${plaque.title}</div>
    <div class="text-xs text-gray-600">${plaque.location || plaque.address || ''}</div>
    ${plaque.color ? `<div class="mt-1 text-xs">${plaque.color} Plaque</div>` : ''}
    ${plaque.erected ? `<div class="mt-1 text-xs">Erected: ${plaque.erected}</div>` : ''}
    <button class="view-details mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded w-full">View Details</button>
    <button class="add-to-route mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded w-full">
      Add to Route
    </button>
  `;
  
  // Add click handler to the View Details button
  setTimeout(() => {
    const detailButton = popupContent.querySelector('.view-details');
    if (detailButton) {
      detailButton.addEventListener('click', () => {
        onViewDetails();
      });
    }
    
    // Add click handler to the Add to Route button
    const routeButton = popupContent.querySelector('.add-to-route');
    if (routeButton) {
      routeButton.addEventListener('click', () => {
        onAddToRoute();
      });
    }
  }, 0);
  
  return popupContent;
};

export default createPlaquePopupContent;