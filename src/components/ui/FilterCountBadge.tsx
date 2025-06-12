// src/components/ui/FilterCountBadge.tsx
import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterCountBadgeProps {
  count: number;
  isActive: boolean;
  onClick: () => void;
  showPulse?: boolean;
  className?: string;
}

export const FilterCountBadge: React.FC<FilterCountBadgeProps> = ({
  count,
  isActive,
  onClick,
  showPulse = false,
  className
}) => {
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when count changes
  useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      setPrevCount(count);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [count, prevCount]);

  const getBadgeColor = () => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    if (count <= 2) return 'bg-blue-100 text-blue-700';
    if (count <= 4) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getButtonVariant = () => {
    return isActive ? 'default' : 'outline';
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      className={cn(
        "relative gap-2 transition-all duration-200",
        isActive && "shadow-md",
        showPulse && "animate-pulse",
        className
      )}
      onClick={onClick}
    >
      <Filter 
        size={16} 
        className={cn(
          "transition-transform duration-200",
          isAnimating && "scale-110"
        )}
      />
      
      <span className="hidden sm:inline">Filters</span>
      
      {count > 0 && (
        <Badge
          className={cn(
            "absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 text-xs font-bold",
            "flex items-center justify-center transition-all duration-300",
            getBadgeColor(),
            isAnimating && "scale-125 animate-bounce"
          )}
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
      
      {/* Subtle glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 rounded-md bg-blue-400/20 animate-pulse pointer-events-none" />
      )}
      
      {/* New filter indicator */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-md border-2 border-blue-400 animate-ping pointer-events-none" />
      )}
    </Button>
  );
};