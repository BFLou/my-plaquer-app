import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  List, 
  Plus, 
  MapIcon, 
  Trash, 
  Search, 
  AlertCircle, 
  Filter,
  Sparkles,
  BookMarked,
  Collection
} from 'lucide-react';
import {
  PageContainer,
  CollectionCard,
  CollectionListItem,
  CollectionCreator,
  ViewToggle,
  EmptyState,
  ActionBar,
  type Collection as CollectionType,
  type NewCollection,
  type ViewMode
} from '@/components';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import MultiSelectFilter from '../components/common/MultiSelectFilter';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter
} from "@/components/ui/sheet";

// Sample collections data
const SAMPLE_COLLECTIONS = [
  { 
    id: 1, 
    icon: '🏛️', 
    name: 'Historic London', 
    description: 'A collection of famous plaques related to London landmarks and history', 
    plaques: 18, 
    updated: '2 days ago', 
    color: 'bg-blue-500' 
  },
  { 
    id: 2, 
    icon: '🎵', 
    name: 'Musical Icons', 
    description: 'Explore the homes and landmarks of famous musicians', 
    plaques: 12, 
    updated: 'yesterday', 
    color: 'bg-blue-600'
  },
  { 
    id: 3, 
    icon: '📚', 
    name: 'Literary Giants', 
    description: 'Famous authors and poets who lived in London', 
    plaques: 15, 
    updated: 'last week', 
    color: 'bg-blue-700'
  },
  { 
    id: 4, 
    icon: '🏛️', 
    name: 'Historic Landmarks', 
    description: 'Important historical buildings and monuments across London', 
    plaques: 22, 
    updated: '3 weeks ago', 
    color: 'bg-blue-500'
  },
  { 
    id: 5, 
    icon: '🧪', 
    name: 'Scientists & Inventors', 
    description: 'Great minds who changed the world with their discoveries', 
    plaques: 8, 
    updated: 'last month', 
    color: 'bg-blue-600'
  },
  { 
    id: 6, 
    icon: '🎨', 
    name: 'Artists & Painters', 
    description: 'Visual artists who lived and worked in London', 
    plaques: 14, 
    updated: '2 months ago', 
    color: 'bg-blue-700'
  },
];

