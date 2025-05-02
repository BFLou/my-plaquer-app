import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`py-16 text-center ${className}`}>
      <div className="bg-gray-50 max-w-md mx-auto rounded-xl p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <Icon className="text-blue-600" size={28} />
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="flex items-center gap-2 mx-auto">
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={onSecondaryAction} 
              className="flex items-center gap-2 mx-auto"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;