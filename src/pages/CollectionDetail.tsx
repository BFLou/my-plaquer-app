// src/pages/CollectionDetail.tsx - Updated with breadcrumb navigation
import{ useState, useEffect, useRef } from 'react';
import { 
  Check, Trash2, ArrowLeft, Star, Pencil, Copy, Edit, MapPin, X, Clock
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionDetail } from '../hooks/useCollectionDetail';

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionBar } from "@/components/common/ActionBar";
import { toast } from 'sonner';

// Collection Components
import CollectionPlaqueGrid from '../components/collections/CollectionPlaqueGrid';
import CollectionPlaqueList from '../components/collections/CollectionPlaqueList';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import CollectionCreateForm from '../components/collections/forms/CollectionCreateForm';
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
        activePage="library"
        simplifiedFooter={true}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
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
        activePage="library"
        simplifiedFooter={true}
      >
        <div className="min-h-screen bg-gray-50 pt-6">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 font-medium mb-2">Error Loading Collection</h3>
              <p className="text-red-500 mb-4">{error || 'Collection not found'}</p>
              <Button variant="outline" onClick={() => navigate('/library/collections')}>
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
      activePage="library"
      simplifiedFooter={true}
    >
      {/* Custom header with breadcrumb */}
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
            <a 
              className="text-white/80 hover:text-white text-sm cursor-pointer" 
              onClick={() => navigate('/library/collections')}
            >
              Collections
            </a>
            <span className="text-white/50">/</span>
            <span className="text-white font-medium truncate max-w-xs">{collection.name}</span>
          </div>

          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${collection.color}`}>
                {collection.icon}
              </div>
              
              {editNameMode ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="text-xl font-bold py-1 px-2 bg-white/20 text-white placeholder-white/70 border border-white/30 rounded"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 p-0 text-green-400 hover:bg-white/20"
                    disabled={isLoading}
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 p-0 text-red-400 hover:bg-white/20"
                    disabled={isLoading}
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{collection.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditName} 
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={collection.is_favorite ? "outline" : "ghost"}
                size="sm"
                onClick={handleToggleFavorite}
                className={collection.is_favorite ? 
                  "bg-white/20 text-white border-white/30 hover:bg-white/30" : 
                  "text-white hover:bg-white/20"
                }
                disabled={isLoading}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "fill-current" : ""}`} 
                />
                {collection.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/library/collections/${collection.id}`;
                  copyToClipboard(shareUrl);
                }}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                disabled={isLoading}
              >
                <Copy size={16} className="mr-2" />
                Share
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setEditFormOpen(true)}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                disabled={isLoading}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            </div>
          </div>
          
          {collection.description && (
            <p className="text-white/80 mt-3 max-w-3xl">{collection.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Clock size={12} className="mr-1" /> Updated {formatTimeAgo(collection.updated_at)}
            </Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {collectionPlaques.length} plaques
            </Badge>
            {collection.is_public && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                Public
              </Badge>
            )}
            {collection.is_favorite && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <Star size={12} className="mr-1 fill-current" /> Favorite
              </Badge>
            )}
            {collection.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="bg-white/20 text-white border-white/30">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={[]}
          className="mb-4 sm:mb-6 -mt-5 relative z-10" 
        />
        
        {/* Collection Filter View with improved mobile handling */}
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
          showMapView={true}
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
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
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
              <div className="h-[450px] sm:h-[650px] rounded-lg overflow-hidden shadow-md">
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
              onMarkVisited={handleMarkVisited}
              onRemovePlaque={handleRemovePlaque}
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
        collectionNames={[]}
        itemType="plaque"
        plaqueTitle={plaqueToRemove ? collectionPlaques.find(p => p.id === plaqueToRemove)?.title : undefined}
      />

      {/* Delete collection confirmation */}
      <DeleteCollectionDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onDelete={handleDeleteCollection}
        isLoading={isLoading}
        collectionNames={[collection.name]}
        itemType="collection"
      />
      
      {/* Edit collection form */}
      <CollectionCreateForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleUpdateCollection}
        isLoading={isLoading}
        initialValues={{
          name: collection.name || '',
          description: collection.description || '',
          icon: collection.icon || '🎭',
          color: collection.color || 'bg-purple-500',
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