// Simplified Filter Sheet Component
const SimpleFilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  
  types,
  selectedTypes,
  onTypesChange,
  
  plaqueCounts,
  selectedPlaqueCounts,
  onPlaqueCountsChange,
  
  className = ''
}) => {
  const handleSheetChange = (open) => {
    if (!open) {
      onClose();
    }
  };

  // Count total active filters
  const activeFiltersCount = 
    selectedTypes.length + 
    selectedPlaqueCounts.length;

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className={`w-full sm:max-w-md ${className}`}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Collections</SheetTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="font-normal">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <SheetDescription>Refine your collections view</SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <h3 className="text-base font-medium">Collection Type</h3>
            <MultiSelectFilter
              options={types}
              selected={selectedTypes}
              onChange={onTypesChange}
              placeholder="All collection types"
              searchPlaceholder="Search collection types..."
              displayBadges={true}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Number of Plaques</h3>
            <MultiSelectFilter
              options={plaqueCounts}
              selected={selectedPlaqueCounts}
              onChange={onPlaqueCountsChange}
              placeholder="Any amount"
              searchPlaceholder="Search plaque counts..."
              displayBadges={true}
            />
          </div>
        </div>
        
        <SheetFooter className="flex flex-row gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex-1"
          >
            Reset All
          </Button>
          <Button 
            onClick={onApply}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const Collections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [collections, setCollections] = useState(SAMPLE_COLLECTIONS);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Simplified filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedPlaqueCounts, setSelectedPlaqueCounts] = useState([]);
  
  // Filter options
  const typeOptions = [
    { label: 'Historical', value: 'historical' },
    { label: 'Arts & Culture', value: 'arts' },
    { label: 'Science', value: 'science' },
    { label: 'Architecture', value: 'architecture' },
    { label: 'Walking Tours', value: 'tours' },
  ];
  
  const plaqueCountOptions = [
    { label: 'Empty (0)', value: 'empty' },
    { label: 'Few (1-10)', value: 'few' },
    { label: 'Many (11-50)', value: 'many' },
    { label: 'Lots (50+)', value: 'lots' },
  ];
  
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
    
    const sort = searchParams.get('sort');
    if (sort) {
      setSortOption(sort);
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
    
    if (sortOption !== 'newest') {
      params.set('sort', sortOption);
    }
    
    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','));
    }
    
    if (selectedPlaqueCounts.length > 0) {
      params.set('counts', selectedPlaqueCounts.join(','));
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [
    viewMode, 
    searchQuery, 
    sortOption, 
    selectedTypes, 
    selectedPlaqueCounts
  ]);
  
  // Filter collections based on the current filters
  const filteredCollections = collections.filter(collection => {
    // Match search query
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Simplified filtering logic
    const matchesType = selectedTypes.length === 0 || 
                       (selectedTypes.includes('historical') && (collection.name.includes('Historic') || collection.description.includes('historical'))) ||
                       (selectedTypes.includes('arts') && (collection.name.includes('Artist') || collection.description.includes('artist'))) ||
                       (selectedTypes.includes('science') && collection.name.includes('Scientist'));
    
    // Match plaque counts
    const matchesPlaqueCounts = selectedPlaqueCounts.length === 0 || 
                              (selectedPlaqueCounts.includes('empty') && collection.plaques === 0) ||
                              (selectedPlaqueCounts.includes('few') && collection.plaques > 0 && collection.plaques <= 10) ||
                              (selectedPlaqueCounts.includes('many') && collection.plaques > 10 && collection.plaques <= 50) ||
                              (selectedPlaqueCounts.includes('lots') && collection.plaques > 50);
    
    return matchesSearch && matchesType && matchesPlaqueCounts;
  });
  
  // Sort collections based on selected option
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === 'newest') {
      // Sort by update recency (simplified for demo)
      if (a.updated.includes('now')) return -1;
      if (b.updated.includes('now')) return 1;
      if (a.updated.includes('today')) return -1;
      if (b.updated.includes('today')) return 1;
      if (a.updated.includes('yesterday')) return -1;
      if (b.updated.includes('yesterday')) return 1;
      if (a.updated.includes('days') && b.updated.includes('week')) return -1;
      if (b.updated.includes('days') && a.updated.includes('week')) return 1;
      return 0;
    }
    if (sortOption === 'oldest') return 1; // Reverse of newest
    if (sortOption === 'most_plaques') return b.plaques - a.plaques;
    if (sortOption === 'alphabetical') return a.name.localeCompare(b.name);
    return 0;
  });
  
  // Handlers
  const toggleSelect = (id) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleMenuOpen = (id) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  
  const handleEdit = (id) => {
    toast({
      title: "Edit Collection",
      description: `Editing collection ${id}`,
      duration: 2000,
    });
  };
  
  const handleDuplicate = (id) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      const newCollection = {
        ...collection,
        id: collections.length + 1,
        name: `${collection.name} (Copy)`,
        plaques: 0,
        updated: 'just now'
      };
      setCollections([...collections, newCollection]);
      
      toast({
        title: "Collection Duplicated",
        description: `Created a copy of "${collection.name}"`,
        duration: 2000,
      });
    }
  };
  
  const handleShare = (id) => {
    toast({
      title: "Share Collection",
      description: "Sharing functionality would be implemented here",
      duration: 2000,
    });
  };
  
  const handleDelete = (id) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
    
    toast({
      title: "Collection Deleted",
      description: "The collection has been deleted",
      duration: 2000,
    });
  };
  
  const handleCreateCollection = () => {
    setCreateModalOpen(true);
  };
  
  const handleSaveCollection = (newCollection) => {
    const createdCollection = {
      id: collections.length + 1,
      ...newCollection,
      plaques: 0,
      updated: 'just now'
    };
    setCollections([createdCollection, ...collections]);
    setCreateModalOpen(false);
    
    toast({
      title: "Collection Created",
      description: `"${newCollection.name}" has been created`,
      duration: 2000,
    });
  };
  
  const handleBulkDelete = () => {
    setCollections(prev => prev.filter(collection => !selectedCollections.includes(collection.id)));
    
    toast({
      title: "Collections Deleted",
      description: `${selectedCollections.length} collections have been deleted`,
      duration: 2000,
    });
    setSelectedCollections([]);
  };
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedPlaqueCounts([]);
    setSearchQuery('');
    setFilterModalOpen(false);
  };
  
  const applyFilters = () => {
    setFilterModalOpen(false);
  };
  
  // Get active filters for display
  const activeFilters = [
    ...selectedTypes.map(type => {
      const option = typeOptions.find(opt => opt.value === type);
      return option ? `Type: ${option.label}` : `Type: ${type}`;
    }),
    ...selectedPlaqueCounts.map(count => {
      const option = plaqueCountOptions.find(opt => opt.value === count);
      return option ? `Plaques: ${option.label}` : `Plaques: ${count}`;
    })
  ];

  // Calculate statistics
  const totalCollections = collections.length;
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques, 0);
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-8">
        {/* Improved Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">My Collections</h1>
              <p className="text-blue-50">Curate your own plaque discoveries around London</p>
            </div>

          </div>
        </div>
        
        {/* Stylish Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500 p-5 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-100 mb-1 text-sm font-medium">Collections</div>
                <div className="text-3xl font-bold text-white">{totalCollections}</div>
              </div>
              <div className="p-3 bg-blue-600 rounded-lg">
                <BookMarked size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 p-5 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-100 mb-1 text-sm font-medium">Total Plaques</div>
                <div className="text-3xl font-bold text-white">{totalPlaques}</div>
              </div>
              <div className="p-3 bg-blue-700 rounded-lg">
                <MapIcon size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-700 p-5 rounded-xl shadow-sm md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-100 mb-1 text-sm font-medium">Create Your Own Collection</div>
                <div className="text-white font-medium max-w-xs">Organize plaques by theme, location, or historical period</div>
              </div>
              <Button 
                onClick={handleCreateCollection} 
                className="bg-white hover:bg-gray-100 text-blue-700"
              >
                <Plus size={16} className="mr-1" /> Create
              </Button>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="sticky top-[61px] bg-white z-10 border-y border-gray-100 py-3 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filter button with badge */}
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setFilterModalOpen(true)}
              >
                <Filter size={16} /> 
                Filters
                {activeFilters.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center"
                  >
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
              
              {/* Active filters display */}
              {activeFilters.length > 0 && (
                <div className="hidden md:flex gap-1 items-center overflow-x-auto">
                  {activeFilters.slice(0, 3).map((filter, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {filter}
                    </Badge>
                  ))}
                  {activeFilters.length > 3 && (
                    <Badge variant="outline">
                      +{activeFilters.length - 3} more
                    </Badge>
                  )}
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
              
              <ViewToggle
                viewMode={viewMode}
                onChange={setViewMode}
                variant="buttons"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search collections..."
                  className="pl-8 py-2 w-full text-gray-800 min-w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Sort dropdown */}
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most_plaques">Most Plaques</SelectItem>
                  <SelectItem value="alphabetical">A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Collections List */}
        <div id="collections-list">
          {sortedCollections.length === 0 ? (
            <EmptyState
              icon={List}
              title="No Collections Found"
              description={activeFilters.length > 0 
                ? "Try adjusting your filters or search criteria" 
                : "Start organizing your plaque discoveries by creating your first collection"
              }
              actionLabel={activeFilters.length > 0 ? "Reset Filters" : "Create Your First Collection"}
              onAction={activeFilters.length > 0 ? resetFilters : handleCreateCollection}
            />
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedCollections.map((collection) => (
                    <CollectionCard 
                      key={collection.id}
                      collection={collection}
                      isSelected={selectedCollections.includes(collection.id)}
                      menuOpenId={menuOpenId}
                      onToggleSelect={toggleSelect}
                      onMenuOpen={handleMenuOpen}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onShare={handleShare}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
              
              {viewMode === 'list' && (
                <div className="flex flex-col gap-4">
                  {sortedCollections.map((collection) => (
                    <CollectionListItem 
                      key={collection.id}
                      collection={collection}
                      isSelected={selectedCollections.includes(collection.id)}
                      menuOpenId={menuOpenId}
                      onToggleSelect={toggleSelect}
                      onMenuOpen={handleMenuOpen}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onShare={handleShare}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
              
              {viewMode === 'map' && (
                <div className="bg-gray-50 rounded-xl p-8 h-80 flex flex-col items-center justify-center text-center">
                  <MapIcon size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
                  <p className="text-gray-500 mb-4">Visualize your collections geographically</p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    Get Notified When Ready
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Action Bar (appears when collections are selected) */}
      <ActionBar
        title={selectedCollections.length === 1 ? "Collection Selected" : "Collections Selected"}
        count={selectedCollections.length}
        onClearSelection={() => setSelectedCollections([])}
        buttons={[
          {
            label: "Delete",
            variant: "destructive",
            icon: <Trash size={16} />,
            onClick: handleBulkDelete
          }
        ]}
      />
      
      {/* Simplified Filter Sheet */}
      <SimpleFilterSheet
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        
        types={typeOptions}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        
        plaqueCounts={plaqueCountOptions}
        selectedPlaqueCounts={selectedPlaqueCounts}
        onPlaqueCountsChange={setSelectedPlaqueCounts}
      />
      
      {/* Create Collection Modal */}
      <CollectionCreator
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleSaveCollection}
      />
    </PageContainer>
  );
};

export default Collections;