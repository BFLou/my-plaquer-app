// src/hooks/useUrlState.ts - URL state management for Discover page
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ViewMode = 'grid' | 'list' | 'map';

interface UrlState {
  view: ViewMode;
  search: string;
  colors: string[];
  postcodes: string[];
  professions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
}

export const useUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current URL state
  const urlState: UrlState = useMemo(() => {
    return {
      view: (searchParams.get('view') as ViewMode) || 'grid',
      search: searchParams.get('search') || '',
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
      professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
      onlyVisited: searchParams.get('visited') === 'true',
      onlyFavorites: searchParams.get('favorites') === 'true',
    };
  }, [searchParams]);

  // Update URL state helper
  const updateUrlState = useCallback((updates: Partial<UrlState>) => {
    const newParams = new URLSearchParams(searchParams);
    const newState = { ...urlState, ...updates };

    // Handle view mode
    if (newState.view !== 'grid') {
      newParams.set('view', newState.view);
    } else {
      newParams.delete('view');
    }

    // Handle search
    if (newState.search.trim()) {
      newParams.set('search', newState.search);
    } else {
      newParams.delete('search');
    }

    // Handle array filters
    if (newState.colors.length > 0) {
      newParams.set('colors', newState.colors.join(','));
    } else {
      newParams.delete('colors');
    }

    if (newState.postcodes.length > 0) {
      newParams.set('postcodes', newState.postcodes.join(','));
    } else {
      newParams.delete('postcodes');
    }

    if (newState.professions.length > 0) {
      newParams.set('professions', newState.professions.join(','));
    } else {
      newParams.delete('professions');
    }

    // Handle boolean filters
    if (newState.onlyVisited) {
      newParams.set('visited', 'true');
    } else {
      newParams.delete('visited');
    }

    if (newState.onlyFavorites) {
      newParams.set('favorites', 'true');
    } else {
      newParams.delete('favorites');
    }

    setSearchParams(newParams, { replace: true });
  }, [searchParams, urlState, setSearchParams]);

  // Individual setters for convenience
  const setViewMode = useCallback((view: ViewMode) => {
    updateUrlState({ view });
  }, [updateUrlState]);

  const setSearch = useCallback((search: string) => {
    updateUrlState({ search });
  }, [updateUrlState]);

  const setFilters = useCallback((filters: Partial<Pick<UrlState, 'colors' | 'postcodes' | 'professions' | 'onlyVisited' | 'onlyFavorites'>>) => {
    updateUrlState(filters);
  }, [updateUrlState]);

  const resetFilters = useCallback(() => {
    updateUrlState({
      search: '',
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false,
    });
  }, [updateUrlState]);

  return {
    urlState,
    updateUrlState,
    setViewMode,
    setSearch,
    setFilters,
    resetFilters,
  };
};