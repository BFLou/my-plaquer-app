// src/components/settings/NotificationSettings.tsx
import React, { useState } from 'react';
import { Mail, Bell, Calendar, FileText, Folder } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const NotificationSettings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [visitReminders, setVisitReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [collectionUpdates, setCollectionUpdates] = useState(true);

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  const notificationOptions = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      value: emailNotifications,
      onChange: setEmailNotifications,
      color: 'blue'
    },
    {
      id: 'push',
      icon: Bell,
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      value: pushNotifications,
      onChange: setPushNotifications,
      color: 'green'
    },
    {
      id: 'reminders',
      icon: Calendar,
      title: 'Visit Reminders',
      description: 'Get notified when near unvisited plaques',
      value: visitReminders,
      onChange: setVisitReminders,
      color: 'amber'
    },
    {
      id: 'digest',
      icon: FileText,
      title: 'Weekly Digest',
      description: 'Summary of new plaques and activity',
      value: weeklyDigest,
      onChange: setWeeklyDigest,
      color: 'purple'
    },
    {
      id: 'collections',
      icon: Folder,
      title: 'Collection Updates',
      description: 'Updates when collections you follow change',
      value: collectionUpdates,
      onChange: setCollectionUpdates,
      color: 'pink'
    }
  ];

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Notification Settings</h2>
        <p className="text-gray-500">
          Control which notifications you receive from Plaquer.
        </p>
      </div>

      <SettingsCard 
        title="Notification Preferences"
        description="Choose how and when you want to be notified"
        footer={
          <Button onClick={handleSave} className="w-full">
            Save Notification Settings
          </Button>
        }
      >
        <div className="space-y-3">
          {notificationOptions.map((option) => {
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

export default NotificationSettings;