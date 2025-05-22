// src/pages/ProfilePage.tsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Camera,
  LogOut,
  BookOpen,
  Activity,
  Star
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useCollections } from '@/hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import { toast } from 'sonner';
import ProfileForm from '@/components/profile/ProfileForm';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { collections } = useCollections();
  const { visits } = useVisitedPlaques();
  const { routes } = useRoutes();
  const fileInputRef = useRef(null);

  // Calculate basic statistics for the header
  const totalVisits = visits.length;
  const totalCollections = collections.length;
  const totalFavorites = collections.filter(c => c.is_favorite).length;
  const totalRoutes = routes.length;
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;

  // Handle photo upload
  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large', {
        description: 'Please select an image under 5MB'
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file'
      });
      return;
    }
    
    try {
      toast.loading('Uploading profile photo...');
      
      const { profileImageService } = await import('@/services/profileImageService');
      
      if (user.photoURL) {
        await profileImageService.deleteOldProfileImage(user.photoURL);
      }
      
      const downloadURL = await profileImageService.uploadProfileImage(user.uid, file);
      
      if (downloadURL) {
        toast.dismiss();
        toast.success('Profile photo updated');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.dismiss();
      toast.error('Failed to upload photo');
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  if (!user) {
    return (
      <PageContainer 
        activePage="profile"
        simplifiedFooter={true}
      >
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-6">You need to sign in to view your profile.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      activePage="profile"
      simplifiedFooter={true}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 px-4 overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Profile Photo */}
              <div className="relative">
                {user.photoURL ? (
                  <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full overflow-hidden">
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute bottom-0 right-0 h-7 w-7 p-0 rounded-full bg-white hover:bg-gray-100"
                  onClick={handlePhotoUpload}
                >
                  <Camera size={12} className="text-gray-700" />
                </Button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold">{user.displayName || 'User'}</h1>
                <p className="opacity-90 mt-1">
                  Member since {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate('/settings')}
              >
                <Settings size={16} className="mr-2" /> Settings
              </Button>
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut size={16} className="mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto max-w-5xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-blue-600">{uniquePlaquesVisited}</div>
              <div className="text-xs text-gray-500">Plaques Visited</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-purple-600">{totalCollections}</div>
              <div className="text-xs text-gray-500">Collections</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-green-600">{totalRoutes}</div>
              <div className="text-xs text-gray-500">Routes</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <User size={12} className="mr-1" /> Profile
            </Badge>
            {totalFavorites > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star size={12} className="mr-1" /> {totalFavorites} Favorites
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick Navigation */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => navigate('/library')}
            >
              <BookOpen className="text-blue-500" size={24} />
              <span className="font-medium">My Library</span>
              <span className="text-xs text-gray-500">{totalCollections + totalRoutes} items</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => navigate('/library/visited')}
            >
              <Activity className="text-green-500" size={24} />
              <span className="font-medium">Visit History</span>
              <span className="text-xs text-gray-500">{totalVisits} visits</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => navigate('/settings')}
            >
              <Settings className="text-purple-500" size={24} />
              <span className="font-medium">Settings</span>
              <span className="text-xs text-gray-500">Account & Privacy</span>
            </Button>
          </div>
        </div>
        
        {/* Profile Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Profile Information</h2>
          <ProfileForm />
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;