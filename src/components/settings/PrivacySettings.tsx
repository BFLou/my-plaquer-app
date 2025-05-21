// src/components/settings/PrivacySettings.tsx
import React, { useState } from 'react';
import { Eye, Users, MapPin, Activity, Folder } from 'lucide-react';
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
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const PrivacySettings: React.FC = () => {
  const [profileVisibility, setProfileVisibility] = useState('friends');
  const [showVisitedPlaques, setShowVisitedPlaques] = useState(true);
  const [shareCollections, setShareCollections] = useState(true);
  const [activityFeed, setActivityFeed] = useState(true);

  const handleSave = () => {
    toast.success('Privacy settings saved');
  };

  const privacyOptions = [
    {
      id: 'visited',
      icon: MapPin,
      title: 'Show Visited Plaques',
      description: 'Others can see which plaques you\'ve visited',
      value: showVisitedPlaques,
      onChange: setShowVisitedPlaques,
      color: 'blue'
    },
    {
      id: 'collections',
      icon: Folder,
      title: 'Share Collections',
      description: 'Others can see and follow your collections',
      value: shareCollections,
      onChange: setShareCollections,
      color: 'green'
    },
    {
      id: 'activity',
      icon: Activity,
      title: 'Activity Feed',
      description: 'Show your activity in others\' feeds',
      value: activityFeed,
      onChange: setActivityFeed,
      color: 'purple'
    }
  ];

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Privacy Settings</h2>
        <p className="text-gray-500">
          Manage how your profile and activity are visible to others.
        </p>
      </div>

      <SettingsCard 
        title="Profile Visibility"
        description="Control who can see your profile"
      >
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <Label htmlFor="profileVisibility" className="font-medium">Who can see your profile</Label>
          </div>
          <Select 
            value={profileVisibility} 
            onValueChange={setProfileVisibility}
          >
            <SelectTrigger id="profileVisibility">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-gray-500">Anyone can see your profile</div>
                </div>
              </SelectItem>
              <SelectItem value="friends">
                <div>
                  <div className="font-medium">Friends Only</div>
                  <div className="text-xs text-gray-500">Only people you follow</div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-gray-500">Only visible to you</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>

      <SettingsCard 
        title="Activity Privacy"
        description="Control what others can see about your activity"
        footer={
          <Button onClick={handleSave} className="w-full">
            Save Privacy Settings
          </Button>
        }
      >
        <div className="space-y-3">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${option.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`text-${option.color}-600`} size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={option.value} 
                    onCheckedChange={option.onChange}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
};

export default PrivacySettings;