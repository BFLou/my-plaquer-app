import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MapIcon, Filter as FilterIcon, Search,
  Map, Grid, List, BadgeCheck, FilterX,
  Navigation, Route as RouteIcon, X, Trash, 
  MapPin, CornerUpLeft
} from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import Pagination from '@/components/plaques/Pagination';
import MultiSelectFilter from '../components/common/MultiSelectFilter';
import { cn } from "@/lib/utils";
import PlaqueDataDebugger from '../components/debug/PlaqueDataDebugger';
import PlaqueMap from '../components/maps/PlaqueMap';
import RouteBuilder from '../components/plaques/RouteBuilder';
import '../styles/map-styles.css'; // Make sure this is imported

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
      {/* Added z-[9999] class to ensure it appears above map */}
      <SheetContent side="left" className={`w-full sm:max-w-md ${className} z-[9999]`}>
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
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to map view
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [favorites, setFavorites] = useState([]);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maintainMapView, setMaintainMapView] = useState(false);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [isRoutingMode, setIsRoutingMode] = useState(false);

  
  // Pagination state (for list/grid views)
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

  const toggleRoutingMode = () => {
    setIsRoutingMode(!isRoutingMode);
    if (isRoutingMode) {
      clearRoute();
    } else {
      toast.success("Route planning mode activated. Click on plaques to add them to your route.");
    }
  };

  // Add plaque to route
  const addPlaqueToRoute = (plaque: Plaque) => {
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info("This plaque is already in your route.");
      return;
    }
    
    setRoutePoints(prev => [...prev, plaque]);
    toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
  };

  // Remove plaque from route
  const removePlaqueFromRoute = (plaqueId: number) => {
    setRoutePoints(prev => prev.filter(p => p.id !== plaqueId));
    toast.info("Removed plaque from route");
  };

  // Clear route
  const clearRoute = () => {
    setRoutePoints([]);
    setIsRoutingMode(false);
    toast.info("Route cleared");
  };

  // Draw route on map
  const drawRoute = (plaquesForRoute: Plaque[]) => {
    if (plaquesForRoute.length < 2) {
      toast.error("Add at least two plaques to create a route");
      return;
    }
    
    toast.success(`Created route with ${plaquesForRoute.length} stops`);
  };

  // Find user location
  const findUserLocation = () => {
    toast.info("Finding your location...");
    // This function is implemented in the PlaqueMap component
  };

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

  
  // Sort and paginate plaques (for list/grid views)
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
    
    if (viewMode !== 'list') { // Changed default to 'map'
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
    // Set maintainMapView to true when a plaque is selected
    // This tells the map component to maintain its current view
    setMaintainMapView(true);
    setSelectedPlaque(plaque);
  };

  const handleCloseDetail = () => {
    // Keep maintainMapView true when closing the detail panel
    // This way, when selectedPlaque becomes null, the map won't reset
    setSelectedPlaque(null);
    // We don't set maintainMapView back to false here
  };

  const resetMapView = () => {
    setMaintainMapView(false);
  };  

  const handleMarkVisited = (id: number) => {
    // Mark plaque as visited
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
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };

  // Generate active filters for display
  const activeFilters = [
    ...selectedPostcodes.map(code => `Postcode: ${code}`),
    ...selectedColors.map(color => `Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`),
    ...selectedProfessions.map(prof => `Profession: ${prof.charAt(0).toUpperCase() + prof.slice(1)}`),
    ...(onlyVisited ? ['Visited'] : []),
    ...(onlyFavorites ? ['Favorites'] : [])
  ];

  // Get the total count of active filters
  const activeFiltersCount = activeFilters.length;

  return (
    <PageContainer activePage="discover" containerClass="flex flex-col">
      {/* View Mode Selection Tabs - Now prominently featured at the top */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Left side: View Mode Tabs */}
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => handleViewModeChange(value as ViewMode)}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="map" className="flex-1 sm:flex-initial">
                  <Map size={16} className="mr-2" /> Map View
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex-1 sm:flex-initial">
                  <Grid size={16} className="mr-2" /> Grid View
                </TabsTrigger>
                <TabsTrigger value="list" className="flex-1 sm:flex-initial">
                  <List size={16} className="mr-2" /> List View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Right side: Search and Filter */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search plaques..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-300"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0"
                onClick={() => setFiltersOpen(true)}
              >
                <FilterIcon size={16} className="mr-1" /> 
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
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 flex-grow relative">
        {/* Status bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-600">
            {loading ? "Loading plaques..." : (
              <>
                {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
              </>
            )}
          </h2>
          
          {viewMode !== 'map' && (
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
          )}
        </div>
        
        {loading ? (
          // Loading states for different view modes
          viewMode === 'map' ? (
            <div className="h-[650px] bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          )
        ) : filteredPlaques.length > 0 ? (
          <>
            {viewMode === 'map' && (
              <div className="relative">
                <div className="h-[650px]">
                  <PlaqueMap
                    plaques={filteredPlaques}
                    onPlaqueClick={handlePlaqueClick}
                    favorites={favorites}
                    selectedPlaqueId={selectedPlaque?.id}
                    maintainView={maintainMapView}
                    className="h-full w-full"
                    // Added props for routing
                    isRoutingMode={isRoutingMode}
                    toggleRoutingMode={toggleRoutingMode}
                    routePoints={routePoints}
                    addPlaqueToRoute={addPlaqueToRoute}
                    removePlaqueFromRoute={removePlaqueFromRoute}
                    drawRoute={drawRoute}
                    onFindLocation={findUserLocation}
                  />
                </div>
                
                {/* Route planning toggle button */}
                <div className="absolute bottom-6 left-6 z-50">
                  <Button 
                    variant={isRoutingMode ? "default" : "outline"}
                    onClick={toggleRoutingMode}
                    className={`flex items-center gap-2 ${isRoutingMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    size="sm"
                  >
                    <RouteIcon size={16} />
                    {isRoutingMode ? 'Exit Route Planning' : 'Plan a Route'}
                    {routePoints.length > 0 && (
                      <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-white text-green-600">
                        {routePoints.length}
                      </Badge>
                    )}
                  </Button>
                </div>
                
                {/* Active route display */}
                {isRoutingMode && routePoints.length > 0 && (
 <div className="absolute left-6 bottom-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72">
 <div className="flex justify-between items-center mb-2">
   <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
     <RouteIcon size={16} />
     Route Builder ({routePoints.length} stops)
   </h3>
   <Button 
     variant="ghost" 
     size="sm" 
     className="h-6 w-6 p-0" 
     onClick={clearRoute}
   >
     <X size={14} />
   </Button>
 </div>
 <div className="max-h-40 overflow-y-auto">
   {routePoints.map((point, index) => (
     <div key={point.id} className="flex items-center gap-2 p-1 text-sm">
       <Badge className="h-5 w-5 flex items-center justify-center p-0">{index + 1}</Badge>
       <div className="flex-grow truncate">{point.title}</div>
       <Button 
         variant="ghost" 
         size="sm" 
         className="h-6 w-6 p-0 text-red-500" 
         onClick={() => removePlaqueFromRoute(point.id)}
       >
         <Trash size={14} />
       </Button>
     </div>
   ))}
 </div>
</div>
)}

{/* Route planning indicator */}
{isRoutingMode && (
<div className="absolute top-6 left-6 z-50 bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-medium border border-green-200">
 Route Planning Mode Active
</div>
)}
</div>
)}

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

{/* Pagination for grid and list views */}
{viewMode !== 'map' && totalPages > 1 && (
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

{/* Plaque Detail - added z-[9999] class to ensure it appears above map */}
<PlaqueDetail
plaque={selectedPlaque}
isOpen={!!selectedPlaque}
onClose={handleCloseDetail}
isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
onFavoriteToggle={toggleFavorite}
onMarkVisited={handleMarkVisited}
nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
onSelectNearbyPlaque={handlePlaqueClick}
className="z-[9999]"
/>

{/* ImprovedFilterSheet - z-index is set in the component */}
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
onProfessionsChange={setProfessionOptions}

onlyVisited={onlyVisited}
onVisitedChange={setOnlyVisited}

onlyFavorites={onlyFavorites}
onFavoritesChange={setOnlyFavorites}
/>
</PageContainer>
);
};

export default Discover;