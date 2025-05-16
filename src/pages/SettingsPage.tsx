// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, BellRing, MapPin, Shield } from 'lucide-react';
import ProfileForm from '@/components/profile/ProfileForm';

interface SettingsPageProps {
  activeTab?: 'profile' | 'security' | 'notifications' | 'privacy' | 'location';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  activeTab = 'profile' 
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs 
        value={currentTab} 
        onValueChange={(value) => setCurrentTab(value as any)}
        className="space-y-6"
      >
        <TabsList className="bg-white border shadow-sm p-1 w-full flex justify-start overflow-x-auto">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <User size={16} />
            <span>Profile</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Lock size={16} />
            <span>Security</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <BellRing size={16} />
            <span>Notifications</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="privacy" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Shield size={16} />
            <span>Privacy</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="location" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <MapPin size={16} />
            <span>Location</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="bg-white shadow-sm rounded-xl p-6">
          <TabsContent value="profile" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
            <ProfileForm />
          </TabsContent>
          
          <TabsContent value="security" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Security Settings</h2>
            <p className="text-gray-500">
              Manage your account security settings, password, and two-factor authentication.
            </p>
            {/* Security settings form would go here */}
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
            <p className="text-gray-500">
              Control which notifications you receive from the app.
            </p>
            {/* Notification settings form would go here */}
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
            <p className="text-gray-500">
              Manage how your profile and activity is visible to others.
            </p>
            {/* Privacy settings form would go here */}
          </TabsContent>
          
          <TabsContent value="location" className="mt-0">
            <h2 className="text-xl font-bold mb-4">Location Settings</h2>
            <p className="text-gray-500">
              Control how the app uses your location data.
            </p>
            {/* Location settings form would go here */}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;