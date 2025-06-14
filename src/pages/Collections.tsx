// src/pages/Collections.tsx - Updated with breadcrumb navigation
import { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Trash2,
  FolderOpen,
  Plus,
  Search,
  Grid,
  List,
  X,
  ArrowLeft,
} from 'lucide-react';
import { PageContainer } from '@/components';
import { useNavigate } from 'react-router-dom';
import { useCollectionsList } from '../hooks/useCollectionsList';
import { useCollectionActions } from '../hooks/useCollectionActions';

// Collection Components
import CollectionGrid from '../components/collections/CollectionGrid';
import CollectionList from '../components/collections/CollectionList';
import CollectionCreateForm from '../components/collections/forms/CollectionCreateForm';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionBar } from '@/components/common/ActionBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    setShowOnlyFavorites,
    selectedCollections,
    setSelectedCollections,
    filteredCollections,
    resetFilters,
    toggleSelect,
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
  } = useCollectionActions();

  // NEW: ActiveTab state for toggling between All/Favorites/Recent
  const [activeTab, setActiveTab] = useState('all');

  // Handle tab change
  const handleTabChange = (tab: string) => {
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

  const favoriteCollections = collections.filter((c) => c.is_favorite).length;

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle open edit form - Improved to ensure data is properly set
  const handleOpenEditForm = (id: string) => {
    console.log('Opening edit form for collection ID:', id);
    const collection = collections.find((c) => c.id === id);
    console.log('Found collection for editing:', collection);

    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };

  // For debugging purposes
  useEffect(() => {
    if (editCollectionData) {
      console.log('Current editCollectionData:', editCollectionData);
    }
  }, [editCollectionData]);

  // Show loading state
  if (loading && collections.length === 0) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading collections...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 font-medium mb-2">
              Error Loading Collections
            </h3>
            <p className="text-red-500 mb-4">
              There was a problem loading your collections.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="library" simplifiedFooter={true}>
      {/* Hero Section with breadcrumb */}
      <section className="relative bg-gradient-to-br from-purple-600 to-purple-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/library')}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <a
              className="text-white/80 hover:text-white text-sm cursor-pointer"
              onClick={() => navigate('/library')}
            >
              My Library
            </a>
            <span className="text-white/50">/</span>
            <span className="text-white font-medium">Collections</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FolderOpen size={24} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold">My Collections</h1>
                <p className="opacity-90 text-sm">
                  Organize and explore your favorite London plaques in themed
                  collections.
                </p>
              </div>
            </div>

            {/* Prominent Create New Collection Button */}
            <Button
              onClick={() => setCreateCollectionOpen(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-purple-600">
                {collections.length}
              </div>
              <div className="text-xs text-gray-500">Collections</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-green-600">
                {totalPlaques}
              </div>
              <div className="text-xs text-gray-500">Plaques</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-amber-600">
                {favoriteCollections}
              </div>
              <div className="text-xs text-gray-500">Favorites</div>
            </div>
          </div>

          <div className="flex items-center">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recently_updated">
                  Recently Updated
                </SelectItem>
                <SelectItem value="oldest_updated">Oldest Updated</SelectItem>
                <SelectItem value="a_to_z">A to Z</SelectItem>
                <SelectItem value="z_to_a">Z to A</SelectItem>
                <SelectItem value="most_plaques">Most Plaques</SelectItem>
                <SelectItem value="least_plaques">Least Plaques</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Bar and Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('all')}
            >
              All Collections
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'favorites' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('favorites')}
            >
              Favorites
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'recent' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('recent')}
            >
              Recently Updated
            </button>
          </div>

          {/* Search and View Toggle */}
          <div className="p-3 flex items-center gap-3">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
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
          </div>
        </div>

        {/* Secondary Create Collection Button for empty state */}
        {collections.length === 0 && (
          <div className="flex justify-center my-6">
            <Button
              size="lg"
              onClick={() => setCreateCollectionOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={18} /> Create Your First Collection
            </Button>
          </div>
        )}

        {/* Collections Grid/List */}
        {collections.length === 0 ? (
          <EmptyState
            icon={<FolderOpen />}
            title="Start Your Collection Journey"
            description="Create your first collection to organize plaques by theme, location, or any way you like!"
          />
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <MapPin className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No Results Found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
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
                onClick={(id) => navigate(`/library/collections/${id}`)} // Updated path
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
                onClick={(id) => navigate(`/library/collections/${id}`)} // Updated path
              />
            )}
          </>
        )}
      </div>

      {/* Action bar */}
      {selectedCollections.length > 0 && (
        <ActionBar
          title={
            selectedCollections.length === 1
              ? 'collection selected'
              : 'collections selected'
          }
          count={selectedCollections.length}
          buttons={[
            {
              label: 'Add to Favorites',
              icon: <Star size={16} />,
              onClick: () => handleBatchFavorite(selectedCollections),
            },
            {
              label: 'Delete',
              variant: 'destructive',
              icon: <Trash2 size={16} />,
              onClick: () => prepareForDelete(selectedCollections),
            },
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

      {/* Edit Collection */}
      {editCollectionData && (
        <CollectionCreateForm
          isOpen={editCollectionOpen}
          onClose={() => {
            setEditCollectionOpen(false);
            setTimeout(() => setEditCollectionData(null), 300);
          }}
          onSubmit={handleEditCollection}
          isLoading={isLoading}
          initialValues={{
            name: editCollectionData.name || '',
            description: editCollectionData.description || '',
            icon: editCollectionData.icon || '🎭',
            color: editCollectionData.color || 'bg-purple-500',
          }}
          submitLabel="Save Changes"
          title="Edit Collection"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteCollectionDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onDelete={handleDeleteCollections}
        isLoading={isLoading}
        collectionNames={collectionsToDelete
          .map((id) => {
            const collection = collections.find((c) => c.id === id);
            return collection ? collection.name : '';
          })
          .filter(Boolean)}
      />
    </PageContainer>
  );
};

export default CollectionsPage;
