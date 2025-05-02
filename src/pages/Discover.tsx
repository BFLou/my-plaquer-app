import React, { useState, useEffect } from "react";
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
  type Plaque,
  type ViewMode
} from "@/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

// Mock data for plaques - in a real app, this would be fetched from an API
const PLAQUES = [
  { 
    id: 1, 
    title: "Charles Dickens", 
    location: "48 Doughty Street, Camden", 
    postcode: "WC1N",
    color: "blue",
    profession: "Author",
    description: "The famous author lived here from 1837 to 1839, where he wrote Oliver Twist and Nicholas Nickleby.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  { 
    id: 2, 
    title: "Florence Nightingale", 
    location: "10 South Street, Westminster", 
    postcode: "W1K",
    color: "blue",
    profession: "Nurse",
    description: "The pioneering nurse lived here from 1865 until her death in 1910.",
    visited: false,
    image: "/api/placeholder/400/300"
  },
  { 
    id: 3, 
    title: "Jimi Hendrix", 
    location: "23 Brook Street, Mayfair", 
    postcode: "W1K",
    color: "blue",
    profession: "Musician",
    description: "The legendary guitarist lived here in 1968-69, next door to Handel's former home.",
    visited: false,
    image: "/api/placeholder/400/300"
  },
  { 
    id: 4, 
    title: "Sir Isaac Newton", 
    location: "87 Jermyn Street, St. James's", 
    postcode: "SW1Y",
    color: "blue",
    profession: "Scientist",
    description: "The mathematician and physicist lived here from 1696 to 1700.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  { 
    id: 5, 
    title: "George Orwell", 
    location: "27b Canonbury Square, Islington", 
    postcode: "N1",
    color: "green",
    profession: "Author",
    description: "The author of '1984' and 'Animal Farm' lived here from 1944 to 1947.",
    visited: false,
    image: "/api/placeholder/400/300"
  },
  { 
    id: 6, 
    title: "Emmeline Pankhurst", 
    location: "50 Clarendon Road, Holland Park", 
    postcode: "W11",
    color: "blue",
    profession: "Activist",
    description: "The suffragette leader lived here from 1916 until her death in 1928.",
    visited: false,
    image: "/api/placeholder/400/300"
  }
];

// Available filter options
const POSTCODES = ["WC1N", "W1K", "N1", "SW1Y", "W11"];
const PROFESSIONS = ["Author", "Scientist", "Musician", "Activist", "Nurse", "Politician"];
const PLAQUE_COLORS = ["Blue", "Green", "Brown", "Black"];

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [favorites, setFavorites] = useState<number[]>([1, 4]); // Pre-favorite some plaques
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
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
    
    const category = searchParams.get('category');
    if (category === 'authors') {
      setProfession('Author');
    } else if (category === 'scientists') {
      setProfession('Scientist');
    }
    
    const location = searchParams.get('location');
    if (location === 'westminster') {
      setPostcode('W1K');
    }
  }, []);

  // Update URL when filters or view mode change
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
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [viewMode, searchQuery, postcode, plaqueColor, profession, onlyVisited, onlyFavorites]);

  // Apply filters to get filtered plaques
  const filteredPlaques = PLAQUES.filter((plaque) => {
    const matchesSearch = plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plaque.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPostcode = postcode ? plaque.postcode === postcode : true;
    const matchesColor = plaqueColor ? plaque.color.toLowerCase() === plaqueColor.toLowerCase() : true;
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

  // Sort plaques based on the selected option
  const sortedPlaques = [...filteredPlaques].sort((a, b) => {
    if (sortOption === 'a-z') return a.title.localeCompare(b.title);
    if (sortOption === 'z-a') return b.title.localeCompare(a.title);
    return a.id - b.id; // Default to newest
  });

  // Handler functions
  const handleSearch = () => {
    // URL updating is handled by the useEffect
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
    setFiltersOpen(false);
  };

  const categories = [
    { label: "Famous Authors", onClick: () => { setProfession('Author'); handleSearch(); } },
    { label: "Women in History", onClick: () => { setSearchQuery(''); setProfession(''); handleSearch(); } },
    { label: "Scientists", onClick: () => { setProfession('Scientist'); handleSearch(); } },
    { label: "Westminster", onClick: () => { setPostcode('W1K'); handleSearch(); } },
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
    return PLAQUES.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };

  return (
    <PageContainer activePage="discover">
      {/* Search Hero */}
      <SearchHero
        title="Discover London's Plaques"
        subtitle="Explore London's rich history through its blue plaques and historical markers."
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
            {sortedPlaques.length} {sortedPlaques.length === 1 ? 'Plaque' : 'Plaques'}
          </h2>
          
          <ViewToggle
            viewMode={viewMode}
            onChange={handleViewModeChange}
            variant="tabs"
            className="md:hidden"
          />
        </div>
        
        {sortedPlaques.length > 0 ? (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedPlaques.map((plaque) => (
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
                {sortedPlaques.map((plaque) => (
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
              {POSTCODES.map(code => (
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
              {PLAQUE_COLORS.map(color => (
                <SelectItem key={color} value={color.toLowerCase()}>{color}</SelectItem>
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
              {PROFESSIONS.map(prof => (
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