// src/components/collections/CollectionMapView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Filter, MapPin, Eye, EyeOff, 
  Maximize2, Minimize2, Layers, List, Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const CollectionMapView = ({ 
  collection,
  plaques = [],
  userVisits = [],
  onMarkVisited = () => {},
  className = ''
}) => {
  // Map-related state
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clusterGroupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
  const [mapZoom, setMapZoom] = useState(12);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [filterVisited, setFilterVisited] = useState(false);
  const [filterColor, setFilterColor] = useState('all');
  const [filterProfession, setFilterProfession] = useState('all');
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  
  // Computed data
  const uniqueColors = [...new Set(plaques.map(p => p.color || 'unknown').filter(Boolean))];
  const uniqueProfessions = [...new Set(plaques.map(p => p.profession).filter(Boolean))];
  const visitedPlaqueIds = new Set(userVisits.map(visit => visit.plaque_id));
  
  // Filtered plaques based on current filters
  const filteredPlaques = plaques.filter(plaque => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by visited status
    const matchesVisited = !filterVisited || visitedPlaqueIds.has(plaque.id);
    
    // Filter by color
    const matchesColor = filterColor === 'all' || plaque.color === filterColor;
    
    // Filter by profession
    const matchesProfession = filterProfession === 'all' || plaque.profession === filterProfession;
    
    return matchesSearch && matchesVisited && matchesColor && matchesProfession;
  });
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapLoaded) return;
    
    // Load Leaflet CSS
    const linkLeaflet = document.createElement('link');
    linkLeaflet.rel = 'stylesheet';
    linkLeaflet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkLeaflet);
    
    // Load MarkerCluster CSS
    const linkCluster = document.createElement('link');
    linkCluster.rel = 'stylesheet';
    linkCluster.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(linkCluster);
    
    const linkClusterDefault = document.createElement('link');
    linkClusterDefault.rel = 'stylesheet';
    linkClusterDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(linkClusterDefault);
    
    // Load Leaflet and MarkerCluster scripts
    const loadScripts = async () => {
      // Load Leaflet
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Load MarkerCluster
      if (!window.L.markerClusterGroup) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Initialize map
      initializeMap();
    };
    
    loadScripts();
  }, [mapContainerRef.current]);
  
  // Initialize map function
  const initializeMap = () => {
    if (!window.L || !mapContainerRef.current) return;
    
    const L = window.L;
    
    // Create map
    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false
    });
    
    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create marker cluster group
    const clusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 18,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50
    });
    
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    
    // Store map reference
    mapRef.current = map;
    
    // Add markers for all plaques
    addMarkers();
    
    // Set map loaded flag
    setMapLoaded(true);
    
    // Update center and zoom when map moves
    map.on('moveend', () => {
      setMapCenter(map.getCenter());
      setMapZoom(map.getZoom());
    });
  };
  
  // Add markers to map
  const addMarkers = () => {
    if (!mapRef.current || !window.L) return;
    
    const L = window.L;
    const map = mapRef.current;
    
    // Clear existing markers
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
    }
    
    // Clear markers reference
    markersRef.current = {};
    
    // Add markers for filtered plaques
    filteredPlaques.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;
      
      const lat = parseFloat(plaque.latitude);
      const lng = parseFloat(plaque.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Get color for marker
      const plaqueColor = getMarkerColor(plaque.color);
      const isVisited = visitedPlaqueIds.has(plaque.id);
      
      // Create custom marker icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-container ${isVisited ? 'visited' : ''}">
            <div class="marker" style="background-color:${plaqueColor}">
              <div class="marker-inner">
                ${isVisited ? 
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>' : 
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                }
              </div>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
      
      // Create marker
      const marker = L.marker([lat, lng], { icon });
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'plaque-popup-content';
      popupContent.innerHTML = `
        <div class="p-3 max-w-[250px]">
          <h3 class="font-medium text-sm mb-1">${plaque.title}</h3>
          <p class="text-xs text-gray-500 mb-2">${plaque.location || ''}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs">${plaque.color || ''} ${plaque.profession ? `• ${plaque.profession}` : ''}</span>
            <button class="view-button text-xs text-blue-600 hover:underline">View Details</button>
          </div>
        </div>
      `;
      
      // Add click handler for view button
      const viewButton = popupContent.querySelector('.view-button');
      if (viewButton) {
        viewButton.addEventListener('click', () => {
          setSelectedPlaque(plaque);
          marker.closePopup();
        });
      }
      
      // Bind popup to marker
      marker.bindPopup(popupContent);
      
      // Add marker to cluster group
      if (clusteringEnabled) {
        clusterGroupRef.current.addLayer(marker);
      } else {
        marker.addTo(map);
      }
      
      // Store marker reference
      markersRef.current[plaque.id] = marker;
    });
    
    // Fit bounds if markers present
    if (Object.keys(markersRef.current).length > 0) {
      const points = Object.values(markersRef.current).map(marker => marker.getLatLng());
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };
  
  // Update markers when filtered plaques change
  useEffect(() => {
    if (mapLoaded) {
      addMarkers();
    }
  }, [filteredPlaques, clusteringEnabled, visitedPlaqueIds]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Get marker color based on plaque color
  const getMarkerColor = (color) => {
    switch (color) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'brown': return '#b45309';
      case 'black': return '#1f2937';
      case 'grey': 
      case 'gray': return '#6b7280';
      default: return '#3b82f6'; // Default to blue
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterVisited(false);
    setFilterColor('all');
    setFilterProfession('all');
  };
  
  // Add custom styles for map markers
  useEffect(() => {
    if (!mapLoaded) return;
    
    // Add styles for markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker {
        background: transparent;
        border: none;
      }
      
      .marker-container {
        width: 30px;
        height: 30px;
        position: relative;
      }
      
      .marker {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 0 50%;
        transform: rotate(45deg);
        background: #3b82f6;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .marker-inner {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(-45deg);
        color: #3b82f6;
      }
      
      .marker-container.visited .marker {
        opacity: 0.7;
      }
      
      .marker-container.visited .marker-inner {
        color: #10b981;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [mapLoaded]);
  
  return (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'} overflow-hidden border rounded-lg ${className}`}
    >
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 bg-gray-100"
      ></div>
      
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 z-10">
        <div className="flex gap-2 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search plaques on map..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-white/90 backdrop-blur-sm border-none shadow-md"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </Button>
            )}
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/90 backdrop-blur-sm shadow-md"
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                >
                  <Filter size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter plaques</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/90 backdrop-blur-sm shadow-md"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Filter chips */}
        {(filterVisited || filterColor !== 'all' || filterProfession !== 'all') && (
          <div className="flex flex-wrap gap-1">
            {filterVisited && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 flex items-center gap-1 shadow-sm"
              >
                <Eye size={12} />
                Visited
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setFilterVisited(false)}
                >
                  <X size={10} />
                </Button>
              </Badge>
            )}
            
            {filterColor !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 flex items-center gap-1 shadow-sm"
              >
                {filterColor}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setFilterColor('all')}
                >
                  <X size={10} />
                </Button>
              </Badge>
            )}
            
            {filterProfession !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-purple-100 text-purple-800 flex items-center gap-1 shadow-sm"
              >
                {filterProfession}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setFilterProfession('all')}
                >
                  <X size={10} />
                </Button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 bg-white/80 shadow-sm text-xs"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
      
      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Switch 
                      checked={clusteringEnabled}
                      onCheckedChange={setClusteringEnabled}
                      id="clustering"
                    />
                    <Label htmlFor="clustering" className="ml-2 text-xs">
                      <Layers size={14} className="inline mr-1" />
                      Clustering
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Group nearby plaques</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Map Stats */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600">
          {filteredPlaques.length} of {plaques.length} plaques visible
        </div>
      </div>
      
      {/* Filter Drawer */}
      <Drawer open={isFilterVisible} onOpenChange={setIsFilterVisible}>
        <DrawerContent className="max-h-[70dvh]">
          <DrawerHeader>
            <DrawerTitle>Filter Plaques</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="p-4 space-y-6">
            {/* Visited filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="visited-filter" className="font-medium">Show only visited</Label>
                <Switch 
                  id="visited-filter" 
                  checked={filterVisited}
                  onCheckedChange={setFilterVisited}
                />
              </div>
              <p className="text-xs text-gray-500">
                {visitedPlaqueIds.size} of {plaques.length} plaques visited
              </p>
            </div>
            
            {/* Color filter */}
            <div className="space-y-3">
              <Label className="font-medium">Plaque Color</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={filterColor === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterColor('all')}
                >
                  All Colors
                </Button>
                
                {uniqueColors.map(color => (
                  <Button 
                    key={color}
                    variant={filterColor === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterColor(color)}
                    className="capitalize"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Profession filter */}
            <div className="space-y-3">
              <Label className="font-medium">Profession</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={filterProfession === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterProfession('all')}
                >
                  All Professions
                </Button>
                
                {uniqueProfessions.map(profession => (
                  <Button 
                    key={profession}
                    variant={filterProfession === profession ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterProfession(profession)}
                    className="capitalize"
                  >
                    {profession}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={resetFilters}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Plaque Detail Sheet */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={() => setSelectedPlaque(null)}
          onMarkVisited={onMarkVisited}
          isFavorite={false}
        />
      )}
    </div>
  );
};

export default CollectionMapView;

// Add this to your CSS or as a style tag:
/*
.leaflet-popup-content-wrapper {
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 0;
  width: auto !important;
}

.leaflet-popup-close-button {
  top: 6px !important;
  right: 6px !important;
  color: #6b7280 !important;
}
*/