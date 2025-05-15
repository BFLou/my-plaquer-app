import { useState, useEffect } from 'react';

// Animation types
export type AnimationType = 
  'fade-in' | 'fade-out' | 
  'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' |
  'zoom-in' | 'zoom-out' |
  'bounce' | 'pulse' | 'shake' |
  'rotate-in' | 'rotate-out';

// Animation timing
export type AnimationTiming = 'fast' | 'normal' | 'slow' | 'very-slow';

// Animation trigger types
export type TriggerType = 'mount' | 'hover' | 'click' | 'visible' | 'manual';

// Animation options
export interface AnimationOptions {
  type: AnimationType;
  timing?: AnimationTiming;
  delay?: number;
  duration?: number;
  trigger?: TriggerType;
  infinite?: boolean;
  easing?: string;
  threshold?: number; // For 'visible' trigger (0-1)
}

// Animation state
export interface AnimationState {
  isAnimating: boolean;
  hasAnimated: boolean;
  animationClass: string;
}

/**
 * Custom hook for applying animations to collections UI
 */
export const useAnimation = (options: AnimationOptions): [AnimationState, (force?: boolean) => void] => {
  const [state, setState] = useState<AnimationState>({
    isAnimating: options.trigger === 'mount',
    hasAnimated: false,
    animationClass: ''
  });
  
  // Generate CSS class based on animation options
  const generateAnimationClass = (): string => {
    // Base timing classes
    const timingMap = {
      'fast': 'duration-200',
      'normal': 'duration-300',
      'slow': 'duration-500',
      'very-slow': 'duration-1000'
    };
    
    // Animation type classes
    const typeMap = {
      'fade-in': 'animate-in fade-in',
      'fade-out': 'animate-out fade-out',
      'slide-up': 'animate-in slide-in-from-bottom',
      'slide-down': 'animate-in slide-in-from-top',
      'slide-left': 'animate-in slide-in-from-right',
      'slide-right': 'animate-in slide-in-from-left',
      'zoom-in': 'animate-in zoom-in',
      'zoom-out': 'animate-in zoom-out',
      'bounce': 'animate-bounce',
      'pulse': 'animate-pulse',
      'shake': 'animate-shake',
      'rotate-in': 'animate-in spin-in',
      'rotate-out': 'animate-in spin-out'
    };
    
    // Build the class string
    let classes = typeMap[options.type] || '';
    
    // Add timing
    if (options.timing && timingMap[options.timing]) {
      classes += ` ${timingMap[options.timing]}`;
    } else if (options.duration) {
      classes += ` duration-[${options.duration}ms]`;
    }
    
    // Add delay
    if (options.delay) {
      classes += ` delay-[${options.delay}ms]`;
    }
    
    // Add easing
    if (options.easing) {
      classes += ` ease-${options.easing}`;
    }
    
    // Add infinite
    if (options.infinite) {
      classes += ' infinite';
    }
    
    return classes;
  };
  
  // Trigger animation manually
  const triggerAnimation = (force: boolean = false) => {
    if (force || !state.hasAnimated || options.trigger === 'click') {
      setState({
        isAnimating: true,
        hasAnimated: true,
        animationClass: generateAnimationClass()
      });
      
      // Reset animation after it completes (unless infinite)
      if (!options.infinite && options.type !== 'bounce' && options.type !== 'pulse') {
        const duration = options.duration || 
          (options.timing === 'fast' ? 200 : 
           options.timing === 'slow' ? 500 : 
           options.timing === 'very-slow' ? 1000 : 300);
        
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isAnimating: false
          }));
        }, duration + (options.delay || 0));
      }
    }
  };
  
  // Handle mount animation
  useEffect(() => {
    if (options.trigger === 'mount') {
      triggerAnimation();
    }
  }, []);
  
  // Initialize animation class
  useEffect(() => {
    setState(prev => ({
      ...prev,
      animationClass: generateAnimationClass()
    }));
  }, [options.type, options.timing, options.delay, options.duration, options.easing]);
  
  return [state, triggerAnimation];
};