// src/hooks/useEnhancedGestures.ts
import { useCallback, useRef, useEffect } from 'react';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

export type GestureType = 'swipe' | 'pinch' | 'tap' | 'longpress' | 'drag';

export interface GestureEvent {
  type: GestureType;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
  center?: { x: number; y: number };
  target?: HTMLElement;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

export interface GestureOptions {
  // Swipe options
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  
  // Pinch options
  pinchThreshold?: number;
  
  // Tap options
  tapTimeout?: number;
  doubleTapTimeout?: number;
  
  // Long press options
  longPressDelay?: number;
  longPressMoveThreshold?: number;
  
  // Drag options
  dragThreshold?: number;
  dragDelay?: number;
  
  // General options
  enableHaptics?: boolean;
  preventDefaults?: boolean;
}

export interface GestureHandlers {
  onSwipe?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onTap?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onDragStart?: (event: GestureEvent) => void;
  onDrag?: (event: GestureEvent) => void;
  onDragEnd?: (event: GestureEvent) => void;
}

const DEFAULT_OPTIONS: Required<GestureOptions> = {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.5,
  pinchThreshold: 0.1,
  tapTimeout: 300,
  doubleTapTimeout: 400,
  longPressDelay: 500,
  longPressMoveThreshold: 10,
  dragThreshold: 5,
  dragDelay: 150,
  enableHaptics: true,
  preventDefaults: false
};

export const useEnhancedGestures = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers,
  options: Partial<GestureOptions> = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const mobile = isMobile();
  
  // Touch state tracking
  const touchState = useRef({
    touches: new Map<number, Touch>(),
    startTime: 0,
    startDistance: 0,
    lastDistance: 0,
    scale: 1,
    center: { x: 0, y: 0 },
    isDragging: false,
    longPressTimer: null as NodeJS.Timeout | null,
    tapCount: 0,
    lastTapTime: 0,
    preventNextTap: false
  });

  // Helper functions
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  const getSwipeDirection = (startTouch: Touch, endTouch: Touch): 'up' | 'down' | 'left' | 'right' => {
    const dx = endTouch.clientX - startTouch.clientX;
    const dy = endTouch.clientY - startTouch.clientY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  };

  const getSwipeDistance = (startTouch: Touch, endTouch: Touch): number => {
    const dx = endTouch.clientX - startTouch.clientX;
    const dy = endTouch.clientY - startTouch.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    if (opts.enableHaptics && mobile) {
      triggerHapticFeedback(type);
    }
  };

  const clearLongPressTimer = () => {
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  };

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (opts.preventDefaults) {
      event.preventDefault();
    }

    const touches = Array.from(event.touches);
    const currentTime = Date.now();
    
    // Store all touches
    touchState.current.touches.clear();
    touches.forEach(touch => {
      touchState.current.touches.set(touch.identifier, touch);
    });
    
    touchState.current.startTime = currentTime;
    touchState.current.isDragging = false;
    touchState.current.preventNextTap = false;

