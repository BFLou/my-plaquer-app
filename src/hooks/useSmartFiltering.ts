// src/hooks/useSmartFiltering.ts
import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface FilterState {
  // Real-time filters (apply immediately)
  search: string;
  onlyVisited: boolean;
  onlyFavorites: boolean;
  
  // Batch filters (require apply)
  colors: string[];
  postcodes: string[];
  professions: string[];
  organisations: string[];
  
  // Complex filters (require apply with preview)
  distanceFilter?: {
    enabled: boolean;
    center: [number, number] | null;
    radius: number;
    locationName: string | null;
  };
}

interface UseSmartFilteringProps {
  initialState: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  debounceMs?: number;
}

export const useSmartFiltering = ({
  initialState,
  onFiltersChange,
  debounceMs = 300
}: UseSmartFilteringProps) => {
  // Separate state for real-time and batch filters
  const [realTimeFilters, setRealTimeFilters] = useState({
    search: initialState.search,
    onlyVisited: initialState.onlyVisited,
    onlyFavorites: initialState.onlyFavorites
  });
  
  const [batchFilters, setBatchFilters] = useState({
    colors: initialState.colors,
    postcodes: initialState.postcodes,
    professions: initialState.professions,
    organisations: initialState.organisations,
    distanceFilter: initialState.distanceFilter
  });
  
  const [pendingBatchFilters, setPendingBatchFilters] = useState(batchFilters);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

  // Debounced search handler
  const debouncedSearchChange = useMemo(
    () => debounce((searchTerm: string) => {
      const newFilters = { ...realTimeFilters, ...batchFilters, search: searchTerm };
      onFiltersChange(newFilters);
    }, debounceMs),
    [realTimeFilters, batchFilters, onFiltersChange, debounceMs]
  );

  // Real-time filter handlers
  const updateRealTimeFilter = useCallback((
    filterType: keyof typeof realTimeFilters,
    value: any
  ) => {
    const newRealTimeFilters = { ...realTimeFilters, [filterType]: value };
    setRealTimeFilters(newRealTimeFilters);
    
    if (filterType === 'search') {
      debouncedSearchChange(value);
    } else {
      // Apply immediately for toggles
      const newFilters = { ...newRealTimeFilters, ...batchFilters };
      onFiltersChange(newFilters);
    }
  }, [realTimeFilters, batchFilters, onFiltersChange, debouncedSearchChange]);

  // Batch filter handlers
  const updateBatchFilter = useCallback((
    filterType: keyof typeof batchFilters,
    value: any
  ) => {
    const newPendingFilters = { ...pendingBatchFilters, [filterType]: value };
    setPendingBatchFilters(newPendingFilters);
    
    // Check if there are unapplied changes
    const hasChanges = JSON.stringify(newPendingFilters) !== JSON.stringify(batchFilters);
    setHasUnappliedChanges(hasChanges);
  }, [pendingBatchFilters, batchFilters]);

  // Apply batch filters
  const applyBatchFilters = useCallback(() => {
    setBatchFilters(pendingBatchFilters);
    setHasUnappliedChanges(false);
    
    const newFilters = { ...realTimeFilters, ...pendingBatchFilters };
    onFiltersChange(newFilters);
  }, [pendingBatchFilters, realTimeFilters, onFiltersChange]);

  // Cancel batch filter changes
  const cancelBatchFilters = useCallback(() => {
    setPendingBatchFilters(batchFilters);
    setHasUnappliedChanges(false);
  }, [batchFilters]);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    const resetState = {
      search: '',
      onlyVisited: false,
      onlyFavorites: false,
      colors: [],
      postcodes: [],
      professions: [],
      organisations: [],
      distanceFilter: {
        enabled: false,
        center: null,
        radius: 1,
        locationName: null
      }
    };
    
    setRealTimeFilters({
      search: resetState.search,
      onlyVisited: resetState.onlyVisited,
      onlyFavorites: resetState.onlyFavorites
    });
    
    const resetBatch = {
      colors: resetState.colors,
      postcodes: resetState.postcodes,
      professions: resetState.professions,
      organisations: resetState.organisations,
      distanceFilter: resetState.distanceFilter
    };
    
    setBatchFilters(resetBatch);
    setPendingBatchFilters(resetBatch);
    setHasUnappliedChanges(false);
    
    onFiltersChange(resetState);
  }, [onFiltersChange]);

  // Get current combined filter state
  const currentFilters = useMemo(() => ({
    ...realTimeFilters,
    ...batchFilters
  }), [realTimeFilters, batchFilters]);

  // Get pending filter state (for preview)
  const pendingFilters = useMemo(() => ({
    ...realTimeFilters,
    ...pendingBatchFilters
  }), [realTimeFilters, pendingBatchFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    const filters = currentFilters;
    return (
      (filters.search ? 1 : 0) +
      filters.colors.length +
      filters.postcodes.length +
      filters.professions.length +
      filters.organisations.length +
      (filters.onlyVisited ? 1 : 0) +
      (filters.onlyFavorites ? 1 : 0) +
      (filters.distanceFilter?.enabled ? 1 : 0)
    );
  }, [currentFilters]);

  return {
    // Current state
    currentFilters,
    pendingFilters,
    hasUnappliedChanges,
    activeFilterCount,
    
    // Real-time filter handlers
    updateSearch: (value: string) => updateRealTimeFilter('search', value),
    updateVisited: (value: boolean) => updateRealTimeFilter('onlyVisited', value),
    updateFavorites: (value: boolean) => updateRealTimeFilter('onlyFavorites', value),
    
    // Batch filter handlers
    updateColors: (value: string[]) => updateBatchFilter('colors', value),
    updatePostcodes: (value: string[]) => updateBatchFilter('postcodes', value),
    updateProfessions: (value: string[]) => updateBatchFilter('professions', value),
    updateOrganisations: (value: string[]) => updateBatchFilter('organisations', value),
    updateDistanceFilter: (value: any) => updateBatchFilter('distanceFilter', value),
    
    // Batch operations
    applyBatchFilters,
    cancelBatchFilters,
    resetAllFilters,
    
    // Utility functions
    removeFilter: (filterType: string, value?: string) => {
      if (['search', 'onlyVisited', 'onlyFavorites'].includes(filterType)) {
        updateRealTimeFilter(filterType as any, filterType === 'search' ? '' : false);
      } else if (filterType === 'distanceFilter') {
        updateBatchFilter('distanceFilter', { enabled: false, center: null, radius: 1, locationName: null });
        applyBatchFilters();
      } else {
        // Array filters
        const currentValues = (pendingFilters as any)[filterType] || [];
        const newValues = value ? currentValues.filter((v: string) => v !== value) : [];
        updateBatchFilter(filterType as any, newValues);
        applyBatchFilters();
      }
    }
  };
};