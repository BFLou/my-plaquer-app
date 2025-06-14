import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plaque } from '@/types/plaque';

type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type UsePlaqueFiltersOptions = {
  initialSearchQuery?: string;
  initialPostcodes?: string[];
  initialColors?: string[];
  initialProfessions?: string[];
  initialOnlyVisited?: boolean;
  initialOnlyFavorites?: boolean;
  initialSortOption?: string;
  initialFavorites?: number[];
};

export const usePlaqueFilters = (
  allPlaques: Plaque[],
  options: UsePlaqueFiltersOptions = {}
) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>(
    options.initialSearchQuery || ''
  );
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>(
    options.initialPostcodes || []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    options.initialColors || []
  );
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(
    options.initialProfessions || []
  );
  const [onlyVisited, setOnlyVisited] = useState<boolean>(
    options.initialOnlyVisited || false
  );
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(
    options.initialOnlyFavorites || false
  );
  const [sortOption, setSortOption] = useState<string>(
    options.initialSortOption || 'newest'
  );
  const [favorites, setFavorites] = useState<number[]>(
    options.initialFavorites || []
  );

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState<FilterOption[]>([]);
  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [professionOptions, setProfessionOptions] = useState<FilterOption[]>(
    []
  );

  // Extract filter options from data
  useEffect(() => {
    if (allPlaques.length > 0) {
      // Get unique postcode options
      const postcodes = [
        ...new Set(
          allPlaques
            .filter((p) => p.postcode && p.postcode !== 'Unknown')
            .map((p) => p.postcode as string)
        ),
      ]
        .sort()
        .map((code) => ({ label: code, value: code }));
      setPostcodeOptions(postcodes);

      // Get unique color options
      const colors = [
        ...new Set(
          allPlaques
            .filter((p) => p.color && p.color !== 'Unknown')
            .map((p) => p.color?.toLowerCase() as string)
        ),
      ]
        .sort()
        .map((color) => ({
          label: color.charAt(0).toUpperCase() + color.slice(1),
          value: color,
        }));
      setColorOptions(colors);

      // Get unique profession options
      const professions = [
        ...new Set(
          allPlaques
            .filter((p) => p.profession && p.profession !== 'Unknown')
            .map((p) => p.profession as string)
        ),
      ]
        .sort()
        .map((prof) => ({
          label: prof.charAt(0).toUpperCase() + prof.slice(1),
          value: prof,
        }));
      setProfessionOptions(professions);
    }
  }, [allPlaques]);

  // Apply filters to get filtered plaques
  const filteredPlaques = useMemo(() => {
    return allPlaques.filter((plaque) => {
      // Match search query
      const matchesSearch =
        searchQuery === '' ||
        plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false ||
        plaque.inscription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false ||
        plaque.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false ||
        plaque.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      // Match postcode (any selected, or all if none selected)
      const matchesPostcode =
        selectedPostcodes.length === 0 ||
        (plaque.postcode && selectedPostcodes.includes(plaque.postcode));

      // Match color (any selected, or all if none selected)
      const matchesColor =
        selectedColors.length === 0 ||
        (plaque.color && selectedColors.includes(plaque.color.toLowerCase()));

      // Match profession (any selected, or all if none selected)
      const matchesProfession =
        selectedProfessions.length === 0 ||
        (plaque.profession && selectedProfessions.includes(plaque.profession));

      // Match visited status
      const matchesVisited = onlyVisited ? plaque.visited : true;

      // Match favorite status
      const matchesFavorite = onlyFavorites
        ? favorites.includes(plaque.id)
        : true;

      return (
        matchesSearch &&
        matchesPostcode &&
        matchesColor &&
        matchesProfession &&
        matchesVisited &&
        matchesFavorite
      );
    });
  }, [
    allPlaques,
    searchQuery,
    selectedPostcodes,
    selectedColors,
    selectedProfessions,
    onlyVisited,
    onlyFavorites,
    favorites,
  ]);

  // Sort plaques
  const sortedPlaques = useMemo(() => {
    return [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z')
        return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a')
        return (b.title || '').localeCompare(a.title || '');
      return b.id - a.id; // Default to newest
    });
  }, [filteredPlaques, sortOption]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPostcodes([]);
    setSelectedColors([]);
    setSelectedProfessions([]);
    setOnlyVisited(false);
    setOnlyFavorites(false);
  }, []);

  // Toggle a favorite
  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  }, []);

  // Generate active filters for display
  const activeFilters = useMemo(
    () => [
      ...selectedPostcodes.map((code) => `Postcode: ${code}`),
      ...selectedColors.map(
        (color) => `Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`
      ),
      ...selectedProfessions.map(
        (prof) => `Profession: ${prof.charAt(0).toUpperCase() + prof.slice(1)}`
      ),
      ...(onlyVisited ? ['Visited'] : []),
      ...(onlyFavorites ? ['Favorites'] : []),
    ],
    [
      selectedPostcodes,
      selectedColors,
      selectedProfessions,
      onlyVisited,
      onlyFavorites,
    ]
  );

  return {
    // Filter states
    searchQuery,
    setSearchQuery,
    selectedPostcodes,
    setSelectedPostcodes,
    selectedColors,
    setSelectedColors,
    selectedProfessions,
    setSelectedProfessions,
    onlyVisited,
    setOnlyVisited,
    onlyFavorites,
    setOnlyFavorites,
    sortOption,
    setSortOption,
    favorites,
    setFavorites,

    // Filter options
    postcodeOptions,
    colorOptions,
    professionOptions,

    // Results
    filteredPlaques,
    sortedPlaques,

    // Actions
    resetFilters,
    toggleFavorite,

    // Active filters info
    activeFilters,
    activeFiltersCount: activeFilters.length,
  };
};

export default usePlaqueFilters;
