// src/components/layout/FloatingActionButton.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FloatingActionButtonProps = {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'secondary';
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <Plus size={20} />,
  label,
  disabled = false,
  className = '',
  variant = 'default'
}) => {
  const baseClasses = `fixed bottom-20 right-4 z-40 shadow-lg hover:shadow-xl transition-all duration-200 md:hidden ${className}`;
  
  if (label) {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} h-12 px-4 rounded-full ${
          variant === 'default' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {icon}
        <span className="ml-2 font-medium">{label}</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} h-14 w-14 rounded-full ${
        variant === 'default' 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
    </Button>
  );
};