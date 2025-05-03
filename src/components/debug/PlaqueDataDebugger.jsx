// src/components/debug/PlaqueDataDebugger.jsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from 'lucide-react';

/**
 * A component to debug plaque data issues
 * @param {Object} props
 * @param {Array} props.plaques - Array of plaque objects
 */
const PlaqueDataDebugger = ({ plaques }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count plaques with valid coordinates
  const validCoordPlaques = plaques.filter(p => {
    if (!p.latitude || !p.longitude) return false;
    
    const lat = parseFloat(p.latitude);
    const lng = parseFloat(p.longitude);
    
    return !isNaN(lat) && !isNaN(lng);
  });

  // Check if there are any plaques with invalid coordinates
  const invalidCoordPlaques = plaques.filter(p => {
    if (!p.latitude || !p.longitude) return true;
    
    const lat = parseFloat(p.latitude);
    const lng = parseFloat(p.longitude);
    
    return isNaN(lat) || isNaN(lng);
  });

  return (
    <div className="mt-4 border bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center p-2 cursor-pointer" 
           onClick={() => setIsOpen(!isOpen)}>
        <h3 className="text-sm font-medium text-gray-700">Map Debug Info</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
        </Button>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t text-sm">
          <ul className="space-y-2">
            <li><strong>Total plaques:</strong> {plaques.length}</li>
            <li><strong>Plaques with valid coordinates:</strong> {validCoordPlaques.length}</li>
            <li><strong>Plaques with invalid coordinates:</strong> {invalidCoordPlaques.length}</li>
          </ul>
          
          {invalidCoordPlaques.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Plaques with Invalid Coordinates:</h4>
              <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border text-xs">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-1">ID</th>
                      <th className="text-left p-1">Title</th>
                      <th className="text-left p-1">Latitude</th>
                      <th className="text-left p-1">Longitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidCoordPlaques.map(plaque => (
                      <tr key={plaque.id} className="border-t">
                        <td className="p-1">{plaque.id}</td>
                        <td className="p-1">{plaque.title}</td>
                        <td className="p-1">{plaque.latitude || 'missing'}</td>
                        <td className="p-1">{plaque.longitude || 'missing'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {plaques.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">First Plaque Sample Data:</h4>
              <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                {JSON.stringify(plaques[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaqueDataDebugger;