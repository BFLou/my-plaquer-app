// src/components/layout/PageContainer.tsx - Enhanced with mobile navigation
import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { MobileNavBar } from '@/components/layout/MobileNavBar';

type PageContainerProps = {
  children: React.ReactNode;
  activePage?:
    | 'home'
    | 'discover'
    | 'library'
    | 'collections'
    | 'about'
    | 'profile';
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
  paddingBottom = 'mobile-nav',
}: PageContainerProps) => {
  // Determine container classes for proper mobile scrolling
  const getContainerClasses = () => {
    let classes = 'min-h-screen flex flex-col bg-gray-50';

    // Add mobile-specific classes
    classes += ' touch-scroll hardware-accelerated mobile-container';

    return `${classes} ${className}`;
  };

  // Determine main content classes
  const getMainClasses = () => {
    let classes = containerClass || 'flex-grow';

    // Add mobile scroll optimization
    classes +=
      ' mobile-content-area ios-scroll-fix android-scroll-fix relative';

    // Handle specific padding requirements
    if (paddingBottom === 'none') {
      classes += ' pb-0';
    } else if (
      paddingBottom === 'mobile-nav' &&
      !hideMobileNav &&
      mobileNavStyle !== 'hidden'
    ) {
      classes += ' pb-16 md:pb-0'; // 64px mobile nav space
    }

    return classes;
  };

  return (
    <div className={getContainerClasses()}>
      {/* Desktop Navigation */}
      {!hideNavBar && (
        <div className="hidden md:block">
          <NavBar activePage={activePage} />
        </div>
      )}

      {/* Main Content with proper mobile scrolling */}
      <main className={getMainClasses()}>
        <div className="mobile-content-wrapper will-change-scroll h-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      {hasFooter && <Footer simplified={simplifiedFooter} />}

      {/* Mobile Navigation */}
      {!hideMobileNav && mobileNavStyle !== 'hidden' && <MobileNavBar />}
    </div>
  );
};

export default PageContainer;
