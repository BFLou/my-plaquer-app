// src/components/ui/mobile-dialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface MobileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const MobileDialog: React.FC<MobileDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-[95vw] max-w-[400px]',
    md: 'w-[95vw] max-w-[600px]',
    lg: 'w-[95vw] max-w-[800px]',
    xl: 'w-[95vw] max-w-[1000px]',
    full: 'w-[95vw] max-w-[95vw]'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] overflow-auto",
          className
        )}
      >
        {(title || description) && (
          <DialogHeader className="space-y-2">
            {title && (
              <DialogTitle className="text-lg sm:text-xl leading-tight">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-sm sm:text-base">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        
        <div className="py-2">
          {children}
        </div>
        
        {footer && (
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
