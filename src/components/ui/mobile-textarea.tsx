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