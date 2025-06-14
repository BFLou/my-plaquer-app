// src/components/layout/BottomActionBar.tsx
import React from 'react';

type BottomActionBarProps = {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'transparent';
};

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  children,
  className = '',
  background = 'white',
}) => {
  const bgClasses = {
    white: 'bg-white border-t border-gray-200',
    gray: 'bg-gray-50 border-t border-gray-200',
    transparent: 'bg-transparent',
  };

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 z-30 ${bgClasses[background]} p-4 safe-area-pb md:hidden ${className}`}
    >
      <div className="flex gap-3">{children}</div>
    </div>
  );
};
