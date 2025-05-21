// src/components/settings/SecuritySettings.tsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import SettingsCard from './SettingsCard';

const SecuritySettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (passwordError) {
      setPasswordError('');
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handlePasswordChange = (e: React.FormEvent) => {
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
    
    toast.success('Password updated successfully');
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    toast.success('Your data export has been initiated. You will receive an email with your data soon.');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.success('Your account has been scheduled for deletion. You will receive a confirmation email.');
    }
  };

  return (
    <div>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-1">Security Settings</h2>
        <p className="text-gray-500">
          Manage your account security settings, including password and two-factor authentication.
        </p>
      </div>

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
              Must be at least 8 characters long
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
      </SettingsCard>

      <SettingsCard 
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Lock className="text-green-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500">
                Require a verification code when signing in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!twoFactorEnabled && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Coming Soon
              </Badge>
            )}
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={setTwoFactorEnabled}
              disabled={true}
            />
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