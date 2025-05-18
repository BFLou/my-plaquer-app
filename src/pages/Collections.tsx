// src/pages/CollectionsPage.tsx
import React from 'react';
import { MapPin, Star, Trash2 } from 'lucide-react';
import { PageContainer } from "@/components";
import { useCollectionsList } from '../hooks/useCollectionsList';
import { useCollectionActions } from '../hooks/useCollectionActions';

// Collection Components
import CollectionHeader from '../components';
import CollectionToolbar from '../components/collections/CollectionToolbar';
import CollectionGrid from '../components/collections/CollectionGrid';
import CollectionList from '../components/collections/CollectionList';
import CollectionCreateForm from '../components/collections/forms/CollectionCreateForm';
import CollectionEditForm from '../components/collections/forms/CollectionEditForm';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionBar } from '@/components/common/ActionBar';
import { Button } from '@/components/ui/button';

const CollectionsPage: React.FC = () => {
  // Use our custom hooks
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

  // Prepare edit form
  const handleOpenEditForm = (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };

  // Show loading state
  if (loading && collections.length === 0) {
    return (
      <PageContainer activePage="collections" containerClass="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Collections</h1>
            <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
              <p className="text-gray-500">Loading collections...</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <PageContainer activePage="collections" containerClass="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Collections</h1>
            <Button onClick={() => setCreateCollectionOpen(true)}>
              Create Collection
            </Button>
          </div>
          
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
    <PageContainer activePage="collections" containerClass="flex-grow">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <CollectionHeader
          title="My Collections"
          onCreateCollection={() => setCreateCollectionOpen(true)}
          isLoading={isLoading}
        />
        
        {/* Toolbar */}
        <CollectionToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
          activeFilters={activeFilters}
        />
        
        {/* Collections */}
        {collections.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Collections Yet"
            description="Start by creating your first collection to organize your plaques"
            actionLabel="Create Your First Collection"
            onAction={() => setCreateCollectionOpen(true)}
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
        
        {/* Multi-select Action Bar */}
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
      </div>
    </PageContainer>
  );
};

export default CollectionsPage;