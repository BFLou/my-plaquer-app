// src/components/settings/SettingsCard.tsx - Updated for better consistency
import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  className,
  footer,
  icon
}) => {
  return (
    <div className={cn("border-b last:border-b-0", className)}>
      <div className="p-6">
        {/* Header with optional icon */}
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {/* Content with better spacing */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
      
      {/* Footer with consistent styling */}
      {footer && (
        <div className="px-6 pb-6 pt-0">
          <div className="pt-4 border-t border-gray-100">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsCard;