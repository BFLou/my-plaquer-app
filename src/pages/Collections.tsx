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
  BookMarked
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
import userData from '../data/user_data.json';

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
  
  // Get collections directly from user_data.json
  const [collections, setCollections] = useState(userData.collections);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Simplified filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPlaqueCounts, setSelectedPlaqueCounts] = useState<string[]>([]);
  
  // Filter options
  const typeOptions = [
    { label: 'Literary', value: 'literary' },
    { label: 'Music', value: 'music' },
    { label: 'Family', value: 'family' },
    { label: 'Historical', value: 'historical' },
    { label: 'Women', value: 'women' },
    { label: 'Local', value: 'local' },
  ];
  
  const plaqueCountOptions = [
    { label: 'Small (1-3)', value: 'small' },
    { label: 'Medium (4-6)', value: 'medium' },
    { label: 'Large (7+)', value: 'large' },
  ];
  
  // Initialize state from URL params on first load
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'grid' || view === 'list' || view === 'map')) {
      setViewMode(view as ViewMode);
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const sort = searchParams.get('sort');
    if (sort) {
      setSortOption(sort);
    }

    // Get user's default preferences if available
    if (userData.user.preferences) {
      if (userData.user.preferences.default_view && !view) {
        setViewMode(userData.user.preferences.default_view as ViewMode);
      }
      
      if (userData.user.preferences.default_sort && !sort) {
        setSortOption(userData.user.preferences.default_sort);
      }
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
    
    // Filter by type based on collection name/description
    const matchesType = selectedTypes.length === 0 || 
                       (selectedTypes.includes('literary') && (collection.name.includes('Literary') || collection.description.includes('authors'))) ||
                       (selectedTypes.includes('music') && (collection.name.includes('Music') || collection.description.includes('musicians'))) ||
                       (selectedTypes.includes('family') && (collection.name.includes('Family'))) ||
                       (selectedTypes.includes('women') && (collection.name.includes('Women'))) ||
                       (selectedTypes.includes('local') && (collection.name.includes('Local')));
    
    // Match plaque counts
    const plaqueCount = collection.plaques.length;
    const matchesPlaqueCounts = selectedPlaqueCounts.length === 0 || 
                              (selectedPlaqueCounts.includes('small') && plaqueCount >= 1 && plaqueCount <= 3) ||
                              (selectedPlaqueCounts.includes('medium') && plaqueCount >= 4 && plaqueCount <= 6) ||
                              (selectedPlaqueCounts.includes('large') && plaqueCount >= 7);
    
    return matchesSearch && matchesType && matchesPlaqueCounts;
  });
  
  // Sort collections based on selected option
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === 'newest') {
      // Sort by update timestamp
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortOption === 'oldest') {
      // Sort by creation timestamp
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOption === 'most_plaques') {
      return b.plaques.length - a.plaques.length;
    }
    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  
  // Format the "updated X ago" text
  const getUpdatedText = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // Handlers
  const toggleSelect = (id: number) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleMenuOpen = (id: number) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  
  const handleEdit = (id: number) => {
    toast({
      title: "Edit Collection",
      description: `Editing collection ${id}`,
      duration: 2000,
    });
  };
  
  const handleDuplicate = (id: number) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      const newCollection = {
        ...collection,
        id: collections.length + 1,
        name: `${collection.name} (Copy)`,
        plaques: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false
      };
      setCollections([...collections, newCollection]);
      
      toast({
        title: "Collection Duplicated",
        description: `Created a copy of "${collection.name}"`,
        duration: 2000,
      });
    }
  };
  
  const handleShare = (id: number) => {
    toast({
      title: "Share Collection",
      description: "Sharing functionality would be implemented here",
      duration: 2000,
    });
  };
  
  const handleDelete = (id: number) => {
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
  
  const handleSaveCollection = (newCollection: NewCollection) => {
    const createdCollection = {
      id: collections.length + 1,
      ...newCollection,
      plaques: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: newCollection.isPublic || false,
      is_favorite: false
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
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques.length, 0);
  const favoritedCollections = collections.filter(c => c.is_favorite).length;
  
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
          
          <div className="bg-amber-500 p-5 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-amber-100 mb-1 text-sm font-medium">Favorites</div>
                <div className="text-3xl font-bold text-white">{favoritedCollections}</div>
              </div>
              <div className="p-3 bg-amber-600 rounded-lg">
                <Sparkles size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-700 p-5 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-100 mb-1 text-sm font-medium">Create New</div>
                <Button 
                  onClick={handleCreateCollection} 
                  className="bg-white hover:bg-gray-100 text-blue-700 mt-2"
                >
                  <Plus size={16} className="mr-1" /> New Collection
                </Button>
              </div>
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
                  {sortedCollections.map((collection) => {
                    // Format the "updated X ago" text
                    const updatedText = getUpdatedText(collection.updated_at);
                    
                    // Create a collection object compatible with the component
                    const collectionData = {
                      ...collection,
                      updated: updatedText,
                      plaques: collection.plaques.length, // Convert array to count for display
                      isFavorite: collection.is_favorite
                    };
                    
                    return (
                      <CollectionCard 
                        key={collection.id}
                        collection={collectionData}
                        isSelected={selectedCollections.includes(collection.id)}
                        menuOpenId={menuOpenId}
                        onToggleSelect={toggleSelect}
                        onMenuOpen={handleMenuOpen}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onShare={handleShare}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </div>
              )}
              
              {viewMode === 'list' && (
                <div className="flex flex-col gap-4">
                  {sortedCollections.map((collection) => {
                    // Format the "updated X ago" text
                    const updatedText = getUpdatedText(collection.updated_at);
                    
                    // Create a collection object compatible with the component
                    const collectionData = {
                      ...collection,
                      updated: updatedText,
                      plaques: collection.plaques.length, // Convert array to count for display
                      isFavorite: collection.is_favorite
                    };
                    
                    return (
                      <CollectionListItem 
                        key={collection.id}
                        collection={collectionData}
                        isSelected={selectedCollections.includes(collection.id)}
                        menuOpenId={menuOpenId}
                        onToggleSelect={toggleSelect}
                        onMenuOpen={handleMenuOpen}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onShare={handleShare}
                        onDelete={handleDelete}
                      />
                    );
                  })}
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