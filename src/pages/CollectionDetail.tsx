// src/pages/CollectionDetail.tsx - Complete mobile-optimized collection detail page
import { useState, useEffect, useCallback } from 'react';
import { 
  Check, Trash2, Star, Pencil, Edit, MapPin, X, Clock, 
  ArrowLeft, Plus, Grid, List, Map as MapIcon, Share2, Download, Route as RouteIcon
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCollectionDetail } from '../hooks/useCollectionDetail';

// Mobile UI Components
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { MobileInput } from "@/components/ui/mobile-input";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
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
import { MapContainer } from "../components/maps/MapContainer";
import { useRoutes } from '@/hooks/useRoutes';
import { PageContainer } from "@/components";
import { formatTimeAgo } from '../utils/timeUtils';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { navigateToPlaqueWithContext } from '@/utils/navigationUtils';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

// --- Types ---
interface Plaque {
  id: number;
  title: string;
  location?: string;
  address?: string;
  postcode?: string;
  profession?: string;
  lead_subject_born_in?: string;
  lead_subject_died_in?: string;
  erected?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface ActionBarButton {
  label: string;
  variant?: 'default' | 'destructive' | 'outline';
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

// --- End Types ---

const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionId = id || '';
  const { createRoute } = useRoutes();
  const { isKeyboardOpen } = useKeyboardDetection();
  
  // Modal plaque from URL
  const modalPlaqueId = searchParams.get('plaque') ? parseInt(searchParams.get('plaque')!) : null;
  
  // Mobile-specific state
  const [mobileViewMode, setMobileViewMode] = useState<'overview' | 'plaques' | 'map'>('overview');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [routeName, setRouteName] = useState('');

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
    handleRemovePlaque,
    confirmRemovePlaque,
    confirmRemovePlaqueOpen,
    setConfirmRemovePlaqueOpen,
    plaqueToRemove,
    handleAddPlaques,
    handleRemovePlaques,
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
    handleCancelEdit,
    handleEditName,
    editFormOpen,
    setEditFormOpen,
    handleUpdateCollection
  } = useCollectionDetail(collectionId);

  // Add missing state for edit name value
  const [localEditNameValue, setLocalEditNameValue] = useState(collection?.name || '');

  // State for filtered plaques
  const [filteredPlaques, setFilteredPlaques] = useState<Plaque[]>(collectionPlaques);
  
  // Swipe gesture for mobile navigation
  const swipeGesture = useSwipeGesture({
    onSwipe: (direction: string) => {
      if (direction === 'right' && isMobile()) {
        triggerHapticFeedback('light');
        handleMobileBack();
      }
    },
    threshold: 50
  });

  // Helper function to get collection timestamp
  const getCollectionTimestamp = (collection: any) => {
    return collection.updated_at || collection.created_at || collection.date_created || new Date().toISOString();
  };

  // Handle modal plaque from URL
  useEffect(() => {
    if (modalPlaqueId && collectionPlaques.length > 0) {
      const plaque = collectionPlaques.find((p: Plaque) => p.id === modalPlaqueId);
      if (plaque) {
        console.log('Opening modal for plaque from URL:', plaque.title);
        setSelectedPlaque(plaque);
      } else {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('plaque');
        setSearchParams(newParams, { replace: true });
      }
    } else if (!modalPlaqueId) {
      setSelectedPlaque(null);
    }
  }, [modalPlaqueId, collectionPlaques, searchParams, setSearchParams, setSelectedPlaque]);

  // Update filtered plaques when collection plaques change
  useEffect(() => {
    setFilteredPlaques(collectionPlaques);
  }, [collectionPlaques]);

  // ENHANCED: Plaque click handler with proper context
  const handlePlaqueClick = useCallback((plaque: Plaque) => {
    console.log('Plaque clicked in collection:', plaque.title);
    triggerHapticFeedback('selection');
    
    if (!collection) {
      console.warn('No collection available for context');
      return;
    }
    
    // Calculate progress information
    const plaqueIndex = collectionPlaques.findIndex((p: Plaque) => p.id === plaque.id);
    const progress = plaqueIndex >= 0 ? `${plaqueIndex + 1} of ${collectionPlaques.length}` : undefined;
    
    // Navigate with proper collection context
    navigateToPlaqueWithContext(navigate, plaque.id, {
      from: 'collection',
      collectionId: collection.id,
      collectionName: collection.name,
      progress: progress
    });
  }, [navigate, collection, collectionPlaques]);

