// src/components/plaques/PlaqueMap.jsx

import React, { useRef, useEffect, useState } from 'react';
import { createPlaqueMarker } from './map/PlaqueMarker';
import { createPlaquePopupContent } from './map/PlaquePopup'; // Make sure this import is present
import { MapControlPanel } from './map/MapControlPanel';
import { MapFilterPanel } from './map/MapFilterPanel';

/**
 * Interactive map component that displays plaques as markers
 */
const PlaqueMap = ({
  plaques,
  onPlaqueClick,
  favorites = [],
  selectedPlaqueId,
  className = ''
}) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCategories, setQuickCategories] = useState([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    // Check if Leaflet is loaded on window
    if (!window.L) {
      console.error('Leaflet not loaded. Make sure the library is included in your page.');
      return;
    }

    const L = window.L;

    // Initialize map with London center
    console.log('Initializing map...');
    const map = L.map(mapRef.current, {
      center: [51.505, -0.09], // London
      zoom: 13,
      zoomControl: false // We'll add custom controls
    });

    // Add tile layer (map background)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create marker cluster group if available
    if (L.markerClusterGroup) {
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true
      });
      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    } else {
      console.warn('MarkerClusterGroup not available. Falling back to individual markers.');
    }

    // Add zoom control to the bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Add map styles for plaques
    const style = document.createElement('style');
    style.innerHTML = `
      .marker-drop-animation {
        animation: markerDrop 0.5s ease-out;
      }
      @keyframes markerDrop {
        0% { transform: translateY(-20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      .compact-popup .leaflet-popup-content-wrapper {
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
    `;
    document.head.appendChild(style);

    console.log('Map initialized successfully');
    setMapInstance(map);

    // Cleanup function
    return () => {
      console.log('Cleaning up map...');
      if (style.parentNode) {
        document.head.removeChild(style);
      }
      map.remove();
      setMapInstance(null);
    };
  }, []);

  // Build quick filter categories (first time only)
  useEffect(() => {
    if (plaques.length > 0 && quickCategories.length === 0) {
      // Get most common colors
      const colorCounts = {};
      plaques.forEach(p => {
        if (p.color) {
          const color = p.color.toLowerCase();
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
      });

      // Get most common professions
      const professionCounts = {};
      plaques.forEach(p => {
        if (p.profession) {
          professionCounts[p.profession] = (professionCounts[p.profession] || 0) + 1;
        }
      });

      // Create categories from top colors and professions
      const topCategories = [
        ...Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([color, count]) => ({
            label: `${color.charAt(0).toUpperCase() + color.slice(1)} (${count})`,
            onClick: () => { /* Will implement later */ }
          })),
        ...Object.entries(professionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([profession, count]) => ({
            label: `${profession} (${count})`,
            onClick: () => { /* Will implement later */ }
          }))
      ];

      setQuickCategories(topCategories);
    }
  }, [plaques, quickCategories.length]);

  // Update markers when plaques, favorites, or selectedPlaqueId change
  useEffect(() => {
    if (!mapInstance) return;
    console.log(`Updating markers for ${plaques.length} plaques...`);

    const L = window.L;
    if (!L) return;

    // Clear existing markers
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
    } else {
      // Remove individual markers
      markersRef.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markersRef.current = [];
    }

    // Create markers for each plaque
    const newMarkers = plaques.map(plaque => 
      createPlaqueMarker(plaque, {
        L,
        onMarkerClick: onPlaqueClick,
        onViewDetails: onPlaqueClick,
        favorites,
        selectedMarkerId: selectedPlaqueId,
        createPopupContent: createPlaquePopupContent // Pass the imported function
      })
    ).filter(Boolean); // Filter out null markers

    // Add markers to map
    if (clusterGroupRef.current) {
      clusterGroupRef.current.addLayers(newMarkers);
    } else {
      newMarkers.forEach(marker => marker.addTo(mapInstance));
      markersRef.current = newMarkers;
    }

    // If there are plaques but no markers were created, log an error
    if (plaques.length > 0 && newMarkers.length === 0) {
      console.error('No valid markers could be created. Check plaque coordinates.');
    } else {
      console.log(`Created ${newMarkers.length} markers out of ${plaques.length} plaques`);
    }

    // Fit bounds to show all markers if we have any
    if (newMarkers.length > 0) {
      try {
        const group = L.featureGroup(newMarkers);
        mapInstance.fitBounds(group.getBounds(), {
          padding: [50, 50],
          maxZoom: 16
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
    
    // If we have a selected plaque, center on it
    if (selectedPlaqueId) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque && selectedPlaque.latitude && selectedPlaque.longitude) {
        const lat = parseFloat(selectedPlaque.latitude);
        const lng = parseFloat(selectedPlaque.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstance.setView([lat, lng], 16);
        }
      }
    }

  }, [mapInstance, plaques, favorites, selectedPlaqueId, onPlaqueClick]);

  // Handle map actions
  const handleCenterMap = () => {
    if (!mapInstance) return;
    
    // If we have markers, fit bounds
    if (markersRef.current.length > 0 || (clusterGroupRef.current && clusterGroupRef.current.getLayers().length > 0)) {
      const L = window.L;
      const layers = clusterGroupRef.current ? clusterGroupRef.current.getLayers() : markersRef.current;
      const group = L.featureGroup(layers);
      mapInstance.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
      });
    } else {
      // Default center on London
      mapInstance.setView([51.505, -0.09], 13);
    }
  };

  const handleToggleFilters = () => {
    setFiltersVisible(prev => !prev);
  };

  const handleFindMyLocation = () => {
    if (!mapInstance) return;
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // This would typically filter the plaques based on the search query
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full"></div>
      
      {/* Map Controls */}
      <MapControlPanel
        onCenterMap={handleCenterMap}
        onToggleFilters={handleToggleFilters}
        onFindMyLocation={handleFindMyLocation}
        filtersVisible={filtersVisible}
      />
      
      {/* Filter Panel */}
      <MapFilterPanel
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onSearch={handleSearch}
        categories={quickCategories}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 z-10 bg-white bg-opacity-75 text-xs p-1 rounded">
          {plaques.length} plaques / {markersRef.current.length || (clusterGroupRef.current ? clusterGroupRef.current.getLayers().length : 0)} markers
        </div>
      )}
    </div>
  );
};

export default PlaqueMap;