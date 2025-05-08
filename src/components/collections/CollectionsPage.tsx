import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Trash, 
  FolderPlus, 
  BookIcon, 
  GridIcon,
  ListIcon,
  MapIcon
} from 'lucide-react';

import {
  PageContainer,
  CollectionCard,
  CollectionListItem,
  CollectionCreator,
  EmptyState,
  ActionBar,
  CollectionsHeader,
  CollectionsDashboard,
  type Collection as CollectionType,
  type NewCollection,
  type ViewMode
} from '@/components';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// In a real app, this would come from an API or context
import userData from '../../data/user_data.json';

const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [collections, setCollections] = useState<any[]>(userData.collections);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPlaqueCounts, setSelectedPlaqueCounts] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyPublic, setOnlyPublic] = useState(false);
  
  // Filter options
  const typeOptions = [
    { label: 'Literary', value: 'literary' },
    { label: 'Music', value: 'music' },
    { label: 'Historical', value: 'historical' },
    { label: 'Women', value: 'women' },
    { label: 'Local', value: 'local' },
  ];
  
  const plaqueCountOptions = [
    { label: 'Small (1-3)', value: 'small' },
    { label: 'Medium (4-10)', value: 'medium' },
    { label: 'Large (10+)', value: 'large' },
  ];
  
  // Initialize state from URL params
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
    
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveView(tab);
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
    
    if (activeView !== 'all') {
      params.set('tab', activeView);
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [viewMode, searchQuery, sortOption, activeView]);
  
  // Filter collections based on current filters
  const filteredCollections = collections.filter(collection => {
    // Match search query
    const matchesSearch = 
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply tab filter
    const matchesTab = 
      activeView === 'all' || 
      (activeView === 'favorites' && collection.is_favorite) ||
      (activeView === 'public' && collection.is_public);
    
    // Filter by type based on collection name/description
    const matchesType = 
      selectedTypes.length === 0 || 
      selectedTypes.some(type => 
        collection.name.toLowerCase().includes(type) || 
        (collection.description && collection.description.toLowerCase().includes(type))
      );
    
    // Match plaque counts
    const plaqueCount = collection.plaques.length;
    const matchesPlaqueCounts = 
      selectedPlaqueCounts.length === 0 || 
      (selectedPlaqueCounts.includes('small') && plaqueCount >= 1 && plaqueCount <= 3) ||
      (selectedPlaqueCounts.includes('medium') && plaqueCount >= 4 && plaqueCount <= 10) ||
      (selectedPlaqueCounts.includes('large') && plaqueCount > 10);
    
    // Match favorites filter
    const matchesFavorites = !onlyFavorites || collection.is_favorite;
    
    // Match public filter
    const matchesPublic = !onlyPublic || collection.is_public;
    
    return matchesSearch && matchesTab && matchesType && matchesPlaqueCounts && matchesFavorites && matchesPublic;
  });
  
  // Sort collections based on selected option
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortOption === 'oldest') {
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
  
  // Event handlers
  const toggleSelect = (id: number) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleMenuOpen = (id: number) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  
  const handleEdit = (id: number) => {
    toast.success("Edit Collection", {
      description: `Editing collection ${id}`,
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
      
      toast.success("Collection Duplicated", {
        description: `Created a copy of "${collection.name}"`,
      });
    }
  };
  
  const handleShare = (id: number) => {
    toast.info("Share Collection", {
      description: "Sharing functionality would be implemented here",
    });
  };
  
  const handleToggleFavorite = (id: number) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id 
        ? { ...collection, is_favorite: !collection.is_favorite }
        : collection
    ));
    
    const collection = collections.find(c => c.id === id);
    if (collection) {
      toast.success(collection.is_favorite 
        ? "Removed from favorites" 
        : "Added to favorites", {
        description: `Collection "${collection.name}" ${collection.is_favorite ? 'removed from' : 'added to'} favorites`,
      });
    }
  };
  
  const handleDelete = (id: number) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
    
    toast.success("Collection Deleted", {
      description: "The collection has been deleted",
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
    
    toast.success("Collection Created", {
      description: `"${newCollection.name}" has been created`,
    });
  };
  
  const handleBulkDelete = () => {
    setCollections(prev => prev.filter(collection => !selectedCollections.includes(collection.id)));
    
    toast.success("Collections Deleted", {
      description: `${selectedCollections.length} collections have been deleted`,
    });
    setSelectedCollections([]);
  };
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedPlaqueCounts([]);
    setOnlyFavorites(false);
    setOnlyPublic(false);
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
      return option ? `Size: ${option.label}` : `Size: ${count}`;
    }),
    ...(onlyFavorites ? ['Favorites only'] : []),
    ...(onlyPublic ? ['Public only'] : [])
  ];
  
  // Calculate statistics for dashboard
  const totalCollections = collections.length;
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques.length, 0);
  const favoriteCollections = collections.filter(c => c.is_favorite).length;
  const publicCollections = collections.filter(c => c.is_public).length;
  
  // View toggle buttons with active state
  const ViewToggleButtons = () => (
    <div className="flex border rounded-md overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('grid')}
        className={`px-3 py-1 ${viewMode === 'grid' 
          ? 'bg-blue-50 text-blue-600' 
          : 'hover:bg-gray-50'}`}
      >
        <GridIcon size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('list')}
        className={`px-3 py-1 ${viewMode === 'list' 
          ? 'bg-blue-50 text-blue-600' 
          : 'hover:bg-gray-50'}`}
      >
        <ListIcon size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('map')}
        className={`px-3 py-1 ${viewMode === 'map' 
          ? 'bg-blue-50 text-blue-600' 
          : 'hover:bg-gray-50'}`}
      >
        <MapIcon size={16} />
      </Button>
    </div>
  );
  
  return (
    <PageContainer activePage="collections">
      <div className="container mx-auto px-4 py-6">
        <Tabs 
          value={activeView} 
          onValueChange={setActiveView}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">My Collections</h1>
            <Button onClick={handleCreateCollection}>
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </div>
          
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Collections</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>
          
          {/* Dashboard component for high-level stats */}
          <CollectionsDashboard
            collections={collections}
            onCreateCollection={handleCreateCollection}
            onViewAllFavorites={() => setActiveView('favorites')}
            onOpenFilters={() => setFilterModalOpen(true)}
            className="mb-8"
          />
          
          {/* Search and filter bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex flex-wrap gap-2 items-center">
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
              
              {activeFilters.length > 0 && (
                <div className="hidden md:flex gap-1 items-center">
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
              
              <ViewToggleButtons />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search collections..."
                  className="pl-8 pr-4 py-2 w-full min-w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Updated</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_plaques">Most Plaques</SelectItem>
                  <SelectItem value="alphabetical">A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Collections Grid/List */}
          {sortedCollections.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title="No Collections Found"
              description={activeFilters.length > 0 
                ? "Try adjusting your filters or search criteria" 
                : activeView === 'favorites'
                  ? "You don't have any favorite collections yet"
                  : activeView === 'public'
                    ? "You don't have any public collections yet"
                    : "Start organizing your plaque discoveries by creating your first collection"
              }
              actionLabel={activeFilters.length > 0 
                ? "Reset Filters" 
                : "Create Your First Collection"
              }
              onAction={activeFilters.length > 0 
                ? resetFilters 
                : handleCreateCollection
              }
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
                      isFavorite: collection.is_favorite,
                      isPublic: collection.is_public
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
                        onToggleFavorite={handleToggleFavorite}
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
                      isFavorite: collection.is_favorite,
                      isPublic: collection.is_public
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
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </div>
              )}
              
              {viewMode === 'map' && (
                <div className="bg-gray-50 rounded-xl p-8 h-[500px] flex flex-col items-center justify-center text-center">
                  <MapIcon size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
                  <p className="text-gray-500 mb-4">Visualize your collections geographically</p>
                  <Button variant="outline">Get Notified When Ready</Button>
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>
      
      {/* Filter Sheet */}
      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex justify-between items-center">
              Filter Collections
              {activeFilters.length > 0 && (
                <Badge variant="secondary">
                  {activeFilters.length} active
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>Refine your collections view</SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-160px)] py-4">
            <div className="space-y-6 pr-6">
              {/* Collection Type */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Collection Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox 
                        id={`type-${option.value}`} 
                        checked={selectedTypes.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes([...selectedTypes, option.value]);
                          } else {
                            setSelectedTypes(selectedTypes.filter(t => t !== option.value));
                          }
                        }}
                      />
                      <Label htmlFor={`type-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Plaque Size */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Collection Size</h3>
                <div className="grid grid-cols-1 gap-2">
                  {plaqueCountOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox 
                        id={`size-${option.value}`} 
                        checked={selectedPlaqueCounts.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlaqueCounts([...selectedPlaqueCounts, option.value]);
                          } else {
                            setSelectedPlaqueCounts(selectedPlaqueCounts.filter(s => s !== option.value));
                          }
                        }}
                      />
                      <Label htmlFor={`size-${option.value}`}>{option.label} plaques</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Other filters */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Other Filters</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="favorites-only" 
                      checked={onlyFavorites}
                      onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
                    />
                    <Label htmlFor="favorites-only">Favorites only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="public-only" 
                      checked={onlyPublic}
                      onCheckedChange={(checked) => setOnlyPublic(!!checked)}
                    />
                    <Label htmlFor="public-only">Public collections only</Label>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <SheetFooter className="border-t pt-4 mt-4">
            <div className="flex w-full gap-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <Button 
                onClick={applyFilters}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Create Collection Modal */}
      <CollectionCreator
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleSaveCollection}
      />
      
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
    </PageContainer>
  );
};

export default CollectionsPage;