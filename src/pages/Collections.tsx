import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { List, Plus, Star, CheckCircle, MapIcon, Trash, Share2, Search, AlertCircle } from 'lucide-react';
import {
  PageContainer,
  CollectionCard,
  CollectionListItem,
  CollectionCreator,
  ViewToggle,
  FilterBar,
  FilterSheet,
  EmptyState,
  ActionBar,
  type Collection,
  type NewCollection,
  type ViewMode
} from '@/components';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

// Sample collections data
const SAMPLE_COLLECTIONS = [
  { id: 1, icon: '🎭', name: 'Theatre Legends', plaques: 18, updated: '2 days ago', color: 'bg-blue-500', isFavorite: true },
  { id: 2, icon: '🎶', name: 'Musical Icons', plaques: 12, updated: 'yesterday', color: 'bg-green-500', isFavorite: false },
  { id: 3, icon: '📚', name: 'Literary Giants', plaques: 15, updated: 'last week', color: 'bg-red-500', isFavorite: true },
  { id: 4, icon: '🏛️', name: 'Historic Landmarks', plaques: 22, updated: '3 weeks ago', color: 'bg-purple-500', isFavorite: false },
  { id: 5, icon: '🧠', name: 'Scientists & Inventors', plaques: 8, updated: 'last month', color: 'bg-yellow-500', isFavorite: false },
  { id: 6, icon: '🎨', name: 'Artists & Painters', plaques: 14, updated: '2 months ago', color: 'bg-pink-500', isFavorite: false },
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
  
  // Filter states
  const [collectionType, setCollectionType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [plaquesCount, setPlaquesCount] = useState('any');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyShared, setOnlyShared] = useState(false);
  
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
    
    if (onlyFavorites) {
      params.set('favorites', 'true');
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [viewMode, searchQuery, sortOption, onlyFavorites]);
  
  // Filter collections based on the current filters
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = onlyFavorites ? collection.isFavorite : true;
    
    // Additional filters would be implemented here in a real app
    
    return matchesSearch && matchesFavorites;
  });
  
  // Sort collections based on selected option
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === 'newest') return -1; // Assuming the array is already in newest first order
    if (sortOption === 'oldest') return 1;
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
    setCollectionType('all');
    setDateRange('all');
    setPlaquesCount('any');
    setOnlyFavorites(false);
    setOnlyShared(false);
    setSearchQuery('');
    setFilterModalOpen(false);
  };
  
  // Get active filters for display
  const activeFilters = [];
  if (onlyFavorites) activeFilters.push('Favorites');
  if (onlyShared) activeFilters.push('Shared');
  if (collectionType !== 'all') activeFilters.push(`Type: ${collectionType}`);
  if (dateRange !== 'all') activeFilters.push(`Updated: ${dateRange}`);
  if (plaquesCount !== 'any') activeFilters.push(`Plaques: ${plaquesCount}`);
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Collections</h1>
            <p className="text-gray-500 mt-1">Organize and manage your plaque discoveries</p>
          </div>
          <Button 
            onClick={handleCreateCollection} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} /> Create
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 items-center">
            <FilterBar 
              onFilterClick={() => setFilterModalOpen(true)} 
              activeFilters={activeFilters}
            />
            
            <ViewToggle
              viewMode={viewMode}
              onChange={setViewMode}
              variant="buttons"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs hidden md:block">
              <Input
                type="search"
                placeholder="Search collections..."
                className="pl-8 py-2 w-full md:w-48 lg:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            
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
        
        {/* Content */}
        {sortedCollections.length === 0 ? (
          <EmptyState
            icon={List}
            title="No Collections Yet"
            description="Start organizing your plaque discoveries by creating your first collection"
            actionLabel="Create Your First Collection"
            onAction={handleCreateCollection}
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
      
      {/* Filter Sheet */}
      <FilterSheet
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={() => setFilterModalOpen(false)}
        onReset={resetFilters}
        title="Filter Collections"
      >
        <div className="space-y-2">
          <Label>Collection Type</Label>
          <Select value={collectionType} onValueChange={setCollectionType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="shared">Shared with me</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Date Updated</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Number of Plaques</Label>
          <Select value={plaquesCount} onValueChange={setPlaquesCount}>
            <SelectTrigger>
              <SelectValue placeholder="Any amount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any amount</SelectItem>
              <SelectItem value="empty">Empty (0)</SelectItem>
              <SelectItem value="few">Few (1-10)</SelectItem>
              <SelectItem value="many">Many (11+)</SelectItem>
              <SelectItem value="lots">Lots (50+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="favorites">Only favorites</Label>
            <Switch 
              id="favorites" 
              checked={onlyFavorites} 
              onCheckedChange={setOnlyFavorites} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="shared">Only shared collections</Label>
            <Switch 
              id="shared" 
              checked={onlyShared} 
              onCheckedChange={setOnlyShared} 
            />
          </div>
        </div>
      </FilterSheet>
      
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