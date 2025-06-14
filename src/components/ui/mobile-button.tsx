// src/components/ui/mobile-button.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Option 1: Define ButtonProps using React's built-in types
interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  touchOptimized?: boolean;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const MobileButton = React.forwardRef<
  HTMLButtonElement,
  MobileButtonProps
>(
  (
    {
      className,
      touchOptimized = true,
      children,
      variant,
      size,
      asChild,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        className={cn(touchOptimized && 'min-h-[44px] min-w-[44px]', className)}
        variant={variant}
        size={size}
        asChild={asChild}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
MobileButton.displayName = 'MobileButton';
