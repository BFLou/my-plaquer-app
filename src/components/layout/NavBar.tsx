// src/components/layout/NavBar.tsx (Updated with auth integration)
import React, { useState } from 'react';
import { MapPin, X, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/auth/UserMenu';

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
};

const NavLink = ({ to, children, isActive = false }: NavLinkProps) => (
  <Link 
    to={to} 
    className={`${isActive 
      ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
      : 'text-gray-600 hover:text-blue-600'} transition`}
  >
    {children}
  </Link>
);

type NavBarProps = {
  activePage?: 'home' | 'discover' | 'collections' | 'about' | 'profile' | 'settings';
};

export const NavBar = ({ activePage }: NavBarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth(); // Use the auth context instead of UserContext
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <MapPin className="text-white" size={16} />
          </div>
          <span className="text-xl font-bold text-blue-600">Plaquer</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          <NavLink to="/" isActive={activePage === 'home' || location.pathname === '/'}>Home</NavLink>
          <NavLink to="/discover" isActive={activePage === 'discover' || location.pathname.includes('/discover')}>Discover</NavLink>
          <NavLink to="/collections" isActive={activePage === 'collections' || location.pathname.includes('/collections')}>Collections</NavLink>
          <NavLink to="/about" isActive={activePage === 'about'}>About</NavLink>
          
          {/* Replace the Avatar with UserMenu component */}
          <UserMenu />
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <UserMenu />
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute left-0 right-0 top-16 shadow-md p-4 z-50 border-t border-gray-100">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className={`${activePage === 'home' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/discover" 
              className={`${activePage === 'discover' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
              onClick={() => setIsMenuOpen(false)}
            >
              Discover
            </Link>
            <Link 
              to="/collections" 
              className={`${activePage === 'collections' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
              onClick={() => setIsMenuOpen(false)}
            >
              Collections
            </Link>
            <Link 
              to="/about" 
              className={`${activePage === 'about' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/profile" 
                  className={`${activePage === 'profile' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link 
                  to="/settings" 
                  className={`${activePage === 'settings' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;