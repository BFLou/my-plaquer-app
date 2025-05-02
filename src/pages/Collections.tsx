import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { List, Plus, MapIcon, Trash, Search, AlertCircle, Filter } from 'lucide-react';
import {
  PageContainer,
  CollectionCard,
  CollectionListItem,
  CollectionCreator,
  ViewToggle,
  EmptyState,
  ActionBar,
  type Collection,
  type NewCollection,
  type ViewMode
} from '@/components';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import CollectionsDashboard from '../components/collections/CollectionsDashboard';
import CollectionsFilterSheet from '../components/collections/CollectionsFilterSheet';

// Sample collections data
const SAMPLE_COLLECTIONS = [
  { id: 1, icon: '🎭', name: 'Theatre Legends', description: 'A collection of famous plaques related to theatre history in London', plaques: 18, updated: '2 days ago', color: 'bg-blue-500', isPublic: true, isFavorite: true },
  { id: 2, icon: '🎶', name: 'Musical Icons', description: 'Explore the homes and landmarks of famous musicians', plaques: 12, updated: 'yesterday', color: 'bg-green-500', isPublic: false, isFavorite: false },
  { id: 3, icon: '📚', name: 'Literary Giants', description: 'Famous authors and poets who lived in London', plaques: 15, updated: 'last week', color: 'bg-red-500', isPublic: true, isFavorite: true },
  { id: 4, icon: '🏛️', name: 'Historic Landmarks', description: 'Important historical buildings and monuments across London', plaques: 22, updated: '3 weeks ago', color: 'bg-purple-500', isPublic: false, isFavorite: false },
  { id: 5, icon: '🧠', name: 'Scientists & Inventors', description: 'Great minds who changed the world with their discoveries', plaques: 8, updated: 'last month', color: 'bg-yellow-500', isPublic: true, isFavorite: false },
  { id: 6, icon: '🎨', name: 'Artists & Painters', description: 'Visual artists who lived and worked in London', plaques: 14, updated: '2 months ago', color: 'bg-pink-500', isPublic: false, isFavorite: false },
];

