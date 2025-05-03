import React, { useEffect, useRef, useState } from "react";

// A minimal standalone map implementation for testing
const TestMap = () => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Add Leaflet CSS and JS directly in this component
  useEffect(() => {
    // Add CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    // Add JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    // Initialize map once script is loaded
    script.onload = () => {
      try {
        // Create map instance
        const L = window.L;
        const map = L.map(mapRef.current).setView([51.505, -0.09], 13);
        
        // Add tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        
        // Add a marker
        L.marker([51.5, -0.09]).addTo(map)
          .bindPopup('A test marker')
          .openPopup();
          
        setMapLoaded(true);
        
        // Force map to recognize its container size
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
      } catch (err) {
        console.error("Map initialization error:", err);
        setError(err.message);
      }
    };
    
    script.onerror = () => {
      setError("Failed to load Leaflet script");
    };
    
    document.head.appendChild(script);
    
    // Cleanup
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <h1 className="text-xl font-bold p-4">Test Map</h1>
      
      <div 
        ref={mapRef} 
        style={{ height: "600px", width: "100%", background: "#f0f0f0" }}
      >
        {!mapLoaded && !error && (
          <div className="flex items-center justify-center h-full">
            <p>Loading map...</p>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <p>Map Status: {mapLoaded ? "Loaded ✅" : error ? "Error ❌" : "Loading..."}</p>
        <p className="text-sm text-gray-500 mt-2">
          This is a standalone map test. If this works but your main map doesn't, 
          the issue is likely with how the map component is integrated or with your data.
        </p>
      </div>
    </div>
  );
};

export default TestMap;