// src/components/profile/ProfileForm.tsx
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Save, Loader, User } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection for profile photo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image file size must be less than 5MB');
      return;
    }
    
    if (!file.type.match('image.*')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Here you would upload the image to Firebase Storage
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a local object URL for preview
      const localUrl = URL.createObjectURL(file);
      setPhotoURL(localUrl);
      
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Here you would update the user profile in Firebase Auth and Firestore
      // For now, we'll simulate it with a timeout
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
      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {photoURL ? (
            <img 
              src={photoURL} 
              alt={displayName || 'User'} 
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-12 w-12 text-blue-600" />
            </div>
          )}
          
          <Button 
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-0 right-0 h-8 w-8 p-0 rounded-full bg-white"
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
        <p className="text-xs text-gray-500">Click the camera icon to upload a new photo</p>
      </div>
      
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          disabled={isLoading}
        />
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a bit about yourself..."
          disabled={isLoading}
          rows={4}
        />
      </div>
      
      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email"
          value={user?.email || ''}
          readOnly
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          Email cannot be changed directly. Please contact support if you need to update your email.
        </p>
      </div>
      
      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader size={16} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} className="mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
};

export default ProfileForm;