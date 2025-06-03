import React from 'react'; // Note: React import is unused by the utility functions here.

// Define and EXPORT haptic feedback inline
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      selection: [5],
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50]
    };

    try {
      navigator.vibrate(patterns[type] || patterns.light);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }
};

// Device detection
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
 
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet', 'phone'];
 
  return (
    mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
 
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

// Viewport utilities
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
 
  // Use visual viewport if available (better for mobile)
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.height;
  }
 
  return window.innerHeight;
};

export const getScreenSize = (): { width: number; height: number } => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
 
  return {
    width: window.screen.width,
    height: window.screen.height
  };
};

// Touch and interaction utilities
export const preventZoom = (element: HTMLElement): void => {
  if (isIOS()) {
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }
};

export const enableTouchFeedback = (element: HTMLElement): void => {
  element.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
  element.style.webkitTouchCallout = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.touchAction = 'manipulation';
};

// Form optimization
export const optimizeFormForMobile = (form: HTMLFormElement): void => {
  const inputs = form.querySelectorAll('input, textarea');
 
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement;
   
    // Prevent zoom on iOS
    if (element.style.fontSize !== '16px') {
      element.style.fontSize = '16px';
    }
   
    // Optimize input modes
    if (element.type === 'email') {
      element.inputMode = 'email';
    } else if (element.type === 'tel') {
      element.inputMode = 'tel';
    } else if (element.type === 'number') {
      element.inputMode = 'numeric';
    }
   
    // Enable touch feedback
    enableTouchFeedback(element);
  });
};

// Performance utilities
export const requestIdleCallback = (callback: () => void): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Orientation utilities
export const getOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'portrait';
 
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

export const lockOrientation = (orientation: 'portrait' | 'landscape'): void => {
  if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
    (window.screen.orientation as any).lock(orientation).catch(() => {
      console.debug('Orientation lock not supported');
    });
  }
};

// Enhanced mobile navigation
export const useMobileNavigation = () => {
  const [isNavigating, setIsNavigating] = React.useState(false);
 
  const navigateWithFeedback = (callback: () => void) => {
    if (isNavigating) return;
   
    setIsNavigating(true);
    triggerHapticFeedback('selection'); // This will now use the exported function from this file
   
    // Add small delay for visual feedback
    setTimeout(() => {
      callback();
      setIsNavigating(false);
    }, 150);
  };
 
  return { navigateWithFeedback, isNavigating };
};

// Mobile-specific initialization
export const initMobileOptimizations = (): void => {
  if (typeof window === 'undefined') return;
 
  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
 
  // Optimize scrolling
  document.body.style.webkitOverflowScrolling = 'touch';
 
  // Set viewport meta tag if not present
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
 
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';
 
  // Add safe area CSS variables
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --safe-area-inset-top: env(safe-area-inset-top);
      --safe-area-inset-bottom: env(safe-area-inset-bottom);
      --safe-area-inset-left: env(safe-area-inset-left);
      --safe-area-inset-right: env(safe-area-inset-right);
    }
  `;
  document.head.appendChild(style);
 
  // Initialize forms
  document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => optimizeFormForMobile(form));
  });
};