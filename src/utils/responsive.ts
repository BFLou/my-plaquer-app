// src/utils/responsive.ts - New utility for responsive behavior
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    
    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    return () => window.removeEventListener('resize', updateResponsive);
  }, []);
  
  return { isMobile, isTablet, isDesktop };
};

export const getTouchFriendlySize = (baseSize: number, isMobile: boolean) => {
  return isMobile ? Math.max(baseSize, 44) : baseSize; // 44px is iOS touch target minimum
};