// ============================================================================
// 1. MOBILE TEXTAREA COMPONENT
// ============================================================================

// src/components/ui/mobile-textarea.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  preventZoom?: boolean;
}

export const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, preventZoom = true, style, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          fontSize: preventZoom ? '16px' : undefined,
          ...style
        }}
        ref={ref}
        {...props}
      />
    )
  }
);
MobileTextarea.displayName = "MobileTextarea";

// ============================================================================
// 2. MOBILE BUTTON COMPONENT WITH PROPER TOUCH TARGETS
// ============================================================================

// src/components/ui/mobile-button.tsx
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

export const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, touchOptimized = true, children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          touchOptimized && "min-h-[44px] min-w-[44px]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    )
  }
);
MobileButton.displayName = "MobileButton";

// ============================================================================
// 3. MOBILE RESPONSIVE DIALOG
// ============================================================================

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

// ============================================================================
// 4. MOBILE HAPTIC FEEDBACK UTILITY
// ============================================================================

// src/utils/mobileHaptics.ts
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export const triggerHapticFeedback = (type: HapticType = 'light') => {
  // Check if device supports haptic feedback
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

  // For iOS devices with haptic feedback API
  if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
    try {
      // This would require iOS specific implementation
      // For now, we'll just use the vibration API fallback
    } catch (error) {
      console.debug('iOS haptic feedback not available:', error);
    }
  }
};