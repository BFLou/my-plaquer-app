import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapIcon } from "lucide-react";
import { 
  PageContainer,
  PlaqueCard,
  PlaqueListItem,
  PlaqueDetail,
  SearchHero,
  ViewToggle,
  FilterBar,
  FilterSheet,
  EmptyState,
} from "@/components";
import { Plaque, ViewMode } from "@/types/plaque"; // Import from types, not components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import Pagination from '@/components/plaques/Pagination'; // Import the pagination component

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]); // Store all plaques
  const [plaques, setPlaques] = useState<Plaque[]>([]);       // Store filtered plaques
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
  
  // Filter states
  const [postcode, setPostcode] = useState('');
  const [plaqueColor, setPlaqueColor] = useState('');
  const [profession, setProfession] = useState('');
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

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
    
    const profession = searchParams.get('profession');
    if (profession) {
      setProfession(profession);
    }
    
    const postcode = searchParams.get('postcode');
    if (postcode) {
      setPostcode(postcode);
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

  // Apply filters to get filtered plaques
  const filteredPlaques = useMemo(() => {
    return allPlaques.filter((plaque) => {
      const matchesSearch = 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
        (plaque.inscription?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (plaque.address?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        
      const matchesPostcode = postcode ? plaque.postcode === postcode : true;
      const matchesColor = plaqueColor ? (plaque.color?.toLowerCase() === plaqueColor.toLowerCase()) : true;
      const matchesProfession = profession ? plaque.profession === profession : true;
      const matchesVisited = onlyVisited ? plaque.visited : true;
      const matchesFavorite = onlyFavorites ? favorites.includes(plaque.id) : true;

      return matchesSearch && 
            matchesPostcode && 
            matchesColor && 
            matchesProfession && 
            matchesVisited && 
            matchesFavorite;
    });
  }, [allPlaques, searchQuery, postcode, plaqueColor, profession, onlyVisited, onlyFavorites, favorites]);

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
    
    if (postcode) {
      params.set('postcode', postcode);
    }
    
    if (plaqueColor) {
      params.set('color', plaqueColor);
    }
    
    if (profession) {
      params.set('profession', profession);
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
  }, [viewMode, searchQuery, postcode, plaqueColor, profession, onlyVisited, onlyFavorites, currentPage, navigate, location.pathname]);

  // Derive available filter options from data
  const availablePostcodes = useMemo(() => {
    return [...new Set(allPlaques
      .filter(p => p.postcode && p.postcode !== "Unknown")
      .map(p => p.postcode as string))];
  }, [allPlaques]);
    
  const availableProfessions = useMemo(() => {
    return [...new Set(allPlaques
      .filter(p => p.profession && p.profession !== "Unknown")
      .map(p => p.profession as string))];
  }, [allPlaques]);
    
  const availableColors = useMemo(() => {
    return [...new Set(allPlaques
      .filter(p => p.color && p.color !== "Unknown")
      .map(p => p.color as string))];
  }, [allPlaques]);

  // Handler functions
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
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

  const resetFilters = () => {
    setPostcode('');
    setPlaqueColor('');
    setProfession('');
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
    { label: "Notable Authors", onClick: () => { setProfession('novelist'); handleSearch(); } },
    { label: "London Landmarks", onClick: () => { setProfession('place'); handleSearch(); } },
    { label: "Musicians", onClick: () => { setProfession('composer'); handleSearch(); } },
    { label: "Legal Figures", onClick: () => { setProfession('lawyer'); handleSearch(); } },
  ];

  // Get active filters for display
  const activeFilters = [];
  if (postcode) activeFilters.push(`Postcode: ${postcode}`);
  if (plaqueColor) activeFilters.push(`Color: ${plaqueColor}`);
  if (profession) activeFilters.push(`Profession: ${profession}`);
  if (onlyVisited) activeFilters.push('Visited');
  if (onlyFavorites) activeFilters.push('Favorites');

  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };

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
            <FilterBar 
              onFilterClick={() => setFiltersOpen(true)} 
              activeFilters={activeFilters}
            />
            
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
      
      {/* Filter Sheet */}
      <FilterSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={() => setFiltersOpen(false)}
        onReset={resetFilters}
        title="Filters"
        description="Refine your plaque search"
      >
        <div className="space-y-2">
          <Label>Postcode</Label>
          <Select value={postcode} onValueChange={setPostcode}>
            <SelectTrigger>
              <SelectValue placeholder="All postcodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All postcodes</SelectItem>
              {availablePostcodes.map(code => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Plaque Color</Label>
          <Select value={plaqueColor} onValueChange={setPlaqueColor}>
            <SelectTrigger>
              <SelectValue placeholder="All colors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All colors</SelectItem>
              {availableColors.map(color => (
                <SelectItem key={color} value={color.toLowerCase()}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Profession</Label>
          <Select value={profession} onValueChange={setProfession}>
            <SelectTrigger>
              <SelectValue placeholder="All professions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All professions</SelectItem>
              {availableProfessions.map(prof => (
                <SelectItem key={prof} value={prof}>{prof}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="visited">Only show visited</Label>
            <Switch 
              id="visited" 
              checked={onlyVisited} 
              onCheckedChange={setOnlyVisited} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="favorites">Only show favorites</Label>
            <Switch 
              id="favorites" 
              checked={onlyFavorites} 
              onCheckedChange={setOnlyFavorites} 
            />
          </div>
        </div>
      </FilterSheet>
    </PageContainer>
  );
};

export default Discover;