// src/pages/CollectionDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Filter, Map, Trash2, Plus, Grid, List, Navigation, 
  Route as RouteIcon, ArrowLeft, Star, Pencil, Share2, 
  Copy, Edit, Trash, MapPin, X, Info, BookOpen, User, Clock
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
import CollectionEditForm from '../components/collections/forms/CollectionEditForm';
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

  // Handle share collection
  const handleShareCollection = async () => {
    if (!collection) return;
    
    // Get shareable URL
    const shareUrl = `${window.location.origin}/collections/${collection.id}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: `Check out my collection "${collection.name}" on Plaquer!`,
          url: shareUrl
        });
        toast.success('Collection shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing collection:', err);
          // Fallback to copying link
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to copying link
      copyToClipboard(shareUrl);
    }
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-10 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Back to collections link */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/collections')} 
              className="h-8 w-8 p-0 bg-white/20 text-white hover:bg-white/30"
            >
              <ArrowLeft size={18} />
            </Button>
            <a 
              className="text-white/80 hover:text-white text-sm cursor-pointer" 
              onClick={() => navigate('/collections')}
            >
              Collections
            </a>
            <span className="text-white/50">/</span>
          </div>
          
          {/* Collection header with title and actions */}
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-white text-2xl ${collection.color} shadow-lg`}>
                {collection.icon}
              </div>
              
              {editNameMode ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="bg-white/10 text-white text-xl font-bold py-1 px-2 rounded border border-white/20 backdrop-blur-sm"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 p-0 text-green-300 bg-white/10 hover:bg-white/20"
                    disabled={isLoading}
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 p-0 text-red-300 bg-white/10 hover:bg-white/20"
                    disabled={isLoading}
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{collection.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditName} 
                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={collection.is_favorite ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
                className={collection.is_favorite ? "bg-amber-500/30 text-white border-amber-300/50" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}
                disabled={isLoading}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "fill-amber-300" : ""}`} 
                />
                {collection.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleShareCollection}
                disabled={isLoading}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              
              <div className="dropdown">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 w-9 p-0 bg-white/10 text-white border-white/20 hover:bg-white/20" 
                  disabled={isLoading}
                >
                  <Edit size={16} />
                </Button>
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => setEditFormOpen(true)}>
                    <Pencil size={16} className="mr-2" /> Edit Collection
                  </div>
                  <div className="dropdown-item" onClick={handleDuplicateCollection}>
                    <Copy size={16} className="mr-2" /> Duplicate
                  </div>
                  <div className="dropdown-item text-red-500" onClick={() => setConfirmDeleteOpen(true)}>
                    <Trash2 size={16} className="mr-2" /> Delete Collection
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Collection metadata */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              <Clock size={12} className="mr-1" /> Updated {collection.updated_at}
            </Badge>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {collection.plaques?.length || 0} plaques
            </Badge>
            {collection.is_favorite && (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                <Star size={12} className="mr-1 fill-amber-300" /> Favorite
              </Badge>
            )}
          </div>
          
          {/* Collection description */}
          {collection.description && (
            <p className="text-white/80 mt-4 max-w-3xl">{collection.description}</p>
          )}
        </div>
      </section>
      
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={[]} // This would come from a visits hook 
          className="mb-6" 
        />
        
        {/* Additional Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex gap-3 items-start">
            <Info size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">About This Collection</h3>
              <p className="text-blue-700 text-sm">
                This collection contains {collectionPlaques.length} plaques. 
                {collectionPlaques.filter(p => p.visited).length > 0 && 
                  ` You've visited ${collectionPlaques.filter(p => p.visited).length} of them.`
                }
                {collection.is_favorite && ` This is one of your favorite collections.`}
              </p>
              <p className="text-blue-700 text-sm mt-2">
                <span className="font-medium">Tip:</span> You can add more plaques to this collection from the Discover page.
              </p>
            </div>
          </div>
        </div>
        
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
      
      {/* Edit collection form */}
      <CollectionEditForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleUpdateCollection}
        isLoading={isLoading}
        collection={collection}
      />
    </PageContainer>
  );
};

export default CollectionDetailPage;