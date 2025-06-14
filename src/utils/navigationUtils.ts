// src/utils/navigationUtils.ts
import { NavigateFunction } from 'react-router-dom';

export interface NavigationContext {
  from?: 'collection' | 'route' | 'search' | 'discover';
  collectionId?: string;
  collectionName?: string;
  routeId?: string;
  routeName?: string;
  searchQuery?: string;
  progress?: string;
  next?: string;
}

/**
 * Navigate to plaque detail with proper context preservation
 */
export const navigateToPlaqueWithContext = (
  navigate: NavigateFunction,
  plaqueId: number,
  context: NavigationContext
) => {
  const params = new URLSearchParams();

  // Add context parameters
  if (context.from) {
    params.set('from', context.from);
  }

  if (context.collectionId) {
    params.set('collection', context.collectionId);
  }

  if (context.collectionName) {
    params.set('collectionName', context.collectionName);
  }

  if (context.routeId) {
    params.set('route', context.routeId);
  }

  if (context.routeName) {
    params.set('routeName', context.routeName);
  }

  if (context.searchQuery) {
    params.set('search', context.searchQuery);
  }

  if (context.progress) {
    params.set('progress', context.progress);
  }

  if (context.next) {
    params.set('next', context.next);
  }

  const url = `/plaque/${plaqueId}${params.toString() ? `?${params.toString()}` : ''}`;
  navigate(url);
};

/**
 * Generate plaque URL with context for sharing
 */
export const generatePlaqueUrlWithContext = (
  plaqueId: number,
  context?: NavigationContext
): string => {
  const baseUrl = `${window.location.origin}/plaque/${plaqueId}`;

  if (!context) return baseUrl;

  const params = new URLSearchParams();

  if (context.from) {
    params.set('from', context.from);
  }

  if (context.collectionId) {
    params.set('collection', context.collectionId);
  }

  if (context.searchQuery) {
    params.set('search', context.searchQuery);
  }

  return `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
};

/**
 * Hook to extract current navigation context from URL
 */
export const useNavigationContext = (
  searchParams: URLSearchParams
): NavigationContext => {
  return {
    from: searchParams.get('from') as NavigationContext['from'] | undefined,
    collectionId: searchParams.get('collection') || undefined,
    collectionName: searchParams.get('collectionName') || undefined,
    routeId: searchParams.get('route') || undefined,
    routeName: searchParams.get('routeName') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    progress: searchParams.get('progress') || undefined,
    next: searchParams.get('next') || undefined,
  };
};
