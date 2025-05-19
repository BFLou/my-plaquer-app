// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, BellRing, MapPin, Shield } from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import ProfileForm from '@/components/profile/ProfileForm';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('profile');
  
  if (!user) {
    return (
      <PageContainer activePage="profile">
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-6">You need to sign in to view your settings.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer activePage="profile">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button 
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            Back to Profile
          </Button>
        </div>
        
        <Tabs 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="space-y-6"
        >
          <TabsList className="bg-white border shadow-sm p-1 w-full md:w-auto">
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
    </PageContainer>
  );
};

export default SettingsPage;