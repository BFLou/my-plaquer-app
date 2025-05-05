/**
 * Creates and configures a marker cluster group for the map
 * This utility helps optimize map performance when displaying many markers
 */
export const createMarkerClusterGroup = (L: any, options: any = {}) => {
    if (!L || !L.markerClusterGroup) {
      console.warn('MarkerClusterGroup plugin not available');
      return null;
    }
    
    // Default options
    const defaultOptions = {
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 18,
      maxClusterRadius: 50,
      animate: true,
      animateAddingMarkers: true,
      spiderfyDistanceMultiplier: 1.5
    };
    
    // Create cluster group with custom icon function
    const clusterGroup = L.markerClusterGroup({
      ...defaultOptions,
      ...options,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 40;
        
        // Adjust size based on the number of markers
        if (count > 50) size = 60;
        else if (count > 20) size = 50;
        else if (count < 5) size = 36;
        
        // Create a custom HTML icon
        return L.divIcon({
          html: `
            <div class="flex items-center justify-center bg-white rounded-full p-1 shadow-md">
              <div class="bg-blue-500 text-white rounded-full flex items-center justify-center w-full h-full font-semibold">
                ${count}
              </div>
            </div>
          `,
          className: 'custom-cluster-icon',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size/2, size/2)
        });
      }
    });
    
    // Customize cluster click behavior
    clusterGroup.on('clusterclick', function(e: any) {
      // Get current zoom level
      const map = e.layer._map;
      const currentZoom = map.getZoom();
      const maxZoom = map.getMaxZoom();
      
      // If at max zoom, spiderfy instead of zooming
      if (currentZoom >= maxZoom) {
        e.layer.spiderfy();
        return false; // Prevent the default zoom behavior
      }
      
      // For small clusters at high zoom levels, also spiderfy rather than zoom
      if (currentZoom >= maxZoom - 2 && e.layer.getAllChildMarkers().length < 10) {
        e.layer.spiderfy();
        return false;
      }
      
      // Otherwise let the default zoom-in behavior happen
      return true;
    });
    
    return clusterGroup;
  };
  
  // Styling for the spiderfy lines
  export const customizeSpiderfyStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-marker-icon.leaflet-marker-icon-custom {
        transition: transform 0.3s ease;
      }
      
      .marker-cluster-small {
        background-color: rgba(59, 130, 246, 0.6);
      }
      
      .marker-cluster-small div {
        background-color: rgba(59, 130, 246, 0.8);
      }
      
      .marker-cluster-medium {
        background-color: rgba(59, 130, 246, 0.6);
      }
      
      .marker-cluster-medium div {
        background-color: rgba(59, 130, 246, 0.8);
      }
      
      .marker-cluster-large {
        background-color: rgba(59, 130, 246, 0.6);
      }
      
      .marker-cluster-large div {
        background-color: rgba(59, 130, 246, 0.8);
      }
      
      .leaflet-marker-shadow {
        display: none;
      }
      
      /* Spiderfy legs */
      .leaflet-marker-icon-wrapper {
        position: absolute;
        overflow: visible;
        z-index: 10;
      }
      
      .leaflet-marker-icon-wrapper svg {
        overflow: visible;
      }
      
      .leaflet-marker-icon-wrapper svg line {
        stroke: #3b82f6;
        stroke-width: 2;
        stroke-dasharray: 5, 5;
        animation: dash 2s linear infinite;
        opacity: 0.7;
      }
      
      @keyframes dash {
        to {
          stroke-dashoffset: -20;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  };
  
  export default { createMarkerClusterGroup, customizeSpiderfyStyles };