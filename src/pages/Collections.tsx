import React, { useState, useEffect } from 'react';
import { MapPin, Star, Trash2, CollectionIcon, FolderOpen, BookOpen, Plus, Filter } from 'lucide-react';
import { PageContainer } from "@/components";
import { useCollectionsList } from '../hooks/useCollectionsList';
import { useCollectionActions } from '../hooks/useCollectionActions';

// Collection Components
import CollectionHeader from '../components/collections/CollectionHeader';
import CollectionToolbar from '../components/collections/CollectionToolbar';
import CollectionGrid from '../components/collections/CollectionGrid';
import CollectionList from '../components/collections/CollectionList';
import CollectionCreateForm from '../components/collections/forms/CollectionCreateForm';
import CollectionEditForm from '../components/collections/forms/CollectionEditForm';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionBar } from '@/components/common/ActionBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const CollectionsPage: React.FC = () => {
  // Use existing hooks
  const {
    collections,
    loading,
    error,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    showOnlyFavorites,
    setShowOnlyFavorites,
    selectedCollections,
    setSelectedCollections,
    filteredCollections,
    activeFilters,
    resetFilters,
    toggleSelect
  } = useCollectionsList();
  
  const {
    isLoading,
    createCollectionOpen,
    setCreateCollectionOpen,
    editCollectionOpen,
    setEditCollectionOpen,
    editCollectionData,
    setEditCollectionData,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    collectionsToDelete,
    handleCreateCollection,
    handleEditCollection,
    handleToggleFavorite,
    handleDuplicateCollection,
    handleDeleteCollections,
    prepareForDelete,
    handleBatchFavorite,
    navigateToCollection
  } = useCollectionActions();
  
  // Add state for featured collections
  const [favoriteCollections, setFavoriteCollections] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);
  
  // Calculate collections stats
  const [stats, setStats] = useState({
    total: 0,
    favorites: 0,
    plaques: 0,
  });
  
  useEffect(() => {
    if (collections.length > 0) {
      // Set favorite collections
      setFavoriteCollections(collections.filter(c => c.is_favorite));
      
      // Set recent collections (5 most recently updated)
      const sorted = [...collections].sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });
      setRecentCollections(sorted.slice(0, 4));
      
      // Calculate stats
      const totalPlaques = collections.reduce((sum, c) => {
        return sum + (Array.isArray(c.plaques) ? c.plaques.length : c.plaques || 0);
      }, 0);
      
      setStats({
        total: collections.length,
        favorites: collections.filter(c => c.is_favorite).length,
        plaques: totalPlaques
      });
    }
  }, [collections]);

  // Handle edit form
  const handleOpenEditForm = (id) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };

  // Show loading state
  if (loading && collections.length === 0) {
    return (
      <PageContainer 
        activePage="collections"
        simplifiedFooter={true}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading collections...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <PageContainer 
        activePage="collections"
        simplifiedFooter={true}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 font-medium mb-2">Error Loading Collections</h3>
            <p className="text-red-500 mb-4">There was a problem loading your collections.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      activePage="collections"
      simplifiedFooter={true}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">My Collections</h1>
              <p className="text-lg opacity-90 max-w-md">
                Organize and explore your favorite London plaques in personalized collections.
              </p>
            </div>
            
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 gap-2"
              onClick={() => setCreateCollectionOpen(true)}
            >
              <Plus size={20} />
              Create Collection
            </Button>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      {collections.length > 0 && (
        <section className="bg-white py-8 border-b">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <FolderOpen size={24} className="text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
                <span className="text-blue-700">Total Collections</span>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 text-center flex flex-col items-center">
                <div className="bg-amber-100 p-3 rounded-full mb-3">
                  <Star size={24} className="text-amber-600" />
                </div>
                <span className="text-3xl font-bold text-amber-600">{stats.favorites}</span>
                <span className="text-amber-700">Favorite Collections</span>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <MapPin size={24} className="text-green-600" />
                </div>
                <span className="text-3xl font-bold text-green-600">{stats.plaques}</span>
                <span className="text-green-700">Total Plaques</span>
              </div>
            </div>
          </div>
        </section>
      )}
      
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Favorite Collections Section */}
        {favoriteCollections.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star size={20} className="text-amber-500" /> Favorite Collections
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowOnlyFavorites(true)}
              >
                View All
              </Button>
            </div>
            
            <CollectionGrid
              collections={favoriteCollections.slice(0, 3)}
              selectedCollections={selectedCollections}
              onToggleSelect={toggleSelect}
              onEdit={handleOpenEditForm}
              onDuplicate={handleDuplicateCollection}
              onToggleFavorite={handleToggleFavorite}
              onDelete={(id) => prepareForDelete([id])}
              onClick={navigateToCollection}
            />
          </section>
        )}
        
        {/* Recent Collections Section */}
        {recentCollections.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen size={20} /> Recent Collections
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSortOption('recently_updated')}
              >
                View All
              </Button>
            </div>
            
            <CollectionGrid
              collections={recentCollections}
              selectedCollections={selectedCollections}
              onToggleSelect={toggleSelect}
              onEdit={handleOpenEditForm}
              onDuplicate={handleDuplicateCollection}
              onToggleFavorite={handleToggleFavorite}
              onDelete={(id) => prepareForDelete([id])}
              onClick={navigateToCollection}
            />
          </section>
        )}
        
        {/* Main Collections Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen size={20} /> All Collections
            </h2>
            
            {/* Tabs for Grid/List view */}
            <div className="flex items-center gap-3">
              <div className="relative mr-4">
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-300"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className={activeFilters.length > 0 ? "border-blue-500 text-blue-600" : ""}
                onClick={() => setFiltersOpen(true)}
              >
                <Filter size={16} className="mr-1" /> 
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
              
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Show sort options */}
          <div className="flex justify-between items-center mb-6">
            <div>
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Filters:</span>
                  {activeFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary">{filter}</Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={resetFilters}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recently_updated">Recently Updated</SelectItem>
                <SelectItem value="oldest_updated">Oldest Updated</SelectItem>
                <SelectItem value="a_to_z">A to Z</SelectItem>
                <SelectItem value="z_to_a">Z to A</SelectItem>
                <SelectItem value="most_plaques">Most Plaques</SelectItem>
                <SelectItem value="least_plaques">Least Plaques</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Collections Content */}
          {collections.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Start Your Collection Journey"
              description="Create your first collection to organize plaques by theme, location, or any way you like!"
              actionLabel="Create Your First Collection"
              onAction={() => setCreateCollectionOpen(true)}
              secondaryActionLabel="Explore Plaques"
              onSecondaryAction={() => navigate('/discover')}
            />
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Results Found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <CollectionGrid
                  collections={filteredCollections}
                  selectedCollections={selectedCollections}
                  onToggleSelect={toggleSelect}
                  onEdit={handleOpenEditForm}
                  onDuplicate={handleDuplicateCollection}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={(id) => prepareForDelete([id])}
                  onClick={navigateToCollection}
                />
              )}
              
              {viewMode === 'list' && (
                <CollectionList
                  collections={filteredCollections}
                  selectedCollections={selectedCollections}
                  onToggleSelect={toggleSelect}
                  onEdit={handleOpenEditForm}
                  onDuplicate={handleDuplicateCollection}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={(id) => prepareForDelete([id])}
                  onClick={navigateToCollection}
                />
              )}
            </>
          )}
        </section>
      </div>
      
      {/* Action bar */}
      {selectedCollections.length > 0 && (
        <ActionBar
          title={selectedCollections.length === 1 ? "collection selected" : "collections selected"}
          count={selectedCollections.length}
          buttons={[
            {
              label: "Add to Favorites",
              icon: <Star size={16} />,
              onClick: () => handleBatchFavorite(selectedCollections),
              disabled: isLoading
            },
            {
              label: "Delete",
              variant: "destructive",
              icon: <Trash2 size={16} />,
              onClick: () => prepareForDelete(selectedCollections),
              disabled: isLoading
            }
          ]}
          onClearSelection={() => setSelectedCollections([])}
        />
      )}
      
      {/* Create Collection Form */}
      <CollectionCreateForm
        isOpen={createCollectionOpen}
        onClose={() => setCreateCollectionOpen(false)}
        onSubmit={handleCreateCollection}
        isLoading={isLoading}
      />
      
      {/* Edit Collection Form */}
      <CollectionEditForm
        isOpen={editCollectionOpen}
        onClose={() => setEditCollectionOpen(false)}
        onSubmit={handleEditCollection}
        isLoading={isLoading}
        collection={editCollectionData}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteCollectionDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onDelete={handleDeleteCollections}
        isLoading={isLoading}
        collectionNames={collectionsToDelete.map(id => {
          const collection = collections.find(c => c.id === id);
          return collection ? collection.name : '';
        }).filter(Boolean)}
      />
    </PageContainer>
  );
};

export default CollectionsPage;