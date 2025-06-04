// src/components/layout/NavBar.tsx (Updated with separator and consistent styling)
import React, { useState } from 'react';
import { X, MoreHorizontal, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/auth/UserMenu';
import PlaquerLogo from '@/components/common/PlaquerLogo';

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
  activePage?: 'home' | 'discover' | 'library' | 'collections' | 'about' | 'profile' | 'settings';
};

export const NavBar = ({ activePage }: NavBarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Helper function to determine if library pages are active
  const isLibraryActive = () => {
    return activePage === 'library' || 
           activePage === 'collections' || 
           location.pathname.includes('/library') || 
           location.pathname.includes('/collections') || 
           location.pathname.includes('/routes');
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <PlaquerLogo size={32} />
          <span className="text-xl font-bold text-blue-600">Plaquer</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex gap-6 items-center">
            <NavLink to="/" isActive={activePage === 'home' || location.pathname === '/'}>
              Home
            </NavLink>
            <NavLink to="/discover" isActive={activePage === 'discover' || location.pathname.includes('/discover')}>
              Discover
            </NavLink>
            <NavLink to="/library" isActive={isLibraryActive()}>
              My Library
            </NavLink>
            <NavLink to="/about" isActive={activePage === 'about'}>
              About
            </NavLink>
          </div>
          
          {/* Separator Bar */}
          <div className="h-6 w-px bg-gray-300 mx-6"></div>
          
          {/* User Menu */}
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
              to="/library" 
              className={`${isLibraryActive() ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition flex items-center gap-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen size={16} />
              My Library
            </Link>
            <Link 
              to="/about" 
              className={`${activePage === 'about' ? 'text-blue-600 font-medium' : 'text-gray-600'} hover:text-blue-600 py-2 transition`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;