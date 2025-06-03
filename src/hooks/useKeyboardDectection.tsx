// src/hooks/useKeyboardDetection.ts
import { useState, useEffect } from 'react';

export const useKeyboardDetection = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      // Detect virtual keyboard on mobile
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;
      const screenHeight = window.screen.height;
      
      // Threshold for keyboard detection (usually ~300px on mobile)
      const keyboardThreshold = 150;
      const heightDifference = screenHeight - currentHeight;
      
      if (heightDifference > keyboardThreshold && currentWidth < 768) {
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    // Listen for visual viewport changes (better for keyboard detection)
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      
      const handleViewportChange = () => {
        const heightDifference = window.innerHeight - visualViewport.height;
        const keyboardThreshold = 150;
        
        if (heightDifference > keyboardThreshold) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      };

      visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        visualViewport.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback for browsers without visual viewport support
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};