  // ENHANCED: Modal close handler with context preservation
  const handleCloseModal = useCallback(() => {
    console.log('Closing plaque modal in collection');
    setSelectedPlaque(null);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('plaque');
    
    if (collection) {
      newParams.set('from', 'collection');
      newParams.set('collection', collection.id);
      newParams.set('collectionName', collection.name);
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, collection, setSelectedPlaque]);

  // ENHANCED: Nearby plaque selection with context
  const handleSelectNearbyPlaque = useCallback((nearbyPlaque: Plaque) => {
    console.log('Selecting nearby plaque in collection:', nearbyPlaque.title);
    triggerHapticFeedback('selection');
    
    if (!collection) {
      console.warn('No collection available for nearby plaque context');
      return;
    }
    
    navigateToPlaqueWithContext(navigate, nearbyPlaque.id, {
      from: 'collection',
      collectionId: collection.id,
      collectionName: collection.name
    });
  }, [navigate, collection]);

  // Mobile-optimized handlers
  const handleMobileBack = () => {
    triggerHapticFeedback('light');
    navigate('/library/collections');
  };

  const handleMobileToggleFavorite = () => {
    triggerHapticFeedback('medium');
    handleToggleFavorite();
  };

  const handleMobileShare = async () => {
    if (!collection) return;
    
    triggerHapticFeedback('light');
    const shareUrl = `${window.location.origin}/library/collections/${collection.id}`;
    const shareText = `Check out my "${collection.name}" collection with ${collectionPlaques.length} historic plaques!`;
    
    if (navigator.share && isMobile()) {
      try {
        await navigator.share({
          title: collection.name,
          text: shareText,
          url: shareUrl
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  const handleMobileAddPlaques = () => {
    triggerHapticFeedback('light');
    setAddPlaquesModalOpen(true);
    fetchAvailablePlaques();
  };

  const handleExportCollection = () => {
    if (!collection) return;
    
    triggerHapticFeedback('light');
    
    if (collectionPlaques.length === 0) {
      toast.error('No plaques to export');
      return;
    }

    try {
      const csvData = [
        ['Title', 'Location', 'Address', 'Postcode', 'Profession', 'Born', 'Died', 'Erected'],
        ...collectionPlaques.map((plaque: Plaque) => [
          plaque.title || '',
          plaque.location || '',
          plaque.address || '',
          plaque.postcode || '',
          plaque.profession || '',
          plaque.lead_subject_born_in || '',
          plaque.lead_subject_died_in || '',
          plaque.erected || ''
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name.replace(/\s+/g, '-').toLowerCase()}-plaques.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Collection exported as CSV');
    } catch (error) {
      console.error('Error exporting collection:', error);
      toast.error('Failed to export collection');
    }
  };

  const handleCreateRoute = () => {
    if (!collection) return;
    
    if (collectionPlaques.length < 2) {
      toast.error('Need at least 2 plaques to create a route');
      return;
    }
    
    triggerHapticFeedback('light');
    setRoutePoints([]);
    setRouteName(`${collection.name} Route`);
    setShowRouteBuilder(true);
  };

  const handleAddToRoute = (plaque: Plaque) => {
    if (routePoints.some((p: Plaque) => p.id === plaque.id)) {
      toast.info('Plaque already in route');
      return;
    }
    
    triggerHapticFeedback('light');
    setRoutePoints(prev => [...prev, plaque]);
    toast.success(`Added to route (${routePoints.length + 1} stops)`);
  };

  const handleRemoveFromRoute = (plaqueId: number) => {
    triggerHapticFeedback('light');
    setRoutePoints(prev => prev.filter((p: Plaque) => p.id !== plaqueId));
  };

  const handleSaveRoute = async () => {
    if (routePoints.length < 2) {
      toast.error('Route needs at least 2 stops');
      return;
    }

    if (!routeName.trim()) {
      toast.error('Please enter a route name');
      return;
    }

    try {
      triggerHapticFeedback('success');
      
      // Fix: Pass required arguments: name, description, plaques array
      await createRoute(
        routeName.trim(),
        `Route created from collection "${collection ? collection.name : ''}"`,
        routePoints
      );
      
      setShowRouteBuilder(false);
      setRoutePoints([]);
      toast.success('Route created successfully!');
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <PageContainer
        activePage="library"
        simplifiedFooter={true}
        paddingBottom="mobile-nav"
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
        paddingBottom="mobile-nav"
      >
        <div className="min-h-screen bg-gray-50 pt-6">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 font-medium mb-2">Error Loading Collection</h3>
              <p className="text-red-500 mb-4">{typeof error === 'string' ? error : 'Collection not found'}</p>
              <MobileButton 
                variant="outline" 
                onClick={() => navigate('/library/collections')}
                touchOptimized
              >
                Back to Collections
              </MobileButton>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Mobile actions for header
  const mobileHeaderActions = [
    {
      label: collection.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: <Star size={16} className={collection.is_favorite ? 'fill-current' : ''} />,
      onClick: handleMobileToggleFavorite
    },
    {
      label: 'Share Collection',
      icon: <Share2 size={16} />,
      onClick: () => setShowShareOptions(true)
    },
    {
      label: 'Export Collection',
      icon: <Download size={16} />,
      onClick: handleExportCollection
    },
    {
      label: 'Edit Collection',
      icon: <Edit size={16} />,
      onClick: () => setEditFormOpen(true)
    },
    {
      label: 'Delete Collection',
      icon: <Trash2 size={16} />,
      onClick: () => setConfirmDeleteOpen(true),
      variant: 'destructive' as const
    }
  ];

  // Desktop version (hidden on mobile)
  const renderDesktopHeader = () => (
    <section className="hidden md:block relative bg-gradient-to-br from-purple-600 to-purple-700 text-white py-6 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
        <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <MobileButton 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/library')} 
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            touchOptimized
          >
            <ArrowLeft size={18} />
          </MobileButton>
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
                  value={localEditNameValue}
                  onChange={(e) => setLocalEditNameValue(e.target.value)}
                  className="text-xl font-bold py-1 px-2 bg-white/20 text-white placeholder-white/70 border border-white/30 rounded"
                  disabled={isLoading}
                  autoFocus
                />
                <MobileButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    handleSaveName();
                    setLocalEditNameValue(collection?.name || '');
                  }} 
                  className="h-8 w-8 p-0 text-green-400 hover:bg-white/20"
                  disabled={isLoading}
                  touchOptimized
                >
                  <Check size={18} />
                </MobileButton>
                <MobileButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    handleCancelEdit();
                    setLocalEditNameValue(collection?.name || '');
                  }} 
                  className="h-8 w-8 p-0 text-red-400 hover:bg-white/20"
                  disabled={isLoading}
                  touchOptimized
                >
                  <X size={18} />
                </MobileButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{collection.name}</h1>
                <MobileButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditName} 
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  touchOptimized
                >
                  <Pencil size={16} />
                </MobileButton>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <MobileButton 
              variant={collection.is_favorite ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFavorite}
              className={collection.is_favorite ? 
                "bg-white/20 text-white border-white/30 hover:bg-white/30" : 
                "text-white hover:bg-white/20"
              }
              disabled={isLoading}
              touchOptimized
            >
              <Star 
                size={16} 
                className={`mr-2 ${collection.is_favorite ? "fill-current" : ""}`} 
              />
              {collection.is_favorite ? "Favorited" : "Favorite"}
            </MobileButton>
            
            <MobileButton 
              variant="outline"
              size="sm"
              onClick={handleMobileShare}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={isLoading}
              touchOptimized
            >
              <Share2 size={16} className="mr-2" />
              Share
            </MobileButton>
            
            <MobileButton 
              variant="outline"
              size="sm"
              onClick={() => setEditFormOpen(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={isLoading}
              touchOptimized
            >
              <Edit size={16} className="mr-2" />
              Edit
            </MobileButton>
          </div>
        </div>
        
        {collection.description && (
          <p className="text-white/80 mt-3 max-w-3xl">{collection.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            <Clock size={12} className="mr-1" /> Updated {formatTimeAgo(getCollectionTimestamp(collection))}
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            {collectionPlaques.length} plaques
          </Badge>
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
  );

  // Mobile header
  const renderMobileHeader = () => (
    <div className="md:hidden">
      <MobileHeader
        title={collection.name}
        subtitle={`${collectionPlaques.length} plaques • ${collection.is_favorite ? 'Favorite' : 'Collection'}`}
        onBack={handleMobileBack}
        actions={mobileHeaderActions}
        className="bg-purple-600 text-white border-purple-700"
      />
    </div>
  );

  // Mobile tab navigation
  const renderMobileTabNavigation = () => (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex">
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setMobileViewMode('overview');
          }}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            mobileViewMode === 'overview'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setMobileViewMode('plaques');
          }}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            mobileViewMode === 'plaques'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Plaques ({collectionPlaques.length})
        </button>
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            setMobileViewMode('map');
          }}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            mobileViewMode === 'map'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Map
        </button>
      </div>
    </div>
  );

  // Mobile overview content
  const renderMobileOverview = () => (
    <div className="p-4 space-y-4">
      {/* Collection Stats */}
      <CollectionStats 
        collection={collection}
        plaques={collectionPlaques} 
        userVisits={[]}
        className="mb-4"
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          <MobileButton
            onClick={handleMobileAddPlaques}
            className="w-full justify-start bg-purple-50 text-purple-700 border-purple-200"
            variant="outline"
            touchOptimized
          >
            <Plus size={16} className="mr-3" />
            Add Plaques to Collection
          </MobileButton>
          
          <MobileButton
            onClick={handleCreateRoute}
            className="w-full justify-start bg-green-50 text-green-700 border-green-200"
            variant="outline"
            touchOptimized
            disabled={collectionPlaques.length < 2}
          >
            <RouteIcon size={16} className="mr-3" />
            Create Walking Route
          </MobileButton>
          
          <MobileButton
            onClick={() => setMobileViewMode('plaques')}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Grid size={16} className="mr-3" />
            Browse All Plaques
          </MobileButton>
          
          <MobileButton
            onClick={() => setMobileViewMode('map')}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <MapIcon size={16} className="mr-3" />
            View on Map
          </MobileButton>
        </div>
      </div>

      {/* Collection Info */}
      {collection.description && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-2">About This Collection</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{collection.description}</p>
        </div>
      )}

      {/* Recent Plaques Preview */}
      {collectionPlaques.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Plaques</h3>
            <MobileButton
              size="sm"
              variant="ghost"
              onClick={() => setMobileViewMode('plaques')}
              touchOptimized
            >
              View All
            </MobileButton>
          </div>
          <div className="space-y-3">
            {collectionPlaques.slice(0, 3).map((plaque) => (
              <div
                key={plaque.id}
                onClick={() => handlePlaqueClick(plaque)}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg touch-target"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{plaque.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{plaque.location || plaque.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Mobile plaques content
  const renderMobilePlaques = () => (
    <div className="pb-4">
      <CollectionFilterView
        plaques={collectionPlaques}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddPlaquesClick={handleMobileAddPlaques}
        isLoading={isLoading}
        onFilterChange={setFilteredPlaques}
        showMapView={false}
      >
        {collectionPlaques.length === 0 ? (
<EmptyState
  icon={<MapPin />}
  title="No Plaques in this Collection"
  description="Start building your collection by adding plaques"
/>
        ) : filteredPlaques.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm mx-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Plaques Match Your Filters</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or clear filters</p>
            <MobileButton 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              touchOptimized
            >
              Clear Filters
            </MobileButton>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="px-4">
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
              onPlaqueClick={handlePlaqueClick}
              onAddPlaquesClick={handleMobileAddPlaques}
            />
          </div>
        ) : (
          <div className="px-4">
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
              onPlaqueClick={handlePlaqueClick}
              onAddPlaquesClick={handleMobileAddPlaques}
            />
          </div>
        )}
      </CollectionFilterView>
    </div>
  );

  // Mobile map content
  const renderMobileMap = () => (
    <div className="h-[calc(100vh-140px)]">
      <MapContainer
        plaques={filteredPlaques}
        onPlaqueClick={handlePlaqueClick}
        className="h-full w-full"
      />
    </div>
  );

  // Render content based on mobile view mode
  const renderMobileContent = () => {
    switch (mobileViewMode) {
      case 'overview':
        return renderMobileOverview();
      case 'plaques':
        return renderMobilePlaques();
      case 'map':
        return renderMobileMap();
      default:
        return renderMobileOverview();
    }
  };

  return (
    <PageContainer
      activePage="library"
      simplifiedFooter={true}
      paddingBottom={isKeyboardOpen ? 'none' : 'mobile-nav'}
      className={isKeyboardOpen ? 'keyboard-open' : ''}
      {...swipeGesture}
    >
      {/* Desktop Header */}
      {renderDesktopHeader()}
      
      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Mobile Tab Navigation */}
      {isMobile() && renderMobileTabNavigation()}

      {/* Desktop Content */}
      <div className="hidden md:block container mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={[]}
          className="mb-4 sm:mb-6 -mt-5 relative z-10" 
        />
        
        {/* Collection Filter View */}
        <CollectionFilterView
          plaques={collectionPlaques}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddPlaquesClick={handleMobileAddPlaques}
          isLoading={isLoading}
          onFilterChange={setFilteredPlaques}
          showMapView={true}
        >
          {collectionPlaques.length === 0 ? (
           <EmptyState
  icon={<MapPin />}
  title="No Plaques in this Collection"
  description="Start building your collection by adding plaques"
/>
          ) : filteredPlaques.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Plaques Match Your Filters</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or clear filters</p>
              <MobileButton 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                touchOptimized
              >
                Clear Filters
              </MobileButton>
            </div>
          ) : viewMode === 'map' ? (
            <div className="relative">
              <div className="h-[450px] sm:h-[650px] rounded-lg overflow-hidden shadow-md">
                <MapContainer
                  plaques={filteredPlaques}
                  onPlaqueClick={handlePlaqueClick}
                  className="h-full w-full"
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
              onPlaqueClick={handlePlaqueClick}
              onAddPlaquesClick={handleMobileAddPlaques}
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
              onPlaqueClick={handlePlaqueClick}
              onAddPlaquesClick={handleMobileAddPlaques}
            />
          )}
        </CollectionFilterView>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden">
        {renderMobileContent()}
      </div>
      
      {/* Floating Action Button for mobile */}
      {isMobile() && mobileViewMode !== 'map' && (
        <FloatingActionButton
          onClick={handleMobileAddPlaques}
          icon={<Plus size={20} />}
          variant="default"
        />
      )}
      
      {/* Bottom Action Bar for mobile map view */}
      {isMobile() && mobileViewMode === 'map' && (
        <BottomActionBar background="white">
          <MobileButton
            variant="outline"
            onClick={() => setMobileViewMode('plaques')}
            className="flex-1"
            touchOptimized
          >
            <List size={16} className="mr-2" />
            View List
          </MobileButton>
          <MobileButton
            onClick={handleMobileAddPlaques}
            className="flex-1"
            touchOptimized
          >
            <Plus size={16} className="mr-2" />
            Add Plaques
          </MobileButton>
        </BottomActionBar>
      )}
      
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
                triggerHapticFeedback('medium');
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
              onClick: () => {
                triggerHapticFeedback('medium');
                handleRemovePlaques();
              },
              disabled: isLoading
            }
          ] as ActionBarButton[]}
          onClearSelection={() => setSelectedPlaques([])}
        />
      )}
      
      {/* Enhanced Plaque detail modal with URL state and context */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={handleCloseModal}
          onFavoriteToggle={() => {
            triggerHapticFeedback('light');
            selectedPlaque && handleTogglePlaqueFavorite(selectedPlaque.id);
          }}
          isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
          onMarkVisited={() => {
            triggerHapticFeedback('medium');
            selectedPlaque && handleMarkVisited(selectedPlaque.id);
          }}
          nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
          onSelectNearbyPlaque={handleSelectNearbyPlaque}
          generateShareUrl={(plaqueId) => {
            return generatePlaqueUrl(plaqueId);
          }}
          currentPath={location.pathname}
        />
      )}
      
