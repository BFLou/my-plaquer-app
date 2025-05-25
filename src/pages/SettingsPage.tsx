// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import SettingsHeader from '@/components/settings/SettingsHeader';
import SettingsTabs from '@/components/settings/SettingsTabs';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import LocationSettings from '@/components/settings/LocationSettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('profile');

  if (!user) {
    return (
      <PageContainer activePage="profile" simplifiedFooter={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-xl shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view your settings.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="profile" simplifiedFooter={true}>
      <SettingsHeader user={user} onBack={() => navigate('/profile')} />
      
      <div className="container mx-auto max-w-5xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="text-sm text-gray-600">
            Manage your account settings and preferences
          </div>
        </div>

        <SettingsTabs currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Tab Content */}
        <div className="bg-white shadow-sm rounded-xl">
          {currentTab === 'profile' && <ProfileSettings />}
          {currentTab === 'security' && <SecuritySettings />}
          {currentTab === 'notifications' && <NotificationSettings />}
          {currentTab === 'privacy' && <PrivacySettings />}
          {currentTab === 'location' && <LocationSettings />}
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;