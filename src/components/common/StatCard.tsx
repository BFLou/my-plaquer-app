// src/components/common/StatCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  className
}) => {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm p-4",
      className
    )}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="bg-gray-50 p-3 rounded-lg">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold">{value}</h3>
            {subValue && <span className="text-gray-500 text-sm">{subValue}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;