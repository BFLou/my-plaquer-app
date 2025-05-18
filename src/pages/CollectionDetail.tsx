// src/pages/CollectionDetailPage.tsx
import React from 'react';
import { Check, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCollectionDetail } from '../hooks/useCollectionDetail';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewToggle } from "@/components/common/ViewToggle";
import { ActionBar } from "@/components/common/ActionBar";

// Collection Components
import CollectionDetailHeader from '../components/collections/CollectionDetailHeader';
import CollectionPlaqueGrid from '../components/collections/CollectionPlaqueGrid';
import CollectionPlaqueList from '../components/collections/CollectionPlaqueList';
import AddPlaquesButton from '../components/collections/AddPlaquesButton';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import CollectionEditForm from '../components/collections/forms/CollectionEditForm';
import AddPlaquesModal from '@/components/collections/AddPlaquesModal';

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const collectionId = id || '';
  
  // Use our collection detail hook
  const {
    collection,
    loading,
    error,
    collectionPlaques,
    filteredPlaques,
    allTags,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    activeTag,
    setActiveTag,
    isLoading,
    selectedPlaques,
    setSelectedPlaques,
    favorites,
    toggleSelectPlaque,
    handleTogglePlaqueFavorite,
    handleMarkVisited,
    handleToggleFavorite,
    handleDeleteCollection,
    handleDuplicateCollection,
    handleRemovePlaque,
    confirmRemovePlaque,
    confirmRemovePlaqueOpen,
    setConfirmRemovePlaqueOpen,
    plaqueToRemove,
    handleAddPlaques,
    handleRemovePlaques,
    handleViewPlaque,
    selectedPlaque,
    setSelectedPlaque,
    getNearbyPlaques,
    addPlaquesModalOpen,
    setAddPlaquesModalOpen,
    availablePlaques,
    fetchAvailablePlaques,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    handleSaveName,
    handleClearSearch
  } = useCollectionDetail(collectionId);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-500">Loading collection...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 font-medium mb-2">Error Loading Collection</h3>
            <p className="text-red-500 mb-4">{error || 'Collection not found'}</p>
            <Button variant="outline" onClick={() => window.location.href = '/collections'}>
              Back to Collections
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Collection exists - render the UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Collection header */}
        <CollectionDetailHeader
          collection={collection}
          onBack={() => window.location.href = '/collections'}
          onEdit={() => {/* Open edit dialog */}}
          onDuplicate={handleDuplicateCollection}
          onDelete={() => setConfirmDeleteOpen(true)}
          onToggleFavorite={handleToggleFavorite}
          onUpdateName={handleSaveName}
          isLoading={isLoading}
        />
        
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={[]} // This would come from a visits hook 
          className="mb-6" 
        />
        
        {/* Search and controls bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <div className="relative w-full md:w-auto md:min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={handleClearSearch}
                  >
                    <Search size={16} />
                  </button>
                )}
                <Input
                  placeholder="Search in this collection..."
                  className="pl-9 pr-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {allTags.length > 1 && (
                <Tabs defaultValue={activeTag} onValueChange={setActiveTag} className="w-full md:w-auto">
                  <TabsList className="overflow-auto">
                    {allTags.map(tag => (
                      <TabsTrigger 
                        key={tag} 
                        value={tag}
                        className="capitalize"
                      >
                        {tag}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <ViewToggle
                viewMode={viewMode}
                onChange={setViewMode}
                showMap={false}
              />
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently_added">Recently Added</SelectItem>
                  <SelectItem value="oldest_first">Oldest First</SelectItem>
                  <SelectItem value="a_to_z">A to Z</SelectItem>
                  <SelectItem value="z_to_a">Z to A</SelectItem>
                </SelectContent>
              </Select>
              
              <AddPlaquesButton 
                onAddPlaques={() => {
                  setAddPlaquesModalOpen(true);
                  fetchAvailablePlaques();
                }} 
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
        
        {/* Collection Content */}
        {viewMode === 'grid' ? (
          <CollectionPlaqueGrid 
            plaques={filteredPlaques}
            isLoading={isLoading}
            favorites={favorites}
            selectedPlaques={selectedPlaques}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
            onToggleSelect={toggleSelectPlaque}
            onToggleFavorite={handleTogglePlaqueFavorite}
            onPlaqueClick={handleViewPlaque}
            onAddPlaquesClick={() => {
              setAddPlaquesModalOpen(true);
              fetchAvailablePlaques();
            }}
          />
        ) : (
          <CollectionPlaqueList
            plaques={filteredPlaques}
            isLoading={isLoading}
            favorites={favorites}
            selectedPlaques={selectedPlaques}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
            onToggleSelect={toggleSelectPlaque}
            onToggleFavorite={handleTogglePlaqueFavorite}
            onPlaqueClick={handleViewPlaque}
            onAddPlaquesClick={() => {
              setAddPlaquesModalOpen(true);
              fetchAvailablePlaques();
            }}
          />
        )}
      </div>
      
      {/* Action bar (visible when plaques are selected) */}
      {selectedPlaques.length > 0 && (
        <ActionBar
          title={selectedPlaques.length === 1 ? "plaque selected" : "plaques selected"}
          count={selectedPlaques.length}
          buttons={[
            {
              label: "Mark Visited",
              icon: <Check size={16} />,
              onClick: () => {
                // Mark all selected as visited
                for (const id of selectedPlaques) {
                  handleMarkVisited(id);
                }
                setSelectedPlaques([]);
              },
              disabled: isLoading
            },
            {
              label: "Remove",
              variant: "destructive",
              icon: <Trash2 size={16} />,
              onClick: handleRemovePlaques,
              disabled: isLoading
            }
          ]}
          onClearSelection={() => setSelectedPlaques([])}
        />
      )}
      
      {/* Plaque detail sheet */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={() => setSelectedPlaque(null)}
          onFavoriteToggle={() => selectedPlaque && handleTogglePlaqueFavorite(selectedPlaque.id)}
          isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
          onMarkVisited={() => selectedPlaque && handleMarkVisited(selectedPlaque.id)}
          nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
          onRemove={() => {
            if (selectedPlaque) {
              handleRemovePlaque(selectedPlaque.id);
              setSelectedPlaque(null);
            }
          }}
        />
      )}
      
      {/* Add plaques modal */}
      <AddPlaquesModal
        isOpen={addPlaquesModalOpen}
        onClose={() => setAddPlaquesModalOpen(false)}
        onAddPlaques={handleAddPlaques}
        availablePlaques={availablePlaques}
        isLoading={isLoading}
      />
      
      {/* Remove single plaque confirmation */}
      <DeleteCollectionDialog
        isOpen={confirmRemovePlaqueOpen}
        onClose={() => {
          setConfirmRemovePlaqueOpen(false);
          setPlaqueToRemove(null);
        }}
        onDelete={confirmRemovePlaque}
        isLoading={isLoading}
        collectionNames={['Remove this plaque']}
      />
      
      {/* Delete collection confirmation */}
      <DeleteCollectionDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onDelete={handleDeleteCollection}
        isLoading={isLoading}
        collectionNames={[collection.name]}
      />
      
      {/* Edit collection form */}
      <CollectionEditForm
        isOpen={false} // This would be controlled by state
        onClose={() => {/* Close edit form */}}
        onSubmit={() => {/* Handle edit form submit */}}
        isLoading={isLoading}
        collection={collection}
      />
    </div>
  );
};

export default CollectionDetailPage;