const Collections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [collections, setCollections] = useState<Collection[]>(SAMPLE_COLLECTIONS);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Enhanced Filter states - now arrays for multi-select
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTimePeriods, setSelectedTimePeriods] = useState<string[]>([]);
  const [selectedPlaqueCounts, setSelectedPlaqueCounts] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyShared, setOnlyShared] = useState(false);
  
  // Filter options
  const typeOptions = [
    { label: 'Personal', value: 'personal' },
    { label: 'Shared', value: 'shared' },
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
    { label: 'Template', value: 'template' },
  ];
  
  const timePeriodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'Older', value: 'older' },
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
    
    const favorites = searchParams.get('favorites');
    if (favorites === 'true') {
      setOnlyFavorites(true);
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
    
    if (selectedTimePeriods.length > 0) {
      params.set('time', selectedTimePeriods.join(','));
    }
    
    if (selectedPlaqueCounts.length > 0) {
      params.set('counts', selectedPlaqueCounts.join(','));
    }
    
    if (onlyFavorites) {
      params.set('favorites', 'true');
    }
    
    if (onlyShared) {
      params.set('shared', 'true');
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [
    viewMode, 
    searchQuery, 
    sortOption, 
    selectedTypes, 
    selectedTimePeriods, 
    selectedPlaqueCounts, 
    onlyFavorites, 
    onlyShared
  ]);
  
  // Filter collections based on the current filters
  const filteredCollections = collections.filter(collection => {
    // Match search query
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Match type filters
    const matchesTypes = selectedTypes.length === 0 || 
                       (selectedTypes.includes('public') && collection.isPublic) ||
                       (selectedTypes.includes('private') && !collection.isPublic);
    
    // Match favorites filter
    const matchesFavorites = !onlyFavorites || collection.isFavorite;
    
    // Match shared filter (for demo purposes, consider all public collections as "shared")
    const matchesShared = !onlyShared || collection.isPublic;
    
    // Match time periods (for demo purposes, this is simplified)
    const matchesTimePeriods = selectedTimePeriods.length === 0 || 
                             (selectedTimePeriods.includes('today') && collection.updated.includes('today')) ||
                             (selectedTimePeriods.includes('week') && 
                              (collection.updated.includes('today') || 
                               collection.updated.includes('yesterday') || 
                               collection.updated.includes('days') || 
                               collection.updated.includes('week')));
    
    // Match plaque counts
    const matchesPlaqueCounts = selectedPlaqueCounts.length === 0 || 
                              (selectedPlaqueCounts.includes('empty') && collection.plaques === 0) ||
                              (selectedPlaqueCounts.includes('few') && collection.plaques > 0 && collection.plaques <= 10) ||
                              (selectedPlaqueCounts.includes('many') && collection.plaques > 10 && collection.plaques <= 50) ||
                              (selectedPlaqueCounts.includes('lots') && collection.plaques > 50);
    
    return matchesSearch && 
           matchesTypes && 
           matchesFavorites && 
           matchesShared && 
           matchesTimePeriods && 
           matchesPlaqueCounts;
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
  const toggleSelect = (id: number) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleMenuOpen = (id: number) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  
  const handleEdit = (id: number) => {
    // In a real app, this would open the edit modal with the collection data
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
  
  const handleShare = (id: number) => {
    toast({
      title: "Share Collection",
      description: "Sharing functionality would be implemented here",
      duration: 2000,
    });
  };
  
  const handleToggleFavorite = (id: number) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id ? { ...collection, isFavorite: !collection.isFavorite } : collection
    ));
    
    const collection = collections.find(c => c.id === id);
    if (collection) {
      toast({
        title: collection.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${collection.name}" ${collection.isFavorite ? "removed from" : "added to"} favorites`,
        duration: 2000,
      });
    }
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
      plaques: 0,
      updated: 'just now',
      isFavorite: false
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
  
  const handleMerge = () => {
    toast({
      title: "Merge Collections",
      description: "This would open a merge dialog in a real app",
      duration: 2000,
    });
  };
  
  const handleExport = () => {
    toast({
      title: "Export Collections",
      description: "This would export the selected collections in a real app",
      duration: 2000,
    });
  };
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedTimePeriods([]);
    setSelectedPlaqueCounts([]);
    setOnlyFavorites(false);
    setOnlyShared(false);
    setSearchQuery('');
    setFilterModalOpen(false);
  };
  
  const applyFilters = () => {
    setFilterModalOpen(false);
  };
  
  const handleViewAllFavorites = () => {
    setOnlyFavorites(true);
    // Scroll to collections list
    document.getElementById('collections-list')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get active filters for display
  const activeFilters = [
    ...selectedTypes.map(type => {
      const option = typeOptions.find(opt => opt.value === type);
      return option ? `Type: ${option.label}` : `Type: ${type}`;
    }),
    ...selectedTimePeriods.map(period => {
      const option = timePeriodOptions.find(opt => opt.value === period);
      return option ? `Updated: ${option.label}` : `Updated: ${period}`;
    }),
    ...selectedPlaqueCounts.map(count => {
      const option = plaqueCountOptions.find(opt => opt.value === count);
      return option ? `Plaques: ${option.label}` : `Plaques: ${count}`;
    }),
    ...(onlyFavorites ? ['Favorites Only'] : []),
    ...(onlyShared ? ['Shared Only'] : []),
  ];
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Collections</h1>
            <p className="text-gray-500">Organize and manage your plaque discoveries</p>
          </div>
          <Button 
            onClick={handleCreateCollection} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} /> Create Collection
          </Button>
        </div>
        
        {/* Collections Dashboard */}
        <CollectionsDashboard 
          collections={collections}
          onCreateCollection={handleCreateCollection}
          onViewAllFavorites={handleViewAllFavorites}
          onOpenFilters={() => setFilterModalOpen(true)}
          className="mb-8"
        />
        
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
                      onToggleFavorite={handleToggleFavorite}
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
                      onToggleFavorite={handleToggleFavorite}
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
          },
          {
            label: "Merge",
            onClick: handleMerge
          },
          {
            label: "Export",
            onClick: handleExport
          }
        ]}
      />
      
      {/* Enhanced Filter Sheet */}
      <CollectionsFilterSheet
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        
        types={typeOptions}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        
        timePeriods={timePeriodOptions}
        selectedTimePeriods={selectedTimePeriods}
        onTimePeriodsChange={setSelectedTimePeriods}
        
        plaqueCounts={plaqueCountOptions}
        selectedPlaqueCounts={selectedPlaqueCounts}
        onPlaqueCountsChange={setSelectedPlaqueCounts}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={setOnlyFavorites}
        
        onlyShared={onlyShared}
        onSharedChange={setOnlyShared}
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