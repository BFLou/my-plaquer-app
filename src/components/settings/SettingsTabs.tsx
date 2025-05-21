// src/components/settings/SettingsTabs.tsx
import React from 'react';
import { User, Lock, BellRing, Shield, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { value: 'profile', icon: User, label: 'Profile' },
  { value: 'security', icon: Lock, label: 'Security' },
  { value: 'notifications', icon: BellRing, label: 'Notifications' },
  { value: 'privacy', icon: Shield, label: 'Privacy' },
  { value: 'location', icon: MapPin, label: 'Location' },
];

const SettingsTabs: React.FC<SettingsTabsProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="flex overflow-x-auto scrollbar-hide border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.value;
          
          return (
            <button
              key={tab.value}
              className={cn(
                "px-4 py-3 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2",
                isActive 
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              )}
              onClick={() => onTabChange(tab.value)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsTabs;