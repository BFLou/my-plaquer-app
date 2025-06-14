import React from 'react';
import { Button } from '@/components/ui/button';

export type ActionBarButton = {
  label: string;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  icon?: React.ReactNode;
  onClick: () => void;
};

type ActionBarProps = {
  title: string;
  count: number;
  buttons: ActionBarButton[];
  onClearSelection?: () => void;
  className?: string;
};

export const ActionBar = ({
  title,
  count,
  buttons,
  onClearSelection,
  className = '',
}: ActionBarProps) => {
  if (count === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-20 ${className}`}
    >
      <div className="font-medium">
        {count} {title}
      </div>
      <div className="w-px h-6 bg-gray-200"></div>

      {onClearSelection && (
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      )}

      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || 'ghost'}
          size="sm"
          onClick={button.onClick}
          className={
            button.variant === 'destructive'
              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
              : ''
          }
        >
          {button.icon && <span className="mr-2">{button.icon}</span>}
          {button.label}
        </Button>
      ))}
    </div>
  );
};

export default ActionBar;
