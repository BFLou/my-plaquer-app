import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapIcon, Filter as FilterIcon, SlidersHorizontal, BadgeCheck, FilterX } from "lucide-react";
import { 
  PageContainer,
  PlaqueCard,
  PlaqueListItem,
  PlaqueDetail,
  SearchHero,
  ViewToggle,
  EmptyState,
} from "@/components";
import { Plaque, ViewMode } from "@/types/plaque";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import Pagination from '@/components/plaques/Pagination';
import  MultiSelectFilter from '../components/common/MultiSelectFilter';
import { cn } from "@/lib/utils";

// Define color options with style mapping
const getColorBadgeStyle = (color: string) => {
  switch(color.toLowerCase()) {
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'green':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'brown':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'black':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'grey':
    case 'gray':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

// Filter sheet component
type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type ImprovedFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  description?: string;
  
  // Filter state
  postcodes: FilterOption[];
  selectedPostcodes: string[];
  onPostcodesChange: (values: string[]) => void;
  
  colors: FilterOption[];
  selectedColors: string[];
  onColorsChange: (values: string[]) => void;
  
  professions: FilterOption[];
  selectedProfessions: string[];
  onProfessionsChange: (values: string[]) => void;
  
  onlyVisited: boolean;
  onVisitedChange: (value: boolean) => void;
  
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  
  className?: string;
};

const ImprovedFilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = "Filters",
  description = "Refine your search",
  
  postcodes,
  selectedPostcodes,
  onPostcodesChange,
  
  colors,
  selectedColors,
  onColorsChange,
  
  professions,
  selectedProfessions,
  onProfessionsChange,
  
  onlyVisited,
  onVisitedChange,
  
  onlyFavorites,
  onFavoritesChange,
  
  className = ''
}: ImprovedFilterSheetProps) => {
  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Count total active filters
  const activeFiltersCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className={`w-full sm:max-w-md ${className}`}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="font-normal">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <Label className="text-base">Location</Label>
            <MultiSelectFilter
              options={postcodes}
              selected={selectedPostcodes}
              onChange={onPostcodesChange}
              placeholder="All postcodes"
              searchPlaceholder="Search postcodes..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Plaque Colors</Label>
            <MultiSelectFilter
              options={colors}
              selected={selectedColors}
              onChange={onColorsChange}
              placeholder="All colors"
              searchPlaceholder="Search colors..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Professions</Label>
            <MultiSelectFilter
              options={professions}
              selected={selectedProfessions}
              onChange={onProfessionsChange}
              placeholder="All professions"
              searchPlaceholder="Search professions..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Additional Filters</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="visited" className="text-sm">Only Visited</Label>
                <p className="text-muted-foreground text-xs">Show plaques you've visited</p>
              </div>
              <Switch 
                id="visited" 
                checked={onlyVisited} 
                onCheckedChange={onVisitedChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="favorites" className="text-sm">Favorites</Label>
                <p className="text-muted-foreground text-xs">Show only favorite plaques</p>
              </div>
              <Switch 
                id="favorites" 
                checked={onlyFavorites} 
                onCheckedChange={onFavoritesChange}
              />
            </div>
          </div>
        </div>
        
        <SheetFooter className="flex flex-row gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex-1 gap-2"
          >
            <FilterX size={16} />
            Reset All
          </Button>
          <Button 
            onClick={onApply}
            className="flex-1 gap-2"
          >
            <BadgeCheck size={16} />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]); // Store all plaques
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  
  // Enhanced filter states - now arrays for multi-select
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Options for filters - will be populated from data
  const [postcodeOptions, setPostcodeOptions] = useState<FilterOption[]>([]);
  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [professionOptions, setProfessionOptions] = useState<FilterOption[]>([]);

  // Initialize state from URL params on first load
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'grid' || view === 'list' || view === 'map')) {
      setViewMode(view);
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const postcodesParam = searchParams.get('postcodes');
    if (postcodesParam) {
      setSelectedPostcodes(postcodesParam.split(','));
    }
    
    const colorsParam = searchParams.get('colors');
    if (colorsParam) {
      setSelectedColors(colorsParam.split(','));
    }
    
    const professionsParam = searchParams.get('professions');
    if (professionsParam) {
      setSelectedProfessions(professionsParam.split(','));
    }
    
    const visited = searchParams.get('visited');
    if (visited === 'true') {
      setOnlyVisited(true);
    }
    
    const favs = searchParams.get('favorites');
    if (favs === 'true') {
      setOnlyFavorites(true);
    }
    
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page, 10));
    }
  }, []);

  // Load plaque data
  useEffect(() => {
    try {
      setLoading(true);
      
      // Use imported data
      const adaptedData = adaptPlaquesData(plaqueData);
      
      // Set some plaques as visited and add to favorites for demo
      if (adaptedData.length > 0) {
        adaptedData[0].visited = true;
        adaptedData[2].visited = true;
        setFavorites([adaptedData[0].id, adaptedData[1].id]);
      }
      
      setAllPlaques(adaptedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading plaque data:', error);
      setLoading(false);
      toast({
        title: "Error loading plaque data",
        description: "Could not load the plaque data. Please try again later.",
        duration: 3000,
      });
    }
  }, []);

  // Derive filter options from data
  useEffect(() => {
    if (allPlaques.length > 0) {
      // Get unique postcode options
      const postcodes = [...new Set(allPlaques
        .filter(p => p.postcode && p.postcode !== "Unknown")
        .map(p => p.postcode as string))]
        .sort()
        .map(code => ({ label: code, value: code }));
      setPostcodeOptions(postcodes);
      
      // Get unique color options with style mapping
      const colors = [...new Set(allPlaques
        .filter(p => p.color && p.color !== "Unknown")
        .map(p => p.color?.toLowerCase() as string))]
        .sort()
        .map(color => ({ 
          label: color.charAt(0).toUpperCase() + color.slice(1), 
          value: color,
          color: getColorBadgeStyle(color)
        }));
      setColorOptions(colors);
      
      // Get unique profession options
      const professions = [...new Set(allPlaques
        .filter(p => p.profession && p.profession !== "Unknown")
        .map(p => p.profession as string))]
        .sort()
        .map(prof => ({ 
          label: prof.charAt(0).toUpperCase() + prof.slice(1), 
          value: prof 
        }));
      setProfessionOptions(professions);
    }
  }, [allPlaques]);

  // Apply filters to get filtered plaques
  const filteredPlaques = useMemo(() => {
    return allPlaques.filter((plaque) => {
      // Match search query
      const matchesSearch = 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
        (plaque.inscription?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (plaque.address?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      // Match postcode (any selected, or all if none selected)
      const matchesPostcode = selectedPostcodes.length === 0 || 
        (plaque.postcode && selectedPostcodes.includes(plaque.postcode));
      
      // Match color (any selected, or all if none selected)
      const matchesColor = selectedColors.length === 0 || 
        (plaque.color && selectedColors.includes(plaque.color.toLowerCase()));
      
      // Match profession (any selected, or all if none selected)
      const matchesProfession = selectedProfessions.length === 0 || 
        (plaque.profession && selectedProfessions.includes(plaque.profession));
      
      // Match visited status
      const matchesVisited = onlyVisited ? plaque.visited : true;
      
      // Match favorite status
      const matchesFavorite = onlyFavorites ? favorites.includes(plaque.id) : true;

      return matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;
    });
  }, [allPlaques, searchQuery, selectedPostcodes, selectedColors, selectedProfessions, onlyVisited, onlyFavorites, favorites]);

  // Sort and paginate plaques
  const sortedAndPaginatedPlaques = useMemo(() => {
    // Sort plaques
    const sorted = [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return b.id - a.id; // Default to newest
    });
    
    // Calculate total pages
    const total = Math.ceil(sorted.length / itemsPerPage);
    setTotalPages(total);
    
    // Adjust current page if needed
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
    
    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [filteredPlaques, sortOption, currentPage, itemsPerPage]);

  // Update URL when filters, sort, or page change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (selectedPostcodes.length > 0) {
      params.set('postcodes', selectedPostcodes.join(','));
    }
    
    if (selectedColors.length > 0) {
      params.set('colors', selectedColors.join(','));
    }
    
    if (selectedProfessions.length > 0) {
      params.set('professions', selectedProfessions.join(','));
    }
    
    if (onlyVisited) {
      params.set('visited', 'true');
    }
    
    if (onlyFavorites) {
      params.set('favorites', 'true');
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [viewMode, searchQuery, selectedPostcodes, selectedColors, selectedProfessions, onlyVisited, onlyFavorites, currentPage, navigate, location.pathname]);

  // Handler functions
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    // Close the filter sheet if it's open when searching
    if (filtersOpen) {
      setFiltersOpen(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id) 
        : [...prev, id]
    );
    
    toast({
      title: favorites.includes(id) ? "Removed from favorites" : "Added to favorites",
      description: "Your favorites have been updated",
      duration: 2000,
    });
  };

  const handlePlaqueClick = (plaque: Plaque) => {
    setSelectedPlaque(plaque);
  };

  const handleCloseDetail = () => {
    setSelectedPlaque(null);
  };

  const handleMarkVisited = (id: number) => {
    // In a real app, this would update the plaque's visited status in the database
    setAllPlaques(prev => prev.map(p => 
      p.id === id ? { ...p, visited: true } : p
    ));
    
    toast({
      title: "Marked as visited",
      description: "This plaque has been marked as visited in your profile",
      duration: 2000,
    });
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setSelectedPostcodes([]);
    setSelectedColors([]);
    setSelectedProfessions([]);
    setOnlyVisited(false);
    setOnlyFavorites(false);
    setCurrentPage(1); // Reset to first page
    setFiltersOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Define common categories for the search hero
  const categories = [
    { label: "Notable Authors", onClick: () => { setSelectedProfessions(['novelist']); handleSearch(); } },
    { label: "London Landmarks", onClick: () => { setSelectedProfessions(['place']); handleSearch(); } },
    { label: "Musicians", onClick: () => { setSelectedProfessions(['composer']); handleSearch(); } },
    { label: "Legal Figures", onClick: () => { setSelectedProfessions(['lawyer']); handleSearch(); } },
  ];

  // Generate active filters for display
  const activeFilters = [
    ...selectedPostcodes.map(code => `Postcode: ${code}`),
    ...selectedColors.map(color => `Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`),
    ...selectedProfessions.map(prof => `Profession: ${prof.charAt(0).toUpperCase() + prof.slice(1)}`),
    ...(onlyVisited ? ['Visited'] : []),
    ...(onlyFavorites ? ['Favorites'] : [])
  ];

  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };

  // Get the total count of active filters
  const activeFiltersCount = activeFilters.length;

  return (
    <PageContainer activePage="discover">
      {/* Search Hero */}
      <SearchHero
        title="Discover London's Plaques"
        subtitle="Explore London's rich history through its commemorative plaques and historical markers."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        categories={categories}
      />
      
      {/* Filter Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-[61px] z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setFiltersOpen(true)}
            >
              <FilterIcon size={16} /> 
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            
            {/* Active filters display */}
            {activeFiltersCount > 0 && (
              <div className="hidden md:flex gap-1 items-center ml-2 overflow-x-auto max-w-md flex-wrap">
                {activeFilters.map((filter, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {filter}
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={resetFilters}
                >
                  Clear All
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="a-z">A to Z</SelectItem>
                  <SelectItem value="z-a">Z to A</SelectItem>
                </SelectContent>
              </Select>
              
              <ViewToggle
                viewMode={viewMode}
                onChange={handleViewModeChange}
                variant="tabs"
                className="hidden md:block"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {loading ? "Loading plaques..." : (
              <>
                {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'}
                {filteredPlaques.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPlaques.length)} of {filteredPlaques.length}
                  </span>
                )}
              </>
            )}
          </h2>
          
          <ViewToggle
            viewMode={viewMode}
            onChange={handleViewModeChange}
            variant="tabs"
            className="md:hidden"
          />
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredPlaques.length > 0 ? (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAndPaginatedPlaques.map((plaque) => (
                  <PlaqueCard 
                    key={plaque.id}
                    plaque={plaque}
                    isFavorite={favorites.includes(plaque.id)}
                    onFavoriteToggle={toggleFavorite}
                    onClick={handlePlaqueClick}
                  />
                ))}
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="space-y-3">
                {sortedAndPaginatedPlaques.map((plaque) => (
                  <PlaqueListItem 
                    key={plaque.id}
                    plaque={plaque}
                    isFavorite={favorites.includes(plaque.id)}
                    onFavoriteToggle={toggleFavorite}
                    onClick={handlePlaqueClick}
                  />
                ))}
              </div>
            )}
            
            {viewMode === 'map' && (
              <div className="rounded-xl overflow-hidden bg-gray-100 h-96 flex items-center justify-center text-center p-4">
                <div>
                  <MapIcon size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium text-gray-700">Map View</h3>
                  <p className="text-gray-500 mt-2">Interactive map would be displayed here with plaque locations</p>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={MapIcon}
            title="No plaques found"
            description="Try adjusting your filters or search criteria"
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        )}
      </div>
      
      {/* Plaque Detail */}
      <PlaqueDetail
        plaque={selectedPlaque}
        isOpen={!!selectedPlaque}
        onClose={handleCloseDetail}
        isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
        onFavoriteToggle={toggleFavorite}
        onMarkVisited={handleMarkVisited}
        nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
        onSelectNearbyPlaque={handlePlaqueClick}
      />
      
      {/* Enhanced Filter Sheet */}
      <ImprovedFilterSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        title="Filters"
        description="Refine your plaque search"
        
        postcodes={postcodeOptions}
        selectedPostcodes={selectedPostcodes}
        onPostcodesChange={setSelectedPostcodes}
        
        colors={colorOptions}
        selectedColors={selectedColors}
        onColorsChange={setSelectedColors}
        
        professions={professionOptions}
        selectedProfessions={selectedProfessions}
        onProfessionsChange={setSelectedProfessions}
        
        onlyVisited={onlyVisited}
        onVisitedChange={setOnlyVisited}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={setOnlyFavorites}
      />
    </PageContainer>
  );
};

export default Discover;