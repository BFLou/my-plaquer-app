import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// A simple component to debug plaque data and map loading issues
const PlaqueDataDebugger = ({ plaques = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leafletStatus, setLeafletStatus] = useState("Checking...");
  
  // Check if Leaflet is loaded
  React.useEffect(() => {
    if (window.L) {
      setLeafletStatus("Loaded ✅");
    } else {
      setLeafletStatus("Not loaded ❌");
      
      // Check if Leaflet scripts are in the document
      const leafletScript = document.querySelector('script[src*="leaflet.js"]');
      const clusterScript = document.querySelector('script[src*="leaflet.markercluster.js"]');
      
      if (leafletScript) {
        setLeafletStatus(prev => prev + " (Script tag exists but not initialized)");
      }
      
      // Set up a listener to detect when Leaflet loads
      const checkInterval = setInterval(() => {
        if (window.L) {
          setLeafletStatus("Loaded ✅ (Detected after delay)");
          clearInterval(checkInterval);
        }
      }, 1000);
      
      // Clean up
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Count how many plaques have valid coordinates
  const validCoordinates = plaques.filter(plaque => 
    plaque.latitude && plaque.longitude && 
    !isNaN(parseFloat(plaque.latitude)) && !isNaN(parseFloat(plaque.longitude))
  ).length;
  
  // Get map container status
  const mapContainerExists = document.getElementById('plaque-map');
  
  // Get first few plaques for inspection
  const samplePlaques = plaques.slice(0, 3);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        variant="secondary"
        className="shadow-lg bg-blue-500 text-white hover:bg-blue-600"
      >
        {isOpen ? "Hide Debug Info" : "Debug Map"}
      </Button>
      
      {isOpen && (
        <Card className="p-4 mt-2 w-80 max-h-96 overflow-auto shadow-lg">
          <h3 className="font-bold text-lg mb-2">Map Debug Info</h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Leaflet Status:</span> {leafletStatus}
            </div>
            
            <div>
              <span className="font-medium">Map Container:</span> {mapContainerExists ? "Found ✅" : "Not found ❌"}
            </div>
            
            <div>
              <span className="font-medium">Total Plaques:</span> {plaques.length}
            </div>
            
            <div>
              <span className="font-medium">Plaques with Valid Coordinates:</span> {validCoordinates} ({((validCoordinates / plaques.length) * 100).toFixed(1)}%)
            </div>
            
            <div>
              <span className="font-medium">Sample Data:</span>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(samplePlaques, null, 2)}
              </pre>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <h4 className="font-medium mb-1">Check for Map Errors</h4>
              <div className="text-xs text-gray-600">
                <p>Check browser console for errors like:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Failed to load resources (Leaflet CSS/JS)</li>
                  <li>Map container not found</li>
                  <li>Invalid coordinates in data</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <Button 
                onClick={() => {
                  // Force reload libraries
                  const script = document.createElement('script');
                  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                  document.head.appendChild(script);
                  
                  setLeafletStatus("Reloading...");
                }} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Reload Leaflet
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlaqueDataDebugger;