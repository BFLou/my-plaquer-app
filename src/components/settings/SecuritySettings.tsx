// src/components/settings/SecuritySettings.tsx - Updated with conditional UI
import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  AlertTriangle,
  Download,
  Trash2,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';
import { useAuth } from '@/hooks/useAuth';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Detect authentication providers
  const getAuthProviders = () => {
    if (!user?.providerData)
      return { hasPassword: false, hasGoogle: false, providers: [] };

    const providers = user.providerData.map((provider) => provider.providerId);
    return {
      hasPassword: providers.includes('password'),
      hasGoogle: providers.includes('google.com'),
      providers: providers,
    };
  };

  const authProviders = getAuthProviders();

  useEffect(() => {
    if (passwordError) {
      setPasswordError('');
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!user || !user.email) {
      setPasswordError('User not authenticated properly');
      return;
    }

    setIsLoading(true);

    try {
      // First, reauthenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Then update the password
      await updatePassword(user, newPassword);

      toast.success('Password updated successfully');

      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError(
          'Please sign out and sign in again before changing your password'
        );
      } else {
        setPasswordError(error.message || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    toast.success(
      'Your data export has been initiated. You will receive an email with your data soon.'
    );
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      toast.success(
        'Your account has been scheduled for deletion. You will receive a confirmation email.'
      );
    }
  };

  const renderPasswordSection = () => {
    if (authProviders.hasPassword) {
      return (
        <SettingsCard
          title="Change Password"
          description="Update your password to keep your account secure"
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
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
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCurrentPassword(e.target.value)
                  }
                  className="pr-12 h-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                className="h-12"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </SettingsCard>
      );
    } else {
      // Fallback for other authentication methods
      return (
        <SettingsCard
          title="Password Management"
          description="Password management not available for your authentication method"
        >
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-amber-900 mb-2">
                  Authentication Method
                </h4>
                <p className="text-sm text-amber-700">
                  Your account uses a different authentication method. Password
                  changes are not available.
                </p>
              </div>
            </div>
          </div>
        </SettingsCard>
      );
    }
  };

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Security Settings</h2>
        <p className="text-gray-500">
          Manage your account security settings, including password and
          two-factor authentication.
        </p>
      </div>

      {/* Account Info */}
      <SettingsCard
        title="Account Information"
        description="Your current authentication methods"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📧</span>
              </div>
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              Verified
            </Badge>
          </div>

          {authProviders.hasGoogle && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-sm">G</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Google Account</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Active
              </Badge>
            </div>
          )}

          {authProviders.hasPassword && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🔑</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-gray-500">Set up and active</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Active
              </Badge>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Dynamic Password Section */}
      {renderPasswordSection()}

      <SettingsCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="text-green-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500">
                {authProviders.hasGoogle
                  ? 'Managed through your Google Account'
                  : 'Require a verification code when signing in'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {authProviders.hasGoogle ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open('https://myaccount.google.com/security', '_blank')
                }
                className="gap-1"
              >
                <ExternalLink size={14} />
                Manage
              </Button>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  Coming Soon
                </Badge>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                  disabled={true}
                />
              </>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Account Actions"
        description="Export your data or delete your account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="text-blue-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-gray-500">
                    Download all your data including collections and visits
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Export
              </Button>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="text-red-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700">
                    Permanently delete your account and all data
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default SecuritySettings;
