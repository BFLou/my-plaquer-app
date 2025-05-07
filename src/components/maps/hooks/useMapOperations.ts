// src/hooks/useMapOperations.ts
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for map operations like finding user location and resetting the map
 */
export const useMapOperations = ({
  mapInstance,
  setIsLoadingLocation,
  setUserLocation
}) => {
  // Find user location on the map
  const findUserLocation = useCallback(() => {
    if (!window.L || !mapInstance) {
      toast.error("Map not ready. Please try again.");
      return;
    }
    
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Add user location marker
          const L = window.L;
          
          // Create pulse effect style
          const pulseStyle = document.createElement('style');
          pulseStyle.innerHTML = `
            .user-location-pulse {
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0% {
                transform: scale(0.8);
                opacity: 0.7;
              }
              70% {
                transform: scale(1.5);
                opacity: 0;
              }
              100% {
                transform: scale(0.8);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(pulseStyle);
          
          // Create fancy user location marker with pulse effect
          const newUserMarker = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="position: relative; width: 100%; height: 100%;">
                <div class="user-location-pulse" style="position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3);"></div>
                <div style="position: absolute; top: -8px; left: -8px; width: 16px; height: 16px; border-radius: 50%; background-color: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);"></div>
              </div>
            `,
            iconSize: [0, 0],
          });
          
          const userMarker = L.marker([latitude, longitude], {
            icon: newUserMarker,
            zIndexOffset: 1000,
          }).addTo(mapInstance);
          
          // Add accuracy circle with better styling
          const newAccuracyCircle = L.circle([latitude, longitude], {
            radius: position.coords.accuracy,
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            color: '#3b82f6',
            weight: 1,
            opacity: 0.5
          }).addTo(mapInstance);
          
          // Pan to location with smooth animation
          mapInstance.flyTo([latitude, longitude], 15, {
            animate: true,
            duration: 1
          });
          
          // Update user location state
          setUserLocation([latitude, longitude]);
          
          setIsLoadingLocation(false);
          toast.success("Location found!");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          
          // Show appropriate error message based on error code
          if (error.code === 1) {
            toast.error("Location access denied. Please check your browser permissions.");
          } else if (error.code === 2) {
            toast.error("Your position is unavailable. Try again later.");
          } else if (error.code === 3) {
            toast.error("Location request timed out. Please try again.");
          } else {
            toast.error("Could not access your location. Please check your settings.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  }, [mapInstance, setIsLoadingLocation, setUserLocation]);
  
  // Reset map view
  const resetMap = useCallback(() => {
    if (mapInstance) {
      mapInstance.setView([51.505, -0.09], 13, {
        animate: true,
        duration: 1
      });
      toast.info("Map view reset");
    }
  }, [mapInstance]);
  
  // Change map style/theme
  const changeMapTheme = useCallback((theme: string) => {
    if (!mapInstance) return;
    
    // Remove current tile layer
    mapInstance.eachLayer((layer) => {
      if (layer instanceof window.L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });
    
    // Add new tile layer based on theme
    switch (theme) {
      case 'streets':
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(mapInstance);
        break;
      case 'satellite':
        window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19
        }).addTo(mapInstance);
        break;
      case 'terrain':
        window.L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abcd',
          maxZoom: 18
        }).addTo(mapInstance);
        break;
      case 'walking':
        // Special layer optimized for walking routes with path emphasis
        window.L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
          attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 22
        }).addTo(mapInstance);
        break;
      default:
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(mapInstance);
    }
    
    toast.success(`Map style changed to ${theme}`);
  }, [mapInstance]);
  
  // Fit to bounds based on plaque markers
  const fitToMarkers = useCallback((plaquesToFit) => {
    if (!mapInstance || !window.L) return;
    
    const validPlaques = plaquesToFit.filter(p => p.latitude && p.longitude);
    
    if (validPlaques.length > 0) {
      try {
        const latLngs = validPlaques.map(p => [
          parseFloat(p.latitude as unknown as string), 
          parseFloat(p.longitude as unknown as string)
        ]);
        
        const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
        
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { 
            padding: [50, 50],
            animate: true,
            duration: 0.75
          });
        }
      } catch (e) {
        console.warn("Non-critical error fitting to markers:", e);
        // Fallback to fixed view
        mapInstance.setView([51.505, -0.09], 13);
      }
    }
  }, [mapInstance]);
  
  // Set map zoom level with animation
  const setMapZoom = useCallback((zoom) => {
    if (mapInstance) {
      mapInstance.setZoom(zoom, {
        animate: true
      });
    }
  }, [mapInstance]);
  
  // Pan to specific coordinates
  const panToLocation = useCallback((lat, lng, zoom = 15) => {
    if (mapInstance) {
      mapInstance.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1
      });
    }
  }, [mapInstance]);
  
  return {
    findUserLocation,
    resetMap,
    fitToMarkers,
    changeMapTheme,
    setMapZoom,
    panToLocation
  };
};

export default useMapOperations;