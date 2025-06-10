// src/hooks/useSwipeGesture.ts
import { useState } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface SwipeGestureOptions {
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
  onSwipeStart?: (startX: number, startY: number) => void;
  onSwipeEnd?: (endX: number, endY: number) => void;
  threshold?: number; // Minimum distance to trigger swipe
  timeThreshold?: number; // Maximum time for swipe gesture
  preventScroll?: boolean; // Whether to prevent scrolling during swipe
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipe,
    onSwipeStart,
    onSwipeEnd,
    threshold = 50,
    timeThreshold = 300,
    preventScroll = false
  } = options;

  const [startCoords, setStartCoords] = useState({ x: 0, y: 0, time: 0 });
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const coords = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    setStartCoords(coords);
    setIsTracking(true);
    onSwipeStart?.(coords.x, coords.y);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTracking) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startCoords.x;
    const deltaY = endY - startCoords.y;
    const deltaTime = endTime - startCoords.time;

    // Check if gesture was fast enough
    if (deltaTime > timeThreshold) {
      setIsTracking(false);
      return;
    }

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if distance is above threshold
    if (distance < threshold) {
      setIsTracking(false);
      return;
    }

    // Determine direction
    let direction: SwipeDirection;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    onSwipe?.(direction, distance);
    onSwipeEnd?.(endX, endY);
    setIsTracking(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTracking) return;
    
    // Optionally prevent scrolling during swipe
    if (preventScroll) {
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    
    setStartCoords(coords);
    setIsTracking(true);
    onSwipeStart?.(coords.x, coords.y);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isTracking) return;

    const endX = e.clientX;
    const endY = e.clientY;
    const endTime = Date.now();

    const deltaX = endX - startCoords.x;
    const deltaY = endY - startCoords.y;
    const deltaTime = endTime - startCoords.time;

    // Check if gesture was fast enough
    if (deltaTime > timeThreshold) {
      setIsTracking(false);
      return;
    }

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if distance is above threshold
    if (distance < threshold) {
      setIsTracking(false);
      return;
    }

    // Determine direction
    let direction: SwipeDirection;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    onSwipe?.(direction, distance);
    onSwipeEnd?.(endX, endY);
    setIsTracking(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isTracking) return;
    
    // Optionally prevent default behavior during mouse drag
    if (preventScroll) {
      e.preventDefault();
    }
  };

  return {
    // Touch handlers
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    
    // Mouse handlers for desktop support
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    
    // State
    isTracking
  };
};