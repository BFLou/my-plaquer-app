// src/components/library/LibraryHeader.tsx
import React from 'react';
import { BookOpen, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LibraryHeaderProps {
  user: any;
  totalCollections: number;
  totalRoutes: number;
  totalVisits: number;
  title?: string;
  showStats?: boolean;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  user,
  totalCollections,
  totalRoutes,
  totalVisits,
  title = 'My Library',
  showStats = true,
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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

  return (
    <section className="relative bg-gradient-to-br from-purple-600 to-purple-700 text-white py-8 px-4 overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
        <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Profile Photo */}
            <div className="relative">
              {user.photoURL ? (
                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              )}
            </div>

            {/* Title and User Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={24} className="text-white" />
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
              <p className="opacity-90">
                Welcome back, {user.displayName || 'Explorer'}
              </p>
              {showStats && (
                <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
                  <span>{totalCollections} Collections</span>
                  <span>•</span>
                  <span>{totalRoutes} Routes</span>
                  <span>•</span>
                  <span>{totalVisits} Visits</span>
                </div>
              )}
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
  );
};

export default LibraryHeader;