    if (touches.length === 1) {
      // Single touch - potential tap, long press, or drag
      const touch = touches[0];
      
      // Set up long press timer
      if (handlers.onLongPress) {
        touchState.current.longPressTimer = setTimeout(() => {
          const currentTouch = touchState.current.touches.get(touch.identifier);
          if (currentTouch) {
            const moveDistance = getSwipeDistance(touch, currentTouch);
            if (moveDistance < opts.longPressMoveThreshold) {
              triggerHaptic('medium');
              touchState.current.preventNextTap = true;
              handlers.onLongPress?.({
                type: 'longpress',
                center: { x: currentTouch.clientX, y: currentTouch.clientY },
                target: event.target as HTMLElement
              });
            }
          }
        }, opts.longPressDelay);
      }
      
    } else if (touches.length === 2) {
      // Two touches - potential pinch
      clearLongPressTimer();
      const [touch1, touch2] = touches;
      touchState.current.startDistance = getDistance(touch1, touch2);
      touchState.current.lastDistance = touchState.current.startDistance;
      touchState.current.center = getCenter(touch1, touch2);
      touchState.current.scale = 1;
    }
  }, [handlers, opts]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (opts.preventDefaults) {
      event.preventDefault();
    }

    const touches = Array.from(event.touches);
    
    if (touches.length === 1) {
      // Single touch movement
      const touch = touches[0];
      const originalTouch = Array.from(touchState.current.touches.values())[0];
      
      if (originalTouch) {
        const moveDistance = getSwipeDistance(originalTouch, touch);
        
        // Cancel long press if moved too much
        if (moveDistance > opts.longPressMoveThreshold) {
          clearLongPressTimer();
        }
        
        // Check if we should start dragging
        if (!touchState.current.isDragging && moveDistance > opts.dragThreshold) {
          touchState.current.isDragging = true;
          triggerHaptic('light');
          
          handlers.onDragStart?.({
            type: 'drag',
            center: { x: touch.clientX, y: touch.clientY },
            distance: moveDistance,
            target: event.target as HTMLElement
          });
        }
        
        // Continue dragging
        if (touchState.current.isDragging) {
          handlers.onDrag?.({
            type: 'drag',
            center: { x: touch.clientX, y: touch.clientY },
            distance: moveDistance,
            target: event.target as HTMLElement
          });
        }
      }
      
    } else if (touches.length === 2) {
      // Two touch movement - pinch gesture
      const [touch1, touch2] = touches;
      const currentDistance = getDistance(touch1, touch2);
      const newScale = currentDistance / touchState.current.startDistance;
      const scaleDelta = newScale - touchState.current.scale;
      
      // Only trigger pinch if significant change
      if (Math.abs(scaleDelta) > opts.pinchThreshold) {
        touchState.current.scale = newScale;
        touchState.current.center = getCenter(touch1, touch2);
        
        handlers.onPinch?.({
          type: 'pinch',
          scale: newScale,
          center: touchState.current.center,
          target: event.target as HTMLElement
        });
      }
    }
    
    // Update stored touches
    touches.forEach(touch => {
      touchState.current.touches.set(touch.identifier, touch);
    });
  }, [handlers, opts]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (opts.preventDefaults) {
      event.preventDefault();
    }

    const endTime = Date.now();
    const duration = endTime - touchState.current.startTime;
    const remainingTouches = Array.from(event.touches);
    const changedTouches = Array.from(event.changedTouches);
    
    clearLongPressTimer();

    if (remainingTouches.length === 0) {
      // All touches ended
      if (touchState.current.isDragging) {
        // End drag
        const lastTouch = changedTouches[0];
        if (lastTouch) {
          handlers.onDragEnd?.({
            type: 'drag',
            center: { x: lastTouch.clientX, y: lastTouch.clientY },
            target: event.target as HTMLElement
          });
        }
        touchState.current.isDragging = false;
        
      } else if (changedTouches.length === 1 && !touchState.current.preventNextTap) {
        // Single tap
        const touch = changedTouches[0];
        const originalTouch = Array.from(touchState.current.touches.values())[0];
        
        if (originalTouch && duration < opts.tapTimeout) {
          const moveDistance = getSwipeDistance(originalTouch, touch);
          
          if (moveDistance < opts.dragThreshold) {
            // Valid tap
            const currentTime = Date.now();
            const timeSinceLastTap = currentTime - touchState.current.lastTapTime;
            
            if (timeSinceLastTap < opts.doubleTapTimeout && touchState.current.tapCount === 1) {
              // Double tap
              touchState.current.tapCount = 0;
              triggerHaptic('medium');
              handlers.onDoubleTap?.({
                type: 'tap',
                center: { x: touch.clientX, y: touch.clientY },
                target: event.target as HTMLElement
              });
            } else {
              // Single tap (with delay to detect potential double tap)
              touchState.current.tapCount = 1;
              touchState.current.lastTapTime = currentTime;
              
              setTimeout(() => {
                if (touchState.current.tapCount === 1) {
                  touchState.current.tapCount = 0;
                  triggerHaptic('light');
                  handlers.onTap?.({
                    type: 'tap',
                    center: { x: touch.clientX, y: touch.clientY },
                    target: event.target as HTMLElement
                  });
                }
              }, handlers.onDoubleTap ? opts.doubleTapTimeout : 0);
            }
          } else {
            // Movement was too much - might be a swipe
            const direction = getSwipeDirection(originalTouch, touch);
            const velocity = moveDistance / duration;
            
            if (moveDistance > opts.swipeThreshold && velocity > opts.swipeVelocityThreshold) {
              triggerHaptic('medium');
              handlers.onSwipe?.({
                type: 'swipe',
                direction,
                distance: moveDistance,
                center: { x: touch.clientX, y: touch.clientY },
                target: event.target as HTMLElement
              });
            }
          }
        }
      }
      
      // Reset state
      touchState.current.touches.clear();
    }
  }, [handlers, opts]);

  // Mouse event handlers for desktop fallback
  const handleMouseEvents = useCallback(() => {
    if (mobile) return; // Only use mouse events on desktop
    
    let mouseDown = false;
    let startPos = { x: 0, y: 0 };
    let startTime = 0;
    
    const handleMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      startPos = { x: event.clientX, y: event.clientY };
      startTime = Date.now();
      
      // Simulate touch start for consistency
      if (handlers.onDragStart) {
        setTimeout(() => {
          if (mouseDown) {
            handlers.onDragStart?.({
              type: 'drag',
              center: startPos,
              target: event.target as HTMLElement
            });
          }
        }, opts.dragDelay);
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return;
      
      const currentPos = { x: event.clientX, y: event.clientY };
      const distance = Math.sqrt(
        Math.pow(currentPos.x - startPos.x, 2) + 
        Math.pow(currentPos.y - startPos.y, 2)
      );
      
      if (distance > opts.dragThreshold) {
        handlers.onDrag?.({
          type: 'drag',
          center: currentPos,
          distance,
          target: event.target as HTMLElement
        });
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      if (!mouseDown) return;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endPos = { x: event.clientX, y: event.clientY };
      const distance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + 
        Math.pow(endPos.y - startPos.y, 2)
      );
      
      mouseDown = false;
      
      if (distance < opts.dragThreshold && duration < opts.tapTimeout) {
        // Click/tap
        handlers.onTap?.({
          type: 'tap',
          center: endPos,
          target: event.target as HTMLElement
        });
      } else if (handlers.onDragEnd) {
        // End drag
        handlers.onDragEnd({
          type: 'drag',
          center: endPos,
          distance,
          target: event.target as HTMLElement
        });
      }
    };
    
    return { handleMouseDown, handleMouseMove, handleMouseUp };
  }, [handlers, opts, mobile]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (mobile) {
      // Touch events for mobile
      element.addEventListener('touchstart', handleTouchStart, { passive: !opts.preventDefaults });
      element.addEventListener('touchmove', handleTouchMove, { passive: !opts.preventDefaults });
      element.addEventListener('touchend', handleTouchEnd, { passive: !opts.preventDefaults });
      element.addEventListener('touchcancel', handleTouchEnd, { passive: !opts.preventDefaults });
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
      };
    } else {
      // Mouse events for desktop
      const mouseHandlers = handleMouseEvents();
      if (mouseHandlers) {
        const { handleMouseDown, handleMouseMove, handleMouseUp } = mouseHandlers;
        
        element.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
          element.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseEvents, mobile, opts.preventDefaults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  return {
    isGestureActive: touchState.current.isDragging,
    gestureState: touchState.current
  };
};

// Specialized hook for map gestures
export const useMapGestures = (
  mapRef: React.RefObject<HTMLElement>,
  options: {
    onMapSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onMapPinch?: (scale: number, center: { x: number; y: number }) => void;
    onMapTap?: (center: { x: number; y: number }) => void;
    onMapLongPress?: (center: { x: number; y: number }) => void;
    onControlPanelSwipe?: (direction: 'up' | 'down') => void;
  }
) => {
  const mobile = isMobile();
  
  return useEnhancedGestures(
    mapRef,
    {
      onSwipe: (event) => {
        if (event.direction && options.onMapSwipe) {
          options.onMapSwipe(event.direction);
        }
        
        // Special handling for control panel swipes
        if ((event.direction === 'up' || event.direction === 'down') && options.onControlPanelSwipe) {
          options.onControlPanelSwipe(event.direction);
        }
      },
      
      onPinch: (event) => {
        if (event.scale && event.center && options.onMapPinch) {
          options.onMapPinch(event.scale, event.center);
        }
      },
      
      onTap: (event) => {
        if (event.center && options.onMapTap) {
          options.onMapTap(event.center);
        }
      },
      
      onLongPress: (event) => {
        if (event.center && options.onMapLongPress) {
          options.onMapLongPress(event.center);
        }
      }
    },
    {
      enableHaptics: true,
      swipeThreshold: mobile ? 40 : 60,
      longPressDelay: 600,
      preventDefaults: false // Let map handle some defaults
    }
  );
};

export default useEnhancedGestures;