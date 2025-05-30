// src/utils/navigationUtils.ts
import { Plaque } from '@/types/plaque';

export type NavigationMode = 'modal' | 'url' | 'new-tab';

export const navigateToPlaque = (
  plaque: Plaque, 
  mode: NavigationMode = 'modal',
  onModalOpen?: (plaque: Plaque) => void
) => {
  switch (mode) {
    case 'url':
      // Navigate in same tab
      window.location.href = `/plaque/${plaque.id}`;
      break;
      
    case 'new-tab':
      // Open in new tab
      window.open(`/plaque/${plaque.id}`, '_blank');
      break;
      
    case 'modal':
    default:
      // Use modal callback
      if (onModalOpen) {
        onModalOpen(plaque);
      }
      break;
  }
};

// Helper to determine best navigation mode based on context
export const getNavigationMode = (context: string): NavigationMode => {
  switch (context) {
    case 'discover-grid':
    case 'discover-list':
      return 'new-tab'; // Better for browsing
    case 'map':
      return 'modal'; // Better UX on maps
    case 'collection':
      return 'modal'; // Keep context
    default:
      return 'modal';
  }
};