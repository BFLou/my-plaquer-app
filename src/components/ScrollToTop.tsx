// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Only scroll to top for new page navigations, not for URL parameter changes
    const isParameterChange =
      location.search.includes('view=') ||
      location.search.includes('search=') ||
      location.search.includes('colors=') ||
      location.search.includes('postcodes=');

    if (!isParameterChange) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return null;
};
