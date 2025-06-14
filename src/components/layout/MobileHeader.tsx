// src/components/layout/MobileHeader.tsx
import React from 'react';
import { ArrowLeft, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MobileHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  backLabel?: string;
  showBack?: boolean;
  showClose?: boolean;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }>;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  className?: string;
  transparent?: boolean;
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
  backLabel,
  showBack = true,
  showClose = false,
  actions = [],
  primaryAction,
  className = '',
  transparent = false,
}) => {
  const hasActions = actions.length > 0;
  const leftAction = showClose ? onClose : showBack ? onBack : undefined;
  const LeftIcon = showClose ? X : ArrowLeft;

  return (
    <header
      className={`sticky top-0 z-40 ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'} ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
        {/* Left side - Back/Close button */}
        <div className="flex items-center min-w-0 flex-1">
          {leftAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={leftAction}
              className="mr-3 h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              aria-label={showClose ? 'Close' : backLabel || 'Go back'}
            >
              <LeftIcon size={18} />
            </Button>
          )}

          {/* Title section */}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 ml-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              size="sm"
              className="h-8 px-3 text-sm font-medium"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}

          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions.map((action, index) => (
                  <React.Fragment key={index}>
                    <DropdownMenuItem
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={
                        action.variant === 'destructive'
                          ? 'text-red-600 focus:text-red-600'
                          : ''
                      }
                    >
                      {action.icon && (
                        <span className="mr-2">{action.icon}</span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                    {index < actions.length - 1 &&
                      action.variant === 'destructive' && (
                        <DropdownMenuSeparator />
                      )}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};
