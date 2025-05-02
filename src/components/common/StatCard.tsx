import React, { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  subValue?: string; 
  icon?: ReactNode;
  className?: string;
};

export const StatCard = ({ 
  label, 
  value, 
  subValue, 
  icon,
  className = '' 
}: StatCardProps) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">{label}</div>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{value}</div>
            {subValue && (
              <span className="ml-1 text-sm font-normal text-gray-500">{subValue}</span>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;