// src/components/ui/mobile-button.tsx
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends Omit<ButtonProps, 'children'> {
  children?: React.ReactNode;
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