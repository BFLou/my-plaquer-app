// src/components/settings/LocationSettings.tsx
import React, { useState } from 'react';
import { MapPin, Ruler } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const LocationSettings: React.FC = () => {
  const [locationAccess, setLocationAccess] = useState(true);

  const [distanceUnit, setDistanceUnit] = useState('miles');

  const handleSave = () => {
    toast.success('Location settings saved');
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
        title="Location Permissions"
        description="Essential location settings for finding plaques"
      >
        <div className="space-y-4">
          {/* Enable Location */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium">Enable Location</h4>
                <p className="text-sm text-gray-500">Find nearby plaques and get directions</p>
              </div>
            </div>
            <Switch 
              checked={locationAccess} 
              onCheckedChange={setLocationAccess}
            />
          </div>

          {/* Distance Unit */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Ruler className="text-orange-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium">Distance Unit</h4>
                <p className="text-sm text-gray-500">Choose your preferred measurement</p>
              </div>
            </div>
            <Select 
              value={distanceUnit} 
              onValueChange={setDistanceUnit}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="miles">Miles</SelectItem>
                <SelectItem value="kilometers">Kilometers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>

      {/* Save Button */}
      <div className="p-6">
        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default LocationSettings;