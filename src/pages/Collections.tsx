// src/pages/Collections.tsx
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, Trash2, FolderOpen, Plus, 
  Filter, Search, Grid, List, X, 
  CheckCircle, MoreHorizontal, Package
} from 'lucide-react';
import { PageContainer } from "@/components";
import { useNavigate, useLocation } from "react-router-dom";
import { useCollectionsList } from '../hooks/useCollectionsList';
import { useCollectionActions } from '../hooks/useCollectionActions';

// Collection Components
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CollectionsPage = () => {
  const navigate = useNavigate();
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
  
  // NEW: ActiveTab state for toggling between All/Favorites/Recent
  const [activeTab, setActiveTab] = useState('all');
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'favorites') {
      setShowOnlyFavorites(true);
    } else {
      setShowOnlyFavorites(false);
    }
    
    // If we select 'recent' tab, we need to set sort to 'recently_updated'
    if (tab === 'recent') {
      setSortOption('recently_updated');
    }
  };
  
  // Calculate collection stats
  const totalPlaques = collections.reduce((sum, c) => {
    return sum + (Array.isArray(c.plaques) ? c.plaques.length : c.plaques || 0);
  }, 0);
  
  const favoriteCollections = collections.filter(c => c.is_favorite).length;
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle open edit form
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
{/* Hero Section with decorative background circles */}
<section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 px-4 overflow-hidden">
  {/* Decorative background circles */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
    <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
    <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
  </div>
  
  <div className="container mx-auto max-w-5xl relative z-10">
    <h1 className="text-2xl font-bold">My Collections</h1>
    <p className="opacity-90 mt-1">
      Organize and explore your favorite London plaques in personalized collections.
    </p>
  </div>
</section>
      
      <div className="container mx-auto max-w-5xl px-4">
        {/* NEW: Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-blue-600">{collections.length}</div>
              <div className="text-xs text-gray-500">Collections</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-green-600">{totalPlaques}</div>
              <div className="text-xs text-gray-500">Plaques</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-amber-600">{favoriteCollections}</div>
              <div className="text-xs text-gray-500">Favorites</div>
            </div>
          </div>
          
          <div className="flex items-center">
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
        </div>
        
        {/* NEW: Tab Bar and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('all')}
            >
              All Collections
            </button>
            <button 
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'favorites' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('favorites')}
            >
              Favorites
            </button>
            <button 
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'recent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('recent')}
            >
              Recently Updated
            </button>
          </div>
          
          {/* Search and View Toggle */}
          <div className="p-3 flex items-center gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={handleClearSearch}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
            
            <button 
              className={`p-2 rounded-lg ${activeFilters.length > 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
              onClick={() => {/* Show filter dialog */}}
              title="Filter"
            >
              <Filter size={18} />
              {activeFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Collections Grid/List */}
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
          <div className="text-center py-12 bg-white rounded-lg">
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
      </div>
      
      {/* NEW: Floating Action Button */}
      <div className="fixed right-6 bottom-6">
        <Button 
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center p-0"
          onClick={() => setCreateCollectionOpen(true)}
        >
          <Plus size={24} />
        </Button>
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