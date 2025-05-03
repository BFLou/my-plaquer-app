import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash } from 'lucide-react';
import {
  PageContainer,
  PlaqueDetail,
  CollectionStats,
  ActionBar,
  type Plaque,
  type ViewMode
} from '@/components';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';

// Import our new components
import CollectionHeader from '@/components/collections/detail/CollectionHeader';
import CollectionActions from '@/components/collections/detail/CollectionActions';
import CollectionContent from '@/components/collections/detail/CollectionContent';
import { AddPlaquesSheet, RemovePlaquesSheet } from '@/components/collections/detail/CollectionSheets';

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get user data from enhanced context
  const { 
    collections, 
    favorites, 
    isLoading: isUserDataLoading,
    isVisited, 
    markVisited, 
    toggleFavorite,
    getCollectionPlaques,
    getAvailablePlaques,
    addPlaquesToCollection,
    removePlaquesFromCollection
  } = useUser();
  
  // Convert id to number
  const collectionId = parseInt(id || '1');
  
  // State
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('recently_added');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaques, setSelectedPlaques] = useState<number[]>([]);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [collectionPlaques, setCollectionPlaques] = useState<Plaque[]>([]);
  const [availablePlaques, setAvailablePlaques] = useState<Plaque[]>([]);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  
  // Load collection data
  useEffect(() => {
    const fetchCollection = async () => {
      // Wait for user data to be loaded
      if (isUserDataLoading) return;
      
      try {
        setLoading(true);
        
        // Find collection from user data
        const foundCollection = collections.find(c => c.id === collectionId);
        
        if (foundCollection) {
          setCollection(foundCollection);
          setEditNameValue(foundCollection.name);
          
          // Fetch plaques for this collection
          const plaques = await getCollectionPlaques(collectionId);
          setCollectionPlaques(plaques);
          
          // Fetch available plaques not in this collection
          const available = await getAvailablePlaques(collectionId);
          setAvailablePlaques(available);
        } else {
          // Collection not found
          toast.error("The collection you are looking for does not exist.");
          navigate('/collections');
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
        toast.error("Failed to load collection data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [collectionId, collections, isUserDataLoading, navigate, getCollectionPlaques, getAvailablePlaques]);
  
  // Methods
  const toggleSelectPlaque = (id: number) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleBackToCollections = () => {
    navigate('/collections');
  };
  
  const handleAddPlaques = () => {
    setAddPlaquesOpen(true);
  };
  
  const handleAddPlaquesToCollection = async (plaqueIds: number[]) => {
    try {
      // Add plaques using context method
      await addPlaquesToCollection(collectionId, plaqueIds);
      
      // Update local state
      const added = availablePlaques.filter(p => plaqueIds.includes(p.id));
      setCollectionPlaques(prev => [...prev, ...added]);
      setAvailablePlaques(prev => prev.filter(p => !plaqueIds.includes(p.id)));
      
      // Update collection in local state
      if (collection) {
        const updatedPlaquesArray = [...collection.plaques, ...plaqueIds];
        setCollection({
          ...collection,
          plaques: updatedPlaquesArray
        });
      }
      
      toast.success(`${added.length} plaques added to collection`);
    } catch (error) {
      console.error('Error adding plaques:', error);
      toast.error("Failed to add plaques to collection.");
    }
  };
  
  const handleAddAllPlaques = () => {
    handleAddPlaquesToCollection(availablePlaques.map(p => p.id));
    setAddPlaquesOpen(false);
  };
  
  const handleAddSinglePlaque = (id: number) => {
    handleAddPlaquesToCollection([id]);
    setAddPlaquesOpen(false);
  };
  
  const handleRemovePlaques = () => {
    if (selectedPlaques.length > 0) {
      setRemoveConfirmOpen(true);
    }
  };
  
  const confirmRemovePlaques = async () => {
    try {
      // Remove plaques using context method
      await removePlaquesFromCollection(collectionId, selectedPlaques);
      
      // Update local state
      const removed = collectionPlaques.filter(p => selectedPlaques.includes(p.id));
      setCollectionPlaques(prev => prev.filter(p => !selectedPlaques.includes(p.id)));
      setAvailablePlaques(prev => [...prev, ...removed]);
      
      // Update collection in local state
      if (collection) {
        const updatedPlaquesArray = collection.plaques.filter(
          (id: number) => !selectedPlaques.includes(id)
        );
        
        setCollection({
          ...collection,
          plaques: updatedPlaquesArray
        });
      }
      
      setSelectedPlaques([]);
      setRemoveConfirmOpen(false);
      
      toast.success("The selected plaques have been removed from this collection");
    } catch (error) {
      console.error('Error removing plaques:', error);
      toast.error("Failed to remove plaques from collection.");
    }
  };
  
  const handleMarkVisited = () => {
    // Mark selected plaques as visited
    selectedPlaques.forEach(id => {
      markVisited(id);
    });
    
    // Update local state
    setCollectionPlaques(prev => prev.map(plaque => 
      selectedPlaques.includes(plaque.id) ? { ...plaque, visited: true } : plaque
    ));
    
    setSelectedPlaques([]);
    
    toast.success("The selected plaques have been marked as visited");
  };
  
  const handleMovePlaques = () => {
    // In a real app, this would open a dialog to select which collection to move to
    toast.info("This would open a collection selector in a real app");
  };
  
  const handleEditName = () => {
    setIsEditingName(true);
    setEditNameValue(collection?.name || '');
  };
  
  const saveEdit = () => {
    if (editNameValue.trim() && collection) {
      setCollection({ ...collection, name: editNameValue });
      setIsEditingName(false);
      
      toast.success("The collection name has been updated");
    }
  };
  
  const cancelEdit = () => {
    setIsEditingName(false);
    setEditNameValue(collection?.name || '');
  };
  
  const handlePlaqueClick = (plaque: Plaque) => {
    setSelectedPlaque(plaque);
  };
  
  const handleToggleFavorite = (plaqueId: number) => {
    // Toggle favorite status in the context
    toggleFavorite(plaqueId);
    
    // Update local state
    setCollectionPlaques(prev => 
      prev.map(plaque => 
        plaque.id === plaqueId 
          ? { ...plaque, isFavorite: !favorites.includes(plaqueId) } 
          : plaque
      )
    );
    
    toast.success(favorites.includes(plaqueId) 
      ? "Removed from favorites" 
      : "Added to favorites"
    );
  };
  
  const handlePlaqueVisit = (plaqueId: number) => {
    // Mark plaque as visited in context
    markVisited(plaqueId);
    
    // Update local state
    setCollectionPlaques(prev => prev.map(plaque => 
      plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
    ));
    
    toast.success("This plaque has been marked as visited");
  };
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return collectionPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      ((p.postcode && currentPlaque.postcode && p.postcode === currentPlaque.postcode) || 
       (p.profession && currentPlaque.profession && p.profession === currentPlaque.profession))
    ).slice(0, 3);
  };
  
  // Format updated text
  const getUpdatedText = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // If still loading, show a loading state
  if (loading || isUserDataLoading) {
    return (
      <PageContainer>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collection...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  if (!collection) {
    return null;
  }
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-8">
        {/* Collection Header */}
        <CollectionHeader
          collection={collection}
          isEditingName={isEditingName}
          editNameValue={editNameValue}
          onEditNameChange={(e) => setEditNameValue(e.target.value)}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onEditName={handleEditName}
          onBackToCollections={handleBackToCollections}import { useState, useEffect, useRef } from 'react';

          type MapOptions = {
            center?: [number, number];
            zoom?: number;
            maxZoom?: number;
            minZoom?: number;
          };
          
          export const useMapInitialization = (mapRef: React.RefObject<HTMLDivElement>, options: MapOptions = {}) => {
            const [isScriptLoaded, setIsScriptLoaded] = useState(false);
            const [mapLoaded, setMapLoaded] = useState(false);
            const [mapError, setMapError] = useState<string | null>(null);
            const mapInstanceRef = useRef<any>(null);
            const markersRef = useRef<any[]>([]);
            const clusterGroupRef = useRef<any>(null);
            const heatLayerRef = useRef<any>(null);
            const routeLineRef = useRef<any>(null);
            
            // Load Leaflet scripts
            useEffect(() => {
              if (window.L) {
                setIsScriptLoaded(true);
                return;
              }
          
              // Create and load Leaflet CSS
              const linkLeaflet = document.createElement('link');
              linkLeaflet.rel = 'stylesheet';
              linkLeaflet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
              document.head.appendChild(linkLeaflet);
          
              // Create and load MarkerCluster CSS
              const linkCluster = document.createElement('link');
              linkCluster.rel = 'stylesheet';
              linkCluster.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
              document.head.appendChild(linkCluster);
          
              const linkClusterDefault = document.createElement('link');
              linkClusterDefault.rel = 'stylesheet';
              linkClusterDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
              document.head.appendChild(linkClusterDefault);
          
              // Load Leaflet JS
              const scriptLeaflet = document.createElement('script');
              scriptLeaflet.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
              scriptLeaflet.async = true;
              scriptLeaflet.onload = () => {
                // Load MarkerCluster JS after Leaflet is loaded
                const scriptCluster = document.createElement('script');
                scriptCluster.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
                scriptCluster.async = true;
                
                scriptCluster.onload = () => {
                  console.log("Map plugins loaded successfully");
                  setIsScriptLoaded(true);
                };
                
                scriptCluster.onerror = (err) => {
                  console.error("Error loading MarkerCluster:", err);
                  setMapError("Failed to load map resources");
                  setIsScriptLoaded(true); // Still try to initialize the map without clustering
                };
                
                document.head.appendChild(scriptCluster);
              };
              
              scriptLeaflet.onerror = (err) => {
                console.error("Error loading Leaflet:", err);
                setMapError("Failed to load map resources");
              };
              
              document.head.appendChild(scriptLeaflet);
          
              // Add critical inline styles for the map
              const style = document.createElement('style');
              style.innerHTML = `
                .leaflet-container {
                  width: 100%;
                  height: 100%;
                }
                .custom-marker {
                  background: transparent !important;
                  border: none !important;
                  transition: transform 0.2s ease;
                }
                .custom-marker:hover {
                  transform: scale(1.2);
                  z-index: 1000 !important;
                }
                .selected-marker {
                  transform: scale(1.2);
                  z-index: 1000 !important;
                  animation: markerPulse 1.5s infinite;
                }
                @keyframes markerPulse {
                  0% {
                    transform: scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: scale(1.1);
                    opacity: 0.8;
                  }
                  100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                }
                /* Additional map styles... */
              `;
              document.head.appendChild(style);
          
              return () => {
                // Cleanup if component unmounts
                document.head.removeChild(linkLeaflet);
                document.head.removeChild(linkCluster);
                document.head.removeChild(linkClusterDefault);
                document.head.removeChild(scriptLeaflet);
                if (document.querySelector('script[src*="leaflet.markercluster.js"]')) {
                  document.head.removeChild(document.querySelector('script[src*="leaflet.markercluster.js"]')!);
                }
                document.head.removeChild(style);
              };
            }, []);
          
            // Initialize map once scripts are loaded
            useEffect(() => {
              if (!isScriptLoaded || !mapRef.current || mapInstanceRef.current) return;
          
              try {
                console.log("Initializing map");
                const defaultOptions = {
                  center: [51.505, -0.09], // London coordinates
                  zoom: 13,
                  maxZoom: 18,
                  minZoom: 8,
                };
                
                const mapOptions = { ...defaultOptions, ...options };
                
                // Initialize the map
                const map = window.L.map(mapRef.current, mapOptions);
          
                // Add tile layer (map background) - using more attractive tiles
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                  subdomains: 'abcd',
                  maxZoom: 19
                }).addTo(map);
          
                // Create marker cluster group if available
                if (window.L.markerClusterGroup) {
                  const clusterGroup = window.L.markerClusterGroup({
                    showCoverageOnHover: false,
                    maxClusterRadius: 50,
                    zoomToBoundsOnClick: true,
                    spiderfyOnMaxZoom: true,
                    disableClusteringAtZoom: 18,
                    animate: true,
                    spiderfyDistanceMultiplier: 1.5,
                    iconCreateFunction: function(cluster: any) {
                      return window.L.divIcon({
                        html: `<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`,
                        className: 'custom-cluster',
                        iconSize: window.L.point(40, 40)
                      });
                    }
                  });
                  
                  // Modify how cluster clicks are handled
                  clusterGroup.on('clusterclick', function(e) {
                    // Get zoom level
                    const currentZoom = map.getZoom();
                    const maxZoom = map.getMaxZoom();
                    
                    // If at max zoom, spiderfy instead of zooming out
                    if (currentZoom >= maxZoom) {
                      e.layer.spiderfy();
                      // Prevent default zoom-out behavior
                      return false;
                    }
                  });
          
                  map.addLayer(clusterGroup);
                  clusterGroupRef.current = clusterGroup;
                }
          
                // Add scale control
                window.L.control.scale({
                  imperial: false,
                  position: 'bottomright'
                }).addTo(map);
                
                // Store map instance
                mapInstanceRef.current = map;
                setMapLoaded(true);
                
              } catch (error: any) {
                console.error("Map initialization error:", error);
                setMapError(`Failed to initialize map: ${error.message}`);
              }
            }, [isScriptLoaded, options]);
          
            return {
              mapLoaded,
              mapError,
              mapInstance: mapInstanceRef.current,
              markers: markersRef.current,
              clusterGroup: clusterGroupRef.current,
              heatLayer: heatLayerRef.current,
              routeLine: routeLineRef.current,
              isScriptLoaded
            };
          };
          
          export default useMapInitialization;