      {/* Add plaques modal */}
      <AddPlaquesModal
        isOpen={addPlaquesModalOpen}
        onClose={() => setAddPlaquesModalOpen(false)}
        onAddPlaques={handleAddPlaques}
        availablePlaques={availablePlaques}
        isLoading={isLoading}
        existingPlaqueIds={collectionPlaques.map(p => p.id)}
      />
      
      {/* Remove single plaque confirmation */}
      <DeleteCollectionDialog
        isOpen={confirmRemovePlaqueOpen}
        onClose={() => setConfirmRemovePlaqueOpen(false)}
        onDelete={() => {
          triggerHapticFeedback('medium');
          confirmRemovePlaque();
        }}
        isLoading={isLoading}
        collectionNames={[]}
        itemType="plaque"
        plaqueTitle={plaqueToRemove ? collectionPlaques.find(p => p.id === plaqueToRemove)?.title : undefined}
      />

      {/* Delete collection confirmation */}
      <DeleteCollectionDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onDelete={() => {
          triggerHapticFeedback('heavy');
          handleDeleteCollection();
        }}
        isLoading={isLoading}
        collectionNames={[collection.name]}
        itemType="collection"
      />
      
      {/* Edit collection form */}
      <CollectionCreateForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={(data) => {
          triggerHapticFeedback('success');
          handleUpdateCollection(data);
        }}
        isLoading={isLoading}
        initialValues={{
          name: collection.name || '',
          description: collection.description || '',
          icon: collection.icon || '🎭',
          color: collection.color || 'bg-purple-500'
        }}
        submitLabel="Save Changes"
        title="Edit Collection"
      />

