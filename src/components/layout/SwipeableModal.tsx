// src/components/layout/SwipeableModal.tsx
import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SwipeableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  className?: string;
};

export const SwipeableModal: React.FC<SwipeableModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    
    if (modalRef.current) {
      if (diff > 100) {
        onClose();
      } else {
        modalRef.current.style.transform = 'translateY(0)';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 md:bg-opacity-30"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-hidden transform transition-transform duration-300 md:relative md:max-w-lg md:max-h-[80vh] md:rounded-2xl md:mx-4 ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </div>
  );
};