// src/pages/CollectionDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Filter, Map, Trash2, Plus, Grid, List, Navigation, 
  RouteIcon, ArrowLeft, Star, Pencil, Copy, Edit, Trash, MapPin, X, Clock
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionDetail } from '../hooks/useCollectionDetail';

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionBar } from "@/components/common/ActionBar";
import { toast } from 'sonner';

// Collection Components
import CollectionDetailHeader from '../components/collections/CollectionDetailHeader';
import CollectionPlaqueGrid from '../components/collections/CollectionPlaqueGrid';
import CollectionPlaqueList from '../components/collections/CollectionPlaqueList';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import CollectionCreateForm from '../components/collections/forms/CollectionCreateForm'; // Import the CollectionCreateForm instead
import AddPlaquesModal from '@/components/collections/AddPlaquesModal';
import CollectionFilterView from '@/components/collections/CollectionFilterView';
import { EmptyState } from '@/components/common/EmptyState';
import PlaqueMap from '../components/maps/PlaqueMap';
import { useRoutes } from '@/hooks/useRoutes';
import { PageContainer } from "@/components";
import { formatTimeAgo } from '../utils/timeUtils';

const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const collectionId = id || '';
  const mapRef = useRef(null);
  const { createRoute } = useRoutes();
  
  // Use our collection detail hook
  const {
    collection,
    loading,
    error,
    collectionPlaques,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
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
    editNameMode,
    editNameValue,
    handleCancelEdit,
    handleEditName,
    editFormOpen,
    setEditFormOpen,
    handleUpdateCollection
  } = useCollectionDetail(collectionId);

  // State for filtered plaques
  const [filteredPlaques, setFilteredPlaques] = useState(collectionPlaques);
  
  // Additional state for map view
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [useImperial, setUseImperial] = useState(false);
  const [useRoadRouting, setUseRoadRouting] = useState(true);
  const [maintainMapView, setMaintainMapView] = useState(false);

  // Update filtered plaques when collection plaques change
  useEffect(() => {
    setFilteredPlaques(collectionPlaques);
  }, [collectionPlaques]);

  // Add plaque to route
  const addPlaqueToRoute = (plaque) => {
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info("This plaque is already in your route.");
      return;
    }
    
    setMaintainMapView(true);
    setRoutePoints(prev => {
      const newPoints = [...prev, plaque];
      
      if (newPoints.length >= 2 && mapRef.current) {
        setTimeout(() => {
          if (mapRef.current && mapRef.current.drawRouteLine) {
            mapRef.current.drawRouteLine(newPoints, useRoadRouting, true);
          }
        }, 50);
      }
      
      return newPoints;
    });
    
    toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
  };

  // Remove plaque from route
  const removePlaqueFromRoute = (plaqueId) => {
    setRoutePoints(prev => {
      const updatedPoints = prev.filter(p => p.id !== plaqueId);
      
      if (updatedPoints.length >= 2 && mapRef.current) {
        setTimeout(() => {
          if (mapRef.current && mapRef.current.drawRouteLine) {
            mapRef.current.drawRouteLine(updatedPoints);
          }
        }, 50);
      } else if (updatedPoints.length < 2 && mapRef.current) {
        if (mapRef.current.clearRoute) {
          mapRef.current.clearRoute();
        }
      }
      
      return updatedPoints;
    });
    
    toast.info("Removed plaque from route");
  };

  // Clear route
  const clearRoute = () => {
    if (mapRef.current && mapRef.current.clearRoute) {
      mapRef.current.clearRoute();
    }
    setRoutePoints([]);
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <PageContainer
        activePage="collections"
        simplifiedFooter={true}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading collection...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state
  if (error || !collection) {
    return (
      <PageContainer
        activePage="collections"
        simplifiedFooter={true}
      >
        <div className="min-h-screen bg-gray-50 pt-6">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 font-medium mb-2">Error Loading Collection</h3>
              <p className="text-red-500 mb-4">{error || 'Collection not found'}</p>
              <Button variant="outline" onClick={() => navigate('/collections')}>
                Back to Collections
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Collection exists - render the UI
  return (
    <PageContainer
      activePage="collections"
      simplifiedFooter={true}
    >
      {/* Custom header */}
      <CollectionDetailHeader
        collection={collection}
        onBack={() => navigate('/collections')}
        onEdit={() => setEditFormOpen(true)}
        onDuplicate={handleDuplicateCollection}
        onDelete={() => setConfirmDeleteOpen(true)}
        onToggleFavorite={handleToggleFavorite}
        onUpdateName={handleSaveName}
        isLoading={isLoading}
      />
      
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={[]} // This would come from a visits hook 
          className="mb-6" 
        />
        
        {/* Collection Filter View */}
        <CollectionFilterView
          plaques={collectionPlaques}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddPlaquesClick={() => {
            setAddPlaquesModalOpen(true);
            fetchAvailablePlaques();
          }}
          isLoading={isLoading}
          onFilterChange={setFilteredPlaques}
        >
          {collectionPlaques.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Plaques in this Collection"
              description="Start building your collection by adding plaques"
              actionLabel="Add Your First Plaque"
              onAction={() => {
                setAddPlaquesModalOpen(true);
                fetchAvailablePlaques();
              }}
            />
          ) : filteredPlaques.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Plaques Match Your Filters</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or clear filters</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
              >
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'map' ? (
            <div className="relative">
              <div className="h-[650px] rounded-lg overflow-hidden shadow-md">
                <PlaqueMap
                  ref={mapRef}
                  plaques={filteredPlaques}
                  onPlaqueClick={handleViewPlaque}
                  favorites={favorites}
                  selectedPlaqueId={selectedPlaque?.id}
                  maintainView={maintainMapView}
                  className="h-full w-full"
                  isRoutingMode={isRoutingMode}
                  setIsRoutingMode={setIsRoutingMode}
                  routePoints={routePoints}
                  addPlaqueToRoute={addPlaqueToRoute}
                  removePlaqueFromRoute={removePlaqueFromRoute}
                  clearRoute={clearRoute}
                />
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <CollectionPlaqueGrid 
              plaques={filteredPlaques}
              isLoading={isLoading}
              favorites={favorites}
              selectedPlaques={selectedPlaques}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onToggleSelect={toggleSelectPlaque}
              onToggleFavorite={handleTogglePlaqueFavorite}
              onMarkVisited={handleMarkVisited}
              onRemovePlaque={handleRemovePlaque}
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
              onClearSearch={() => setSearchQuery('')}
              onToggleSelect={toggleSelectPlaque}
              onToggleFavorite={handleTogglePlaqueFavorite}
              onPlaqueClick={handleViewPlaque}
              onAddPlaquesClick={() => {
                setAddPlaquesModalOpen(true);
                fetchAvailablePlaques();
              }}
            />
          )}
        </CollectionFilterView>
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
      
      {/* Edit collection form - Now using CollectionCreateForm instead of CollectionEditForm */}
      <CollectionCreateForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleUpdateCollection}
        isLoading={isLoading}
        initialValues={{
          name: collection.name || '',
          description: collection.description || '',
          icon: collection.icon || '🎭',
          color: collection.color || 'bg-blue-500',
          isPublic: collection.is_public || false,
          tags: collection.tags || []
        }}
        submitLabel="Save Changes"
        title="Edit Collection"
      />
    </PageContainer>
  );
};

export default CollectionDetailPage;