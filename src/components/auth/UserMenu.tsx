// src/components/auth/UserMenu.tsx (Simplified)
import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
    setIsOpen(false);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/')}
        variant="outline"
        size="sm"
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 h-9 px-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
        )}
        <span className="hidden sm:block font-medium text-sm">
          {user.displayName || 'User'}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{user.displayName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
              onClick={() => handleMenuAction(() => navigate('/profile'))}
            >
              <User size={16} className="text-gray-500" />
              Profile
            </button>

            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
              onClick={() => handleMenuAction(() => navigate('/settings'))}
            >
              <Settings size={16} className="text-gray-500" />
              Settings
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 pt-1">
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;