// src/components/layout/MobileBreadcrumb.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
  active?: boolean;
};

type MobileBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  showOnDesktop?: boolean;
};

export const MobileBreadcrumb: React.FC<MobileBreadcrumbProps> = ({
  items,
  className = '',
  showOnDesktop = false
}) => {
  if (items.length === 0) return null;

  // On mobile, only show the last 2 items to save space
  const displayItems = items.length > 2 ? items.slice(-2) : items;

  return (
    <nav className={`${showOnDesktop ? '' : 'md:hidden'} ${className}`}>
      <div className="flex items-center space-x-1 text-sm text-gray-500 px-4 py-2">
        {items.length > 2 && (
          <>
            <span>...</span>
            <ChevronRight size={14} className="text-gray-400" />
          </>
        )}
        {displayItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className={`hover:text-gray-700 transition-colors ${
                  item.active ? 'text-gray-900 font-medium' : ''
                }`}
              >
                {item.label}
              </button>
            ) : (
              <span className={item.active ? 'text-gray-900 font-medium' : ''}>
                {item.label}
              </span>
            )}
            {index < displayItems.length - 1 && (
              <ChevronRight size={14} className="text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};