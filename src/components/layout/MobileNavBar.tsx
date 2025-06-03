// src/components/layout/MobileNavBar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, User, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type NavItem = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  activePattern: RegExp;
  requiresAuth?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: Home,
    label: 'Home',
    path: '/',
    activePattern: /^\/$/
  },
  {
    icon: Search,
    label: 'Discover',
    path: '/discover',
    activePattern: /^\/discover/
  },
  {
    icon: BookOpen,
    label: 'Library',
    path: '/library',
    activePattern: /^\/library/,
    requiresAuth: true
  },
  {
    icon: User,
    label: 'Profile',
    path: '/profile',
    activePattern: /^\/profile|\/settings/,
    requiresAuth: true
  }
];

export const MobileNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (item: NavItem) => {
    if (item.requiresAuth && !user) {
      navigate('/signin', { 
        state: { 
          redirectTo: item.path,
          featureName: `access ${item.label.toLowerCase()}`
        } 
      });
      return;
    }
    navigate(item.path);
  };

  const isActive = (item: NavItem) => {
    return item.activePattern.test(location.pathname);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-pb md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const needsAuth = item.requiresAuth && !user;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] relative ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : needsAuth
                  ? 'text-gray-400'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              disabled={needsAuth}
            >
              <Icon 
                size={20} 
                className={`mb-1 transition-transform duration-200 ${
                  active ? 'scale-110' : ''
                }`} 
              />
              <span className={`text-xs font-medium ${
                active ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
              {needsAuth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full border border-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};