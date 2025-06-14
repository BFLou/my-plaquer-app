import React from 'react';
import { cn } from '@/lib/utils';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  preventZoom?: boolean;
}

export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type, preventZoom = true, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{
          fontSize: preventZoom ? '16px' : undefined,
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
MobileInput.displayName = 'MobileInput';
