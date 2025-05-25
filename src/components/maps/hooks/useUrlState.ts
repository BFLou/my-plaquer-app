// src/hooks/useUrlState.ts - Fixed version preventing infinite loops
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type ViewMode = 'grid' | 'list' | 'map';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const isInitialMount = useRef(true);
  const lastLocationSearch = useRef<string>('');
  
  // Parse current URL params with memoization
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

  // Initialize state only once
  const [urlState, setUrlState] = useState<UrlState>(() => parseUrlParams());

  // Update state when URL changes (back/forward navigation)
  // Only if it's not from our own update and the search actually changed
  useEffect(() => {
    if (!isUpdating && location.search !== lastLocationSearch.current) {
      const newState = parseUrlParams();
      setUrlState(newState);
      lastLocationSearch.current = location.search;
    }
  }, [location.search, parseUrlParams, isUpdating]);

  // Track initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastLocationSearch.current = location.search;
    }
  }, [location.search]);

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
    // Prevent updates during mounting or if already updating
    if (isInitialMount.current || isUpdating) {
      return;
    }

    setIsUpdating(true);
    
    const newState = { ...urlState, ...updates };
    const searchParams = buildUrlParams(newState);
    const newUrl = `${location.pathname}${searchParams ? `?${searchParams}` : ''}`;
    
    // Only navigate if URL actually changed
    if (newUrl !== `${location.pathname}${location.search}`) {
      if (options?.replace) {
        navigate(newUrl, { replace: true });
      } else {
        navigate(newUrl);
      }
      lastLocationSearch.current = searchParams;
    }
    
    setUrlState(newState);
    
    // Reset updating flag after navigation
    setTimeout(() => setIsUpdating(false), 50);
  }, [urlState, buildUrlParams, location.pathname, location.search, navigate, isUpdating]);

  // Specific updaters for common operations
  const setViewMode = useCallback((view: ViewMode) => {
    if (view !== urlState.view && !isUpdating) {
      updateUrl({ view }, { replace: true });
    }
  }, [urlState.view, updateUrl, isUpdating]);

  const setSearch = useCallback((search: string) => {
    if (search !== urlState.search && !isUpdating) {
      updateUrl({ search });
    }
  }, [urlState.search, updateUrl, isUpdating]);

  const setFilters = useCallback((filters: {
    colors?: string[];
    postcodes?: string[];
    professions?: string[];
    onlyVisited?: boolean;
    onlyFavorites?: boolean;
  }) => {
    if (!isUpdating) {
      updateUrl(filters);
    }
  }, [updateUrl, isUpdating]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    if (!isUpdating) {
      updateUrl({
        search: '',
        colors: [],
        postcodes: [],
        professions: [],
        onlyVisited: false,
        onlyFavorites: false,
      });
    }
  }, [updateUrl, isUpdating]);

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