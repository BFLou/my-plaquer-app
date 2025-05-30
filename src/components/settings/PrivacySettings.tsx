// src/components/settings/PrivacySettings.tsx
import React, { useState } from 'react';
import { Shield, Lock, Info, Users } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const PrivacySettings: React.FC = () => {
  const [dataCollection, setDataCollection] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  const handleSave = () => {
    toast.success('Privacy settings saved');
  };

  const privacyOptions = [
    {
      id: 'data',
      icon: Shield,
      title: 'Data Collection',
      description: 'Allow collection of usage data to improve the app experience',
      value: dataCollection,
      onChange: setDataCollection,
      color: 'blue'
    },
    {
      id: 'analytics',
      icon: Info,
      title: 'Anonymous Analytics',
      description: 'Help us improve Plaquer by sharing anonymous usage statistics',
      value: analytics,
      onChange: setAnalytics,
      color: 'green'
    }
  ];

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Privacy Settings</h2>
        <p className="text-gray-500">
          Your data is private by default. Control what you share to help improve the app.
        </p>
      </div>

      {/* Current Privacy Status */}
      <SettingsCard 
        title="Your Privacy"
        description="All your data is currently private and secure"
      >
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Lock className="text-green-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Fully Private Account</h4>
              <p className="text-sm text-green-700">Your collections, visits, and activity are only visible to you</p>
            </div>
          </div>
          
          <ul className="space-y-2 text-sm text-green-800 ml-13">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Your plaque collections remain private</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Your visit history is not shared</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>No public profile or social features</span>
            </li>
          </ul>
        </div>
      </SettingsCard>

      {/* Data Preferences */}
      <SettingsCard 
        title="Data Preferences"
        description="Optional data sharing to help improve Plaquer"
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

      {/* Future Features */}
      <SettingsCard 
        title="Coming Soon"
        description="Future social and sharing features"
      >
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                Social Features
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Future Release
                </Badge>
              </h4>
              <p className="text-sm text-blue-700">Optional sharing and community features are planned for future updates</p>
            </div>
          </div>
          
          <ul className="space-y-2 text-sm text-blue-800 ml-13">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Share collections publicly (optional)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Follow other users' public collections</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Community features and social discovery</span>
            </li>
          </ul>
        </div>
      </SettingsCard>
    </div>
  );
};

export default PrivacySettings;