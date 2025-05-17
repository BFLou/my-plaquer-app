// src/components/plaques/VisitButton.tsx
import React, { useState } from 'react';
import { Plaque } from '@/types/plaque';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar } from 'lucide-react';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VisitButtonProps {
  plaque: Plaque;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  onVisitStateChange?: () => void;
}

const VisitButton: React.FC<VisitButtonProps> = ({
  plaque,
  variant = 'default',
  className = '',
  onVisitStateChange,
}) => {
  const { isPlaqueVisited, getVisitInfo, markAsVisited } = useVisitedPlaques();
  const [isLoading, setIsLoading] = useState(false);

  const isVisited = isPlaqueVisited(plaque.id);
  const visitInfo = isVisited ? getVisitInfo(plaque.id) : null;

  const formatVisitDate = () => {
    if (!visitInfo?.visited_at) return '';
    try {
      const visitDate = visitInfo.visited_at.toDate
        ? visitInfo.visited_at.toDate()
        : new Date(visitInfo.visited_at);
      return format(visitDate, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const handleToggleVisit = async () => {
    if (isVisited) {
      // If already visited, we could implement edit functionality here
      // For now, we just indicate it's already visited
      return;
    }
    
    setIsLoading(true);
    try {
      // Simply mark as visited with today's date
      await markAsVisited(plaque.id, {
        visitedAt: new Date().toISOString(),
      });
      
      toast.success("Plaque marked as visited");
      
      if (onVisitStateChange) {
        onVisitStateChange();
      }
    } catch (error) {
      console.error('Error marking as visited:', error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleToggleVisit}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
          Saving...
        </>
      ) : isVisited ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Visited ({formatVisitDate()})
        </>
      ) : (
        <>
          <Calendar className="mr-2 h-4 w-4" />
          Mark as Visited
        </>
      )}
    </Button>
  );
};

export default VisitButton;