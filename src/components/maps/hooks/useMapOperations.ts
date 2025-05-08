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
          
          // Clear any existing user location markers
          mapInstance.eachLayer(layer => {
            if (layer.options && layer.options.className === 'user-location-marker') {
              mapInstance.removeLayer(layer);
            }
          });
          
          // Create pulse effect style
          if (!document.getElementById('user-location-pulse-style')) {
            const pulseStyle = document.createElement('style');
            pulseStyle.id = 'user-location-pulse-style';
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
          }
          
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
  const changeMapTheme = useCallback((theme) => {
    if (!mapInstance || !window.L) return;
    
    // Remove current tile layer
    mapInstance.eachLayer((layer) => {
      if (layer instanceof window.L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });
    
    // Add new tile layer based on theme
    switch (theme) {
      case 'streets':
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
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
        window.L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
          maxZoom: 19
        }).addTo(mapInstance);
        break;
      default:
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(mapInstance);
    }
  }, [mapInstance]);
  
  // Fit to bounds based on plaque markers
  const fitToMarkers = useCallback((plaquesToFit) => {
    if (!mapInstance || !window.L) return;
    
    const validPlaques = plaquesToFit.filter(p => p.latitude && p.longitude);
    
    if (validPlaques.length > 0) {
      try {
        const latLngs = validPlaques.map(p => {
          const lat = typeof p.latitude === 'string' ? 
            parseFloat(p.latitude) : p.latitude;
          const lng = typeof p.longitude === 'string' ? 
            parseFloat(p.longitude) : p.longitude;
          return window.L.latLng(lat, lng);
        });
        
        const bounds = window.L.latLngBounds(latLngs);
        
        if (bounds.isValid()) {
          mapInstance.flyToBounds(bounds, { 
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