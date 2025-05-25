// src/hooks/useUrlState.ts - Manage URL state efficiently
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type ViewMode = 'grid' | 'list' | 'map';

interface UrlState {
  view: ViewMode;
  search: string;
  // Add other filter states as needed
  colors: string[];
  postcodes: string[];
  professions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
}

export const useUrlState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Parse current URL params
  const parseUrlParams = useCallback((): UrlState => {
    const params = new URLSearchParams(location.search);
    
    return {
      view: (params.get('view') as ViewMode) || 'grid',
      search: params.get('search') || '',
      colors: params.get('colors')?.split(',').filter(Boolean) || [],
      postcodes: params.get('postcodes')?.split(',').filter(Boolean) || [],
      professions: params.get('professions')?.split(',').filter(Boolean) || [],
      onlyVisited: params.get('visited') === 'true',
      onlyFavorites: params.get('favorites') === 'true',
    };
  }, [location.search]);

  const [urlState, setUrlState] = useState<UrlState>(parseUrlParams);

  // Update state when URL changes (back/forward navigation)
  useEffect(() => {
    if (!isUpdating) {
      setUrlState(parseUrlParams());
    }
  }, [location.search, parseUrlParams, isUpdating]);

  // Build URL params from state
  const buildUrlParams = useCallback((state: Partial<UrlState>): string => {
    const params = new URLSearchParams();
    
    // Only add non-default values to keep URL clean
    if (state.view && state.view !== 'grid') {
      params.set('view', state.view);
    }
    
    if (state.search?.trim()) {
      params.set('search', state.search.trim());
    }
    
    if (state.colors?.length) {
      params.set('colors', state.colors.join(','));
    }
    
    if (state.postcodes?.length) {
      params.set('postcodes', state.postcodes.join(','));
    }
    
    if (state.professions?.length) {
      params.set('professions', state.professions.join(','));
    }
    
    if (state.onlyVisited) {
      params.set('visited', 'true');
    }
    
    if (state.onlyFavorites) {
      params.set('favorites', 'true');
    }
    
    return params.toString();
  }, []);

  // Update URL without causing navigation reload
  const updateUrl = useCallback((updates: Partial<UrlState>, options?: { replace?: boolean }) => {
    setIsUpdating(true);
    
    const newState = { ...urlState, ...updates };
    const searchParams = buildUrlParams(newState);
    const newUrl = `${location.pathname}${searchParams ? `?${searchParams}` : ''}`;
    
    // Use replace to avoid adding to history stack for minor updates
    if (options?.replace) {
      navigate(newUrl, { replace: true });
    } else {
      navigate(newUrl);
    }
    
    setUrlState(newState);
    
    // Reset updating flag after a brief delay
    setTimeout(() => setIsUpdating(false), 100);
  }, [urlState, buildUrlParams, location.pathname, navigate]);

  // Specific updaters for common operations
  const setViewMode = useCallback((view: ViewMode) => {
    updateUrl({ view }, { replace: true }); // Replace for view changes
  }, [updateUrl]);

  const setSearch = useCallback((search: string) => {
    updateUrl({ search });
  }, [updateUrl]);

  const setFilters = useCallback((filters: {
    colors?: string[];
    postcodes?: string[];
    professions?: string[];
    onlyVisited?: boolean;
    onlyFavorites?: boolean;
  }) => {
    updateUrl(filters);
  }, [updateUrl]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    updateUrl({
      search: '',
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false,
    });
  }, [updateUrl]);

  return {
    urlState,
    setViewMode,
    setSearch,
    setFilters,
    resetFilters,
    updateUrl,
    isUpdating
  };
};