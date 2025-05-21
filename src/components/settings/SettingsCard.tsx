// src/components/settings/SettingsCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  className,
  footer
}) => {
  return (
    <div className={cn("border-b last:border-b-0", className)}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-4">{description}</p>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
      {footer && (
        <div className="px-6 pb-6">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;