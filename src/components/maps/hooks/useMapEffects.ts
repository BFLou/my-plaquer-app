// src/hooks/useMapEffects.ts
import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for map visual effects and animations
 */
export const useMapEffects = (mapInstance: any) => {
  // Reference for animation frames
  const animationFrameRef = useRef<number | null>(null);
  
  // Add pulsing effect to a marker
  const addPulseEffect = useCallback((marker: any, options = {}) => {
    if (!marker || !marker.getElement()) return;
    
    const defaults = {
      duration: 1500, // ms
      color: '#3b82f6', // blue-500
      size: 30, // px
      intensity: 0.7 // opacity
    };
    
    const config = { ...defaults, ...options };
    const element = marker.getElement();
    
    // Create pulse element
    const pulse = document.createElement('div');
    pulse.className = 'marker-pulse';
    pulse.style.position = 'absolute';
    pulse.style.top = '50%';
    pulse.style.left = '50%';
    pulse.style.width = `${config.size}px`;
    pulse.style.height = `${config.size}px`;
    pulse.style.marginTop = `${-config.size/2}px`;
    pulse.style.marginLeft = `${-config.size/2}px`;
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = `${config.color}`;
    pulse.style.opacity = `${config.intensity}`;
    pulse.style.zIndex = '-1';
    
    // Add animation
    pulse.style.animation = `pulse ${config.duration}ms infinite`;
    
    // Add pulse element to marker
    element.appendChild(pulse);
    
    // Add style if not already in document
    if (!document.getElementById('pulse-animation-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation-style';
      style.innerHTML = `
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: ${config.intensity};
          }
          70% {
            transform: scale(2);
            opacity: 0;
          }
          100% {
            transform: scale(0.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Return function to remove effect
    return () => {
      if (element && element.contains(pulse)) {
        element.removeChild(pulse);
      }
    };
  }, []);
  
  // Add floating animation to a marker
  const addFloatingEffect = useCallback((marker: any) => {
    if (!marker || !marker.getElement()) return;
    
    const element = marker.getElement();
    
    // Add floating animation class
    element.classList.add('floating-marker');
    
    // Add style if not already in document
    if (!document.getElementById('floating-marker-style')) {
      const style = document.createElement('style');
      style.id = 'floating-marker-style';
      style.innerHTML = `
        .floating-marker {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Return function to remove effect
    return () => {
      element.classList.remove('floating-marker');
    };
  }, []);
  
  // Add drop-in animation for markers
  const addDropInEffect = useCallback((marker: any, delay = 0) => {
    if (!marker || !marker.getElement()) return;
    
    const element = marker.getElement();
    
    // Hide initially
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';
    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    
    // Animate in after delay
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }, []);
  
  // Animate route line drawing
  const animateRouteLine = useCallback((route: any, duration = 1500) => {
    if (!route || !mapInstance) return;
    
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Get all polylines in the route
    const polylines: any[] = [];
    route.eachLayer((layer: any) => {
      if (layer instanceof window.L.Polyline && !(layer instanceof window.L.Marker)) {
        polylines.push(layer);
        // Reset styles
        layer.setStyle({ opacity: 0 });
      }
    });
    
    if (polylines.length === 0) return;
    
    // Animate sequentially
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate which polyline should be visible
      const segmentDuration = duration / polylines.length;
      
      polylines.forEach((polyline, index) => {
        const segmentStart = index * segmentDuration;
        const segmentEnd = (index + 1) * segmentDuration;
        
        if (elapsed >= segmentStart) {
          // Calculate segment progress
          const segmentProgress = Math.min((elapsed - segmentStart) / segmentDuration, 1);
          polyline.setStyle({ opacity: segmentProgress });
        }
      });
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Return cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mapInstance]);
  
  // Add fade-in effect for popups
  const enhancePopupAnimations = useCallback(() => {
    if (!mapInstance) return;
    
    // Add CSS to document if not already present
    if (!document.getElementById('popup-animations-style')) {
      const style = document.createElement('style');
      style.id = 'popup-animations-style';
      style.innerHTML = `
        .leaflet-popup {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        .leaflet-popup.leaflet-popup-active {
          opacity: 1;
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Override popup methods
    const originalOnAdd = window.L.Popup.prototype.onAdd;
    window.L.Popup.prototype.onAdd = function(map) {
      originalOnAdd.call(this, map);
      setTimeout(() => {
        if (this._container) {
          this._container.classList.add('leaflet-popup-active');
        }
      }, 10);
    };
    
    const originalOnRemove = window.L.Popup.prototype.onRemove;
    window.L.Popup.prototype.onRemove = function(map) {
      if (this._container) {
        this._container.classList.remove('leaflet-popup-active');
      }
      
      // Wait for animation to finish before actual removal
      setTimeout(() => {
        originalOnRemove.call(this, map);
      }, 300);
    };
  }, [mapInstance]);
  
  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return {
    addPulseEffect,
    addFloatingEffect,
    addDropInEffect,
    animateRouteLine,
    enhancePopupAnimations
  };
};

export default useMapEffects;