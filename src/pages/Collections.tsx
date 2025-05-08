import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  List, 
  Plus, 
  MapIcon, 
  Trash, 
  Search, 
  Filter,
  Star,
  FolderPlus,
  BookMarked,
  Eye,
  Users
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

const Collections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [collections, setCollections] = useState(userData.collections);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPlaqueCounts, setSelectedPlaqueCounts] = useState<string[]>([]);
  
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
  }, [viewMode, searchQuery, sortOption, selectedTypes, selectedPlaqueCounts]);
  
  // Filter collections based on current filters
  const filteredCollections = collections.filter(collection => {
    // Match search query
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by type based on collection name/description
    const matchesType = selectedTypes.length === 0 || 
                      selectedTypes.some(type => 
                        collection.name.toLowerCase().includes(type) || 
                        (collection.description && collection.description.toLowerCase().includes(type)));
    
    // Match plaque counts
    const plaqueCount = collection.plaques.length;
    const matchesPlaqueCounts = selectedPlaqueCounts.length === 0 || 
                              (selectedPlaqueCounts.includes('small') && plaqueCount >= 1 && plaqueCount <= 3) ||
                              (selectedPlaqueCounts.includes('medium') && plaqueCount >= 4 && plaqueCount <= 10) ||
                              (selectedPlaqueCounts.includes('large') && plaqueCount > 10);
    
    return matchesSearch && matchesType && matchesPlaqueCounts;
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
  const publicCollections = collections.filter(c => c.is_public).length;
  
  return (
    <PageContainer activePage="collections">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Collections</h1>
              <p className="text-blue-100">Organize your plaque discoveries with custom collections</p>
            </div>
            <Button
              onClick={handleCreateCollection}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-500 mb-1 text-sm font-medium">Total</div>
                  <div className="text-2xl font-bold">{totalCollections}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookMarked size={18} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-500 mb-1 text-sm font-medium">Plaques</div>
                  <div className="text-2xl font-bold">{totalPlaques}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapIcon size={18} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-500 mb-1 text-sm font-medium">Favorites</div>
                  <div className="text-2xl font-bold">{favoritedCollections}</div>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Star size={18} className="text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-500 mb-1 text-sm font-medium">Public</div>
                  <div className="text-2xl font-bold">{publicCollections}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Eye size={18} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Collection Controls */}
      <div className="sticky top-16 z-10 bg-white border-b py-4">
        <div className="container mx-auto px-4">
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
      </div>
      
      {/* Collections List */}
      <div className="container mx-auto px-4 py-6">
        {sortedCollections.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
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
                      onToggleFavorite={() => handleToggleFavorite(collection.id)}
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
                      onToggleFavorite={() => handleToggleFavorite(collection.id)}
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
                <Button variant="outline">Get Notified When Ready</Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Filter Sheet */}
      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Filter Collections</SheetTitle>
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {activeFilters.length} active
                </Badge>
              )}
            </div>
            <SheetDescription>Refine your collections view</SheetDescription>
          </SheetHeader>
          
          <div className="grid gap-6 py-6">
            <div className="space-y-4">
              <h3 className="text-base font-medium">Collection Type</h3>
              <MultiSelectFilter
                options={typeOptions}
                selected={selectedTypes}
                onChange={setSelectedTypes}
                placeholder="All collection types"
                searchPlaceholder="Search collection types..."
                displayBadges={true}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-medium">Number of Plaques</h3>
              <MultiSelectFilter
                options={plaqueCountOptions}
                selected={selectedPlaqueCounts}
                onChange={setSelectedPlaqueCounts}
                placeholder="Any amount"
                searchPlaceholder="Search plaque counts..."
                displayBadges={true}
              />
            </div>
          </div>
          
          <SheetFooter className="flex flex-row gap-2 sm:justify-between">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex-1"
            >
              Reset All
            </Button>
            <Button 
              onClick={applyFilters}
              className="flex-1"
            >
              Apply Filters
            </Button>
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

export default Collections;