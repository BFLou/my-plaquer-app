// src/hooks/useSafeArea.ts
import { useState, useEffect } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      // Get safe area insets from CSS env() variables
      const computedStyle = getComputedStyle(document.documentElement);
      
      const getEnvValue = (variable: string): number => {
        const value = computedStyle.getPropertyValue(`env(${variable})`);
        return value ? parseInt(value.replace('px', ''), 10) || 0 : 0;
      };

      setSafeAreaInsets({
        top: getEnvValue('safe-area-inset-top'),
        bottom: getEnvValue('safe-area-inset-bottom'),
        left: getEnvValue('safe-area-inset-left'),
        right: getEnvValue('safe-area-inset-right')
      });
    };

    updateSafeArea();
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeAreaInsets;
};