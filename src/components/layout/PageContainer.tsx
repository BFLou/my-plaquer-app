import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

type PageContainerProps = {
  children: React.ReactNode;
  activePage?: 'home' | 'discover' | 'collections' | 'about';
  hasFooter?: boolean;
  simplifiedFooter?: boolean;
  className?: string;
  containerClass?: string;
};

export const PageContainer = ({
  children,
  activePage,
  hasFooter = true,
  simplifiedFooter = false,
  className = '',
  containerClass = ''
}: PageContainerProps) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      <NavBar activePage={activePage} />
      
      <main className={containerClass || 'flex-grow'}>
        {children}
      </main>
      
      {hasFooter && (
        <Footer simplified={simplifiedFooter} />
      )}
    </div>
  );
};

export default PageContainer;