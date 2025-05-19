// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Lock, 
  BellRing, 
  MapPin, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ProfileForm from '@/components/profile/ProfileForm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState('profile');
  
  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [visitReminders, setVisitReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [newCollectionUpdates, setNewCollectionUpdates] = useState(true);
  
  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState('friends');
  const [showVisitedPlaques, setShowVisitedPlaques] = useState(true);
  const [shareCollections, setShareCollections] = useState(true);
  const [activityFeed, setActivityFeed] = useState(true);
  
  // Location settings state
  const [locationAccess, setLocationAccess] = useState(true);
  const [locationPrecision, setLocationPrecision] = useState('precise');
  const [saveLocationHistory, setSaveLocationHistory] = useState(true);
  const [defaultMapView, setDefaultMapView] = useState('street');
  
  // Security settings validation
  useEffect(() => {
    // Reset error when inputs change
    if (passwordError) {
      setPasswordError('');
    }
  }, [currentPassword, newPassword, confirmPassword]);
  
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
  
  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    // Password change logic would go here
    // In a real app, you would call Firebase Auth or another auth service
    
    // Simulated success
    toast.success('Password updated successfully');
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  // Handle save notification settings
  const handleSaveNotifications = () => {
    // Save logic would go here
    toast.success('Notification preferences saved');
  };
  
  // Handle save privacy settings
  const handleSavePrivacy = () => {
    // Save logic would go here
    toast.success('Privacy settings saved');
  };
  
  // Handle save location settings
  const handleSaveLocation = () => {
    // Save logic would go here
    toast.success('Location settings saved');
  };
  
  // Handle data export
  const handleExportData = () => {
    toast.success('Your data export has been initiated. You will receive an email with your data soon.');
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Account deletion logic would go here
      toast.success('Your account has been scheduled for deletion. You will receive a confirmation email.');
      navigate('/');
    }
  };
  
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
            {/* Profile Settings */}
            <TabsContent value="profile" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
              <p className="text-gray-500 mb-6">
                Update your personal information and how you appear to others on Plaquer.
              </p>
              <ProfileForm />
            </TabsContent>
            
            {/* Security Settings */}
            <TabsContent value="security" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Security Settings</h2>
              <p className="text-gray-500 mb-6">
                Manage your account security settings, including password and two-factor authentication.
              </p>
              
              <div className="grid grid-cols-1 gap-8">
                {/* Password Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      {passwordError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Password must be at least 8 characters long
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Two-Factor Authentication Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">
                          Require a verification code when signing in
                        </p>
                      </div>
                      <Switch checked={false} disabled />
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Two-factor authentication is coming soon to further enhance your account security.
                    </p>
                  </CardContent>
                </Card>
                
                {/* Account Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                    <CardDescription>
                      Export your data or delete your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Export Your Data</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Download a copy of your data, including your profile information, collections, and visited plaques.
                      </p>
                      <Button variant="outline" onClick={handleExportData}>
                        Export Data
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Delete Account</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Notification Settings */}
            <TabsContent value="notifications" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
              <p className="text-gray-500 mb-6">
                Control which notifications you receive from Plaquer.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Methods */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Delivery Methods</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Email Notifications</h4>
                        <p className="text-xs text-gray-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch 
                        checked={emailNotifications} 
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Push Notifications</h4>
                        <p className="text-xs text-gray-500">
                          Receive notifications on your device
                        </p>
                      </div>
                      <Switch 
                        checked={pushNotifications} 
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Notification Types</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Visit Reminders</h4>
                        <p className="text-xs text-gray-500">
                          Reminders when you're near plaques you haven't visited
                        </p>
                      </div>
                      <Switch 
                        checked={visitReminders} 
                        onCheckedChange={setVisitReminders}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Weekly Digest</h4>
                        <p className="text-xs text-gray-500">
                          Summary of new plaques and activity in your area
                        </p>
                      </div>
                      <Switch 
                        checked={weeklyDigest} 
                        onCheckedChange={setWeeklyDigest}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Collection Updates</h4>
                        <p className="text-xs text-gray-500">
                          Updates when collections you follow are modified
                        </p>
                      </div>
                      <Switch 
                        checked={newCollectionUpdates} 
                        onCheckedChange={setNewCollectionUpdates}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveNotifications}>
                    Save Notification Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Privacy Settings */}
            <TabsContent value="privacy" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
              <p className="text-gray-500 mb-6">
                Manage how your profile and activity are visible to others.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Preferences</CardTitle>
                  <CardDescription>
                    Control who can see your activity and collections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Visibility */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Profile Visibility</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="profileVisibility">Who can see your profile</Label>
                      <Select 
                        value={profileVisibility} 
                        onValueChange={setProfileVisibility}
                      >
                        <SelectTrigger id="profileVisibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {profileVisibility === 'public' && 'Anyone can see your profile and collections'}
                        {profileVisibility === 'friends' && 'Only people you follow can see your profile and collections'}
                        {profileVisibility === 'private' && 'Your profile is only visible to you'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Activity Privacy */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Activity Privacy</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Show Visited Plaques</h4>
                        <p className="text-xs text-gray-500">
                          Allow others to see which plaques you've visited
                        </p>
                      </div>
                      <Switch 
                        checked={showVisitedPlaques} 
                        onCheckedChange={setShowVisitedPlaques}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Share Collections</h4>
                        <p className="text-xs text-gray-500">
                          Allow others to see and follow your collections
                        </p>
                      </div>
                      <Switch 
                        checked={shareCollections} 
                        onCheckedChange={setShareCollections}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Activity Feed</h4>
                        <p className="text-xs text-gray-500">
                          Show your activity in others' feeds
                        </p>
                      </div>
                      <Switch 
                        checked={activityFeed} 
                        onCheckedChange={setActivityFeed}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSavePrivacy}>
                    Save Privacy Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Location Settings */}
            <TabsContent value="location" className="mt-0">
              <h2 className="text-xl font-bold mb-4">Location Settings</h2>
              <p className="text-gray-500 mb-6">
                Control how the app uses your location data.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Location Preferences</CardTitle>
                  <CardDescription>
                    Manage location access and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Access */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Location Access</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Enable Location</h4>
                        <p className="text-xs text-gray-500">
                          Allow Plaquer to access your location
                        </p>
                      </div>
                      <Switch 
                        checked={locationAccess} 
                        onCheckedChange={setLocationAccess}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="locationPrecision">Location Precision</Label>
                      <Select 
                        value={locationPrecision} 
                        onValueChange={setLocationPrecision}
                        disabled={!locationAccess}
                      >
                        <SelectTrigger id="locationPrecision">
                          <SelectValue placeholder="Select precision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="precise">Precise Location</SelectItem>
                          <SelectItem value="approximate">Approximate Location</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {locationPrecision === 'precise' ? 
                          'Plaquer will use your exact location to find nearby plaques' : 
                          'Plaquer will use an approximate location (less accurate)'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Location History */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Location History</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Save Location History</h4>
                        <p className="text-xs text-gray-500">
                          Save your visited locations for route tracking
                        </p>
                      </div>
                      <Switch 
                        checked={saveLocationHistory} 
                        onCheckedChange={setSaveLocationHistory}
                        disabled={!locationAccess}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultMapView">Default Map View</Label>
                      <Select 
                        value={defaultMapView} 
                        onValueChange={setDefaultMapView}
                      >
                        <SelectTrigger id="defaultMapView">
                          <SelectValue placeholder="Select map view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="street">Street Map</SelectItem>
                          <SelectItem value="satellite">Satellite View</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        disabled={!locationAccess || !saveLocationHistory}
                      >
                        Clear Location History
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveLocation}>
                    Save Location Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;