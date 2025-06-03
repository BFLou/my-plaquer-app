// src/components/layout/PageContainer.tsx - Enhanced with mobile navigation
import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { MobileNavBar } from '@/components/layout/MobileNavBar';

type PageContainerProps = {
  children: React.ReactNode;
  activePage?: 'home' | 'discover' | 'library' | 'collections' | 'about' | 'profile';
  hasFooter?: boolean;
  simplifiedFooter?: boolean;
  className?: string;
  containerClass?: string;
  hideNavBar?: boolean;
  hideMobileNav?: boolean;
  mobileNavStyle?: 'default' | 'transparent' | 'hidden';
  paddingBottom?: 'mobile-nav' | 'none' | 'custom';
};

export const PageContainer = ({
  children,
  activePage,
  hasFooter = true,
  simplifiedFooter = false,
  className = '',
  containerClass = '',
  hideNavBar = false,
  hideMobileNav = false,
  mobileNavStyle = 'default',
  paddingBottom = 'mobile-nav'
}: PageContainerProps) => {
  // Determine bottom padding based on mobile nav and footer
  const getBottomPadding = () => {
    if (paddingBottom === 'none') return '';
    if (paddingBottom === 'custom') return '';
    
    // Default mobile nav padding
    if (!hideMobileNav && mobileNavStyle !== 'hidden') {
      return 'pb-16 md:pb-0'; // 64px for mobile nav
    }
    
    return '';
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      {/* Desktop Navigation */}
      {!hideNavBar && (
        <div className="hidden md:block">
          <NavBar activePage={activePage} />
        </div>
      )}
      
      {/* Main Content */}
      <main className={`${containerClass || 'flex-grow'} ${getBottomPadding()}`}>
        {children}
      </main>
      
      {/* Footer */}
      {hasFooter && (
        <Footer simplified={simplifiedFooter} />
      )}
      
      {/* Mobile Navigation */}
      {!hideMobileNav && mobileNavStyle !== 'hidden' && (
        <MobileNavBar />
      )}
    </div>
  );
};

export default PageContainer;