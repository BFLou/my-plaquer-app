// src/components/profile/ProfileForm.tsx (Enhanced version)
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Save, Loader, User, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileFormProps {
  onSuccess?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection for profile photo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }
    
    if (!file.type.match('image.*')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoURL('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Section - Enhanced */}
      <div className="space-y-4">
        <Label>Profile Photo</Label>
        <div className="flex items-center gap-6">
          <div className="relative group">
            {photoPreview || photoURL ? (
              <div className="relative">
                <img 
                  src={photoPreview || photoURL} 
                  alt={displayName || 'User'} 
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-100"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-100">
                <User className="h-12 w-12 text-blue-600" />
              </div>
            )}
            
            <Button 
              type="button"
              variant="outline"
              size="sm"
              className="absolute bottom-0 right-0 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera size={14} />
            </Button>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Upload a new profile photo to personalize your account
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Choose Photo
              </Button>
              {(photoPreview || photoURL) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removePhoto}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Display Name - Enhanced */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          disabled={isLoading}
          className="bg-gray-50 focus:bg-white transition-colors"
        />
        <p className="text-xs text-gray-500">
          This is how your name will appear to other users
        </p>
      </div>
      
      {/* Bio - Enhanced */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <span className="text-xs text-gray-500">{bio.length}/200</span>
        </div>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a bit about yourself and your interest in history..."
          disabled={isLoading}
          rows={4}
          maxLength={200}
          className="bg-gray-50 focus:bg-white transition-colors resize-none"
        />
      </div>
      
      {/* Email - Enhanced */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email Address</Label>
          <Badge variant="outline" className="bg-gray-50">
            Verified
          </Badge>
        </div>
        <Input 
          id="email"
          value={user?.email || ''}
          readOnly
          disabled
          className="bg-gray-100 text-gray-600"
        />
        <p className="text-xs text-gray-500">
          Contact support to update your email address
        </p>
      </div>
      
      {/* Member Since - New */}
      <div className="space-y-2">
        <Label>Member Since</Label>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">
            {new Date(user?.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Submit Button - Enhanced */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full h-11" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Profile Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;