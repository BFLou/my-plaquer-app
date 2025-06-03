import React, { useState } from 'react';
import { Mail, Bell, Info, Smartphone, Globe } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const NotificationSettings: React.FC = () => {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotifications(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('Browser notifications enabled');
      } else {
        toast.error('Browser notifications permission denied');
      }
    }
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
      icon: Smartphone,
      title: 'Mobile Push Notifications',
      description: 'Get notifications on your mobile device about updates and new features',
      value: pushUpdates,
      onChange: setPushUpdates,
      color: 'green'
    },
    {
      id: 'browser',
      icon: Globe,
      title: 'Browser Notifications',
      description: 'Show notifications in your browser when the app is open',
      value: browserNotifications,
      onChange: setBrowserNotifications,
      color: 'purple',
      requiresPermission: true
    }
  ];

  return (
    <div>
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg sm:text-xl font-bold mb-1">Notification Settings</h2>
        <p className="text-sm text-gray-500">
          Stay informed about app updates and important changes.
        </p>
      </div>

      <SettingsCard 
        title="App Updates & Announcements"
        description="Choose how you want to receive information about Plaquer updates"
        footer={
          <Button onClick={handleSave} className="w-full h-12">
            Save Notification Settings
          </Button>
        }
      >
        <div className="space-y-3">
          {notificationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 bg-${option.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`text-${option.color}-600`} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base">{option.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">{option.description}</p>
                      {option.requiresPermission && !('Notification' in window) && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Not supported in this browser
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {option.requiresPermission && 'Notification' in window && !option.value && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestBrowserPermission}
                        className="text-xs h-8"
                      >
                        Enable
                      </Button>
                    )}
                    <Switch 
                      checked={option.value} 
                      onCheckedChange={option.onChange}
                      disabled={option.requiresPermission && !('Notification' in window)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info about what notifications include */}
        <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Info size={16} />
            What you'll receive
          </h4>
          <ul className="space-y-1 text-xs sm:text-sm text-blue-800">
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