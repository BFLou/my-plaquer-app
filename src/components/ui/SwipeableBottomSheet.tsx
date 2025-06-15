// src/components/ui/SwipeableBottomSheet.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSafeArea } from '@/hooks/useSafeArea';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints: number[]; // Array of percentages [0.1, 0.4, 0.9]
  initialSnap?: number; // Index of initial snap point
  peekContent?: React.ReactNode;
  fullContent: React.ReactNode;
  className?: string;
  enableSwipeToClose?: boolean;
  minHeight?: number;
}

type SnapState = 'closed' | 'peek' | 'partial' | 'full';

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  isOpen,
  onClose,
  snapPoints = [0.1, 0.4, 0.9],
  initialSnap = 0,
  peekContent,
  fullContent,
  className = '',
  enableSwipeToClose = true,
  minHeight = 100
}) => {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const safeArea = useSafeArea();

  // Calculate actual heights from percentages
  const getSnapHeight = useCallback((snapIndex: number) => {
    const viewportHeight = window.innerHeight;
    const percentage = snapPoints[snapIndex] || 0;
    return Math.max(minHeight, viewportHeight * percentage);
  }, [snapPoints, minHeight]);

  // Get the current state based on snap point
  const getSnapState = useCallback((): SnapState => {
    if (!isOpen) return 'closed';
    if (currentSnap === 0) return 'peek';
    if (currentSnap === snapPoints.length - 1) return 'full';
    return 'partial';
  }, [isOpen, currentSnap, snapPoints.length]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isOpen) return;
    
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setIsDragging(true);
    triggerHapticFeedback('light');
  }, [isOpen]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    const currentHeight = getSnapHeight(currentSnap);
    const newHeight = Math.max(minHeight, currentHeight - deltaY);
    
    setCurrentY(touch.clientY);
    
    // Apply the transform
    if (sheetRef.current) {
      const maxHeight = window.innerHeight * snapPoints[snapPoints.length - 1];
      const clampedHeight = Math.min(newHeight, maxHeight);
      sheetRef.current.style.height = `${clampedHeight}px`;
    }
  }, [isDragging, startY, currentSnap, getSnapHeight, minHeight, snapPoints]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const velocity = Math.abs(deltaY);
    const direction = deltaY > 0 ? 'down' : 'up';
    
    setIsDragging(false);
    
    // Determine new snap point based on gesture
    let newSnapIndex = currentSnap;
    
    if (velocity > 50) {
      // Fast swipe
      if (direction === 'down' && currentSnap > 0) {
        newSnapIndex = currentSnap - 1;
      } else if (direction === 'up' && currentSnap < snapPoints.length - 1) {
        newSnapIndex = currentSnap + 1;
      }
    } else {
      // Slow drag - snap to nearest
      const currentHeight = sheetRef.current?.offsetHeight || getSnapHeight(currentSnap);
      let closestSnap = 0;
      let closestDistance = Infinity;
      
      snapPoints.forEach((_, index) => {
        const snapHeight = getSnapHeight(index);
        const distance = Math.abs(currentHeight - snapHeight);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnap = index;
        }
      });
      
      newSnapIndex = closestSnap;
    }
    
    // Check if should close
    if (enableSwipeToClose && newSnapIndex === 0 && direction === 'down' && velocity > 100) {
      onClose();
      return;
    }
    
    // Animate to new snap point
    setCurrentSnap(newSnapIndex);
    triggerHapticFeedback('medium');
  }, [isDragging, currentY, startY, currentSnap, snapPoints.length, getSnapHeight, enableSwipeToClose, onClose]);

  // Animate to snap point
  useEffect(() => {
    if (!sheetRef.current || isDragging) return;
    
    const targetHeight = getSnapHeight(currentSnap);
    sheetRef.current.style.height = `${targetHeight}px`;
    sheetRef.current.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const cleanup = setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
      }
    }, 300);
    
    return () => clearTimeout(cleanup);
  }, [currentSnap, getSnapHeight, isDragging]);

  // Handle open/close
  useEffect(() => {
    if (isOpen && currentSnap === 0) {
      // Open to initial snap
      setCurrentSnap(initialSnap);
    } else if (!isOpen) {
      setCurrentSnap(0);
    }
  }, [isOpen, initialSnap]);

  if (!isOpen) return null;

  const snapState = getSnapState();
  const showFullContent = snapState === 'partial' || snapState === 'full';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[998] bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        style={{
          opacity: snapState === 'peek' ? 0 : 1,
          pointerEvents: snapState === 'peek' ? 'none' : 'auto'
        }}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 ${className}`}
        style={{
          height: getSnapHeight(currentSnap),
          paddingBottom: safeArea.bottom,
          willChange: 'height',
          contain: 'layout'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showFullContent ? (
            <div className="h-full overflow-y-auto">
              {fullContent}
            </div>
          ) : (
            <div className="h-full">
              {peekContent}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Hook for easier usage
export const useSwipeableBottomSheet = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};