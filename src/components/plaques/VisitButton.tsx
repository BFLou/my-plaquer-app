// src/components/plaques/VisitButton.tsx
import React, { useState } from 'react';
import { Plaque } from '@/types/plaque';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, Calendar } from 'lucide-react';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import VisitLogger from './VisitLogger';
import EditVisitDialog from './EditVisitDialog';
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
  const [showVisitLogger, setShowVisitLogger] = useState(false);
  const [showEditVisit, setShowEditVisit] = useState(false);

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
      setShowEditVisit(true);
    } else {
      try {
        await markAsVisited(plaque.id, {
          visitedAt: new Date().toISOString(),
        });
        toast.success('Marked as visited today');
        onVisitStateChange?.();
      } catch (error) {
        console.error('Error marking as visited:', error);
        toast.error('Failed to mark as visited');
      }
    }
  };

  const handleVisitLogged = async (visitData: any) => {
    try {
      await markAsVisited(plaque.id, {
        notes: visitData.notes,
        photos: visitData.photos,
        visitedAt: visitData.visited_at,
        rating: visitData.rating,
        location: visitData.location,
        achievement: visitData.achievement,
      });
      onVisitStateChange?.();
    } catch (error) {
      console.error('Error logging visit:', error);
      toast.error('Failed to log visit');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleToggleVisit}
      >
        {isVisited ? (
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

      {showVisitLogger && (
        <VisitLogger
          isOpen={showVisitLogger}
          onClose={() => setShowVisitLogger(false)}
          plaque={plaque}
          onVisitLogged={handleVisitLogged}
        />
      )}

      {showEditVisit && visitInfo?.id && (
        <EditVisitDialog
          isOpen={showEditVisit}
          onClose={() => setShowEditVisit(false)}
          plaque={plaque}
          visitId={visitInfo.id}
          onVisitUpdated={onVisitStateChange || (() => {})}
          onVisitDeleted={onVisitStateChange}
        />
      )}
    </>
  );
};

export default VisitButton;