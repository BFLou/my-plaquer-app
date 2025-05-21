// src/components/settings/LocationSettings.tsx
import React, { useState } from 'react';
import { MapPin, Navigation, Map, Trash } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const LocationSettings: React.FC = () => {
  const [locationAccess, setLocationAccess] = useState(true);
  const [locationPrecision, setLocationPrecision] = useState('precise');
  const [saveLocationHistory, setSaveLocationHistory] = useState(true);
  const [defaultMapView, setDefaultMapView] = useState('street');

  const handleSave = () => {
    toast.success('Location settings saved');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your location history?')) {
      toast.success('Location history cleared');
    }
  };

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Location Settings</h2>
        <p className="text-gray-500">
          Control how the app uses your location data.
        </p>
      </div>

      <SettingsCard 
        title="Location Access"
        description="Manage location permissions and accuracy"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="text-blue-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Enable Location</h4>
                  <p className="text-sm text-gray-500">Allow Plaquer to access your location</p>
                </div>
              </div>
              <Switch 
                checked={locationAccess} 
                onCheckedChange={setLocationAccess}
              />
            </div>
            
            {locationAccess && (
              <div className="mt-3 pl-13">
                <Label htmlFor="locationPrecision" className="text-sm font-medium mb-2 block">
                  Location Precision
                </Label>
                <Select 
                  value={locationPrecision} 
                  onValueChange={setLocationPrecision}
                  disabled={!locationAccess}
                >
                  <SelectTrigger id="locationPrecision">
                    <SelectValue placeholder="Select precision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precise">
                      <div>
                        <div className="font-medium">Precise</div>
                        <div className="text-xs text-gray-500">Exact location for best results</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="approximate">
                      <div>
                        <div className="font-medium">Approximate</div>
                        <div className="text-xs text-gray-500">General area only</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Navigation className="text-green-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Save Location History</h4>
                  <p className="text-sm text-gray-500">Track your visited locations</p>
                </div>
              </div>
              <Switch 
                checked={saveLocationHistory} 
                onCheckedChange={setSaveLocationHistory}
                disabled={!locationAccess}
              />
            </div>
          </div>
        </div>
        // src/components/settings/LocationSettings.tsx (continued)
      </SettingsCard>

      <SettingsCard 
        title="Map Preferences"
        description="Customize your map viewing experience"
        footer={
          <div className="space-y-3">
            {saveLocationHistory && (
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleClearHistory}
                disabled={!locationAccess || !saveLocationHistory}
              >
                <Trash size={16} className="mr-2" />
                Clear Location History
              </Button>
            )}
            <Button onClick={handleSave} className="w-full">
              Save Location Settings
            </Button>
          </div>
        }
      >
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Map className="text-purple-600" size={20} />
            </div>
            <Label htmlFor="defaultMapView" className="font-medium">Default Map View</Label>
          </div>
          <Select 
            value={defaultMapView} 
            onValueChange={setDefaultMapView}
          >
            <SelectTrigger id="defaultMapView">
              <SelectValue placeholder="Select map view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="street">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">Default</Badge>
                  <span>Street Map</span>
                </div>
              </SelectItem>
              <SelectItem value="satellite">
                <div className="flex items-center gap-2">
                  <span>Satellite View</span>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div className="flex items-center gap-2">
                  <span>Hybrid View</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional location-based features */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <MapPin size={16} />
            Location-Based Features
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
              <span>Get notifications when near unvisited plaques</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
              <span>See your current location on the map</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
              <span>Calculate walking routes to plaques</span>
            </li>
          </ul>
        </div>
      </SettingsCard>
    </div>
  );
};

export default LocationSettings;