      {/* Mobile Share Options Dialog */}
      <MobileDialog
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        title="Share Collection"
        size="sm"
      >
        <div className="p-4 space-y-3">
          <MobileButton
            onClick={handleMobileShare}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Share2 size={16} className="mr-3" />
            Share Link
          </MobileButton>
          
          <MobileButton
            onClick={handleExportCollection}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Download size={16} className="mr-3" />
            Export as CSV
          </MobileButton>
        </div>
      </MobileDialog>

      {/* Route Builder Dialog */}
      <MobileDialog
        isOpen={showRouteBuilder}
        onClose={() => setShowRouteBuilder(false)}
        title="Create Walking Route"
        size="lg"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name
            </label>
            <MobileInput
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Enter route name"
              className="w-full"
            />
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Select Plaques ({routePoints.length} selected)
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {collectionPlaques.map((plaque) => {
                const isInRoute = routePoints.some(p => p.id === plaque.id);
                return (
                  <div
                    key={plaque.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isInRoute ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">{plaque.title}</h5>
                      <p className="text-sm text-gray-500 truncate">{plaque.location}</p>
                    </div>
                    <MobileButton
                      size="sm"
                      variant={isInRoute ? "default" : "outline"}
                      onClick={() => {
                        if (isInRoute) {
                          handleRemoveFromRoute(plaque.id);
                        } else {
                          handleAddToRoute(plaque);
                        }
                      }}
                      touchOptimized
                    >
                      {isInRoute ? 'Remove' : 'Add'}
                    </MobileButton>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <MobileButton
              variant="outline"
              onClick={() => setShowRouteBuilder(false)}
              className="flex-1"
              touchOptimized
            >
              Cancel
            </MobileButton>
            <MobileButton
              onClick={handleSaveRoute}
              disabled={routePoints.length < 2}
              className="flex-1"
              touchOptimized
            >
              Create Route
            </MobileButton>
          </div>
        </div>
      </MobileDialog>

      {/* Mobile Progress Banner */}
      {isMobile() && mobileViewMode === 'plaques' && collectionPlaques.length > 0 && (
        <div className="fixed top-16 left-0 right-0 z-20 bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">
              {collection.name}
            </span>
            <span className="text-blue-600">
              {filteredPlaques.length} of {collectionPlaques.length} plaques
            </span>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CollectionDetailPage;