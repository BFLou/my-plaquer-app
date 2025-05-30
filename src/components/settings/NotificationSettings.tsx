// src/components/settings/NotificationSettings.tsx
import React, { useState } from 'react';
import { Mail, Bell, Info } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const NotificationSettings: React.FC = () => {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  const notificationOptions = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email Updates',
      description: 'Receive app updates and important announcements via email',
      value: emailUpdates,
      onChange: setEmailUpdates,
      color: 'blue'
    },
    {
      id: 'push',
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get notified about app updates and new features on your device',
      value: pushUpdates,
      onChange: setPushUpdates,
      color: 'green'
    }
  ];

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Notification Settings</h2>
        <p className="text-gray-500">
          Stay informed about app updates and important changes.
        </p>
      </div>

      <SettingsCard 
        title="App Updates & Announcements"
        description="Choose how you want to receive information about Plaquer updates"
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

        {/* Info about what notifications include */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Info size={16} />
            What you'll receive
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>New app features and improvements</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Important security updates</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Service announcements and maintenance notices</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Changes to terms of service or privacy policy</span>
            </li>
          </ul>
        </div>
      </SettingsCard>
    </div>
  );
};

export default NotificationSettings;