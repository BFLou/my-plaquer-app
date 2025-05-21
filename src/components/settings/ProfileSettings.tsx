// src/components/settings/ProfileSettings.tsx
import React from 'react';
import ProfileForm from '@/components/profile/ProfileForm';
import SettingsCard from './SettingsCard';

const ProfileSettings: React.FC = () => {
  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Profile Settings</h2>
        <p className="text-gray-500">
          Update your personal information and how you appear to others on Plaquer.
        </p>
      </div>
      
      <SettingsCard 
        title="Personal Information"
        description="Update your profile details"
      >
        <ProfileForm />
      </SettingsCard>
    </div>
  );
};

export default ProfileSettings;