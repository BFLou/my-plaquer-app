// src/utils/mobileUtils.ts - Simple mobile utility functions
import { useEffect, useState } from 'react';

export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Simple mobile navigation hook
export const useMobileNavigation = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrolledEnough = Math.abs(currentScrollY - lastScrollY) > 10;
      
      if (scrolledEnough) {
        setIsVisible(!scrollingDown || currentScrollY < 100);
        setLastScrollY(currentScrollY);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  return { isVisible };
};

// Simple haptic feedback
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  // Set proper viewport if not already set
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  // Add theme color for mobile browsers
  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#3b82f6';
    document.head.appendChild(themeColor);
  }

  // Prevent zoom on iOS inputs
  if (isIOS()) {
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
  }
};

export default {
  isMobile,
  isIOS,
  useMobileNavigation,
  triggerHapticFeedback,
  initMobileOptimizations
};