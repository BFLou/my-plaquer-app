// src/components/plaques/VisitButton.tsx
import React, { useState } from 'react';
import { Plaque } from '@/types/plaque';
import { Button } from "@/components/ui/button";
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
  onVisitStateChange
}) => {
  const { isPlaqueVisited, getVisitInfo, markAsVisited } = useVisitedPlaques();
  const [showVisitLogger, setShowVisitLogger] = useState(false);
  const [showEditVisit, setShowEditVisit] = useState(false);
  
  const isVisited = isPlaqueVisited(plaque.id);
  const visitInfo = isVisited ? getVisitInfo(plaque.id) : null;
  
  // Format the visit date
  const formatVisitDate = () => {
    if (!visitInfo?.visited_at) return '';
    
    try {
      // Handle both Timestamp and Date objects
      const visitDate = visitInfo.visited_at.toDate ? 
        visitInfo.visited_at.toDate() : 
        new Date(visitInfo.visited_at);
        
      return format(visitDate, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Handle toggling the visit state directly
  const handleToggleVisit = async () => {
    if (isVisited) {
      setShowEditVisit(true);
    } else {
      // Mark as visited with current date
      try {
        await markAsVisited(plaque.id, {
          visitedAt: new Date().toISOString() // Use current date
        });
        
        if (onVisitStateChange) {
          onVisitStateChange();
        }
        
        // Fix: Use a string for toast message instead of an object
        toast.success('Marked as visited today');
      } catch (error) {
        console.error('Error marking as visited:', error);
        toast.error('Failed to mark as visited');
      }
    }
  };
  
  // Handle opening the visit logger
  const handleOpenVisitLogger = () => {
    setShowVisitLogger(true);
  };
  
  // Handle logging a new visit
  const handleVisitLogged = async (visitData: any) => {
    try {
      await markAsVisited(plaque.id, {
        notes: visitData.notes,
        photos: visitData.photos,
        visitedAt: visitData.visited_at,
        rating: visitData.rating,
        location: visitData.location,
        achievement: visitData.achievement
      });
      
      if (onVisitStateChange) {
        onVisitStateChange();
      }
    } catch (error) {
      console.error('Error logging visit:', error);
      toast.error('Failed to log visit');
    }
  };
  
  // Render a button with contextual menu for visited plaques
  if (isVisited) {
    return (
      <>
        <div className="relative inline-block">
          <Button 
            variant={variant} 
            className={`${className} flex items-center gap-2`}
            onClick={handleToggleVisit}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Visited</span>
          </Button>
          
          {/* Show visit date below the button */}
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatVisitDate()}
          </div>
        </div>
        
        {/* Edit visit dialog */}
        <EditVisitDialog
          isOpen={showEditVisit}
          onClose={() => setShowEditVisit(false)}
          plaque={plaque}
          visitId={visitInfo?.id || null}
          onVisitUpdated={() => {
            if (onVisitStateChange) onVisitStateChange();
          }}
          onVisitDeleted={() => {
            if (onVisitStateChange) onVisitStateChange();
          }}
        />
      </>
    );
  }
  
  // For unvisited plaques, show a dropdown with options
  return (
    <>
      <div className="relative inline-block">
        <div className="flex gap-2">
          <Button 
            variant={variant} 
            className={`${className} flex items-center gap-2`}
            onClick={handleToggleVisit}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark as Visited</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleOpenVisitLogger}
            className="h-9 w-9"
            title="Log with details"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Visit logger dialog */}
      <VisitLogger
        plaque={plaque}
        isOpen={showVisitLogger}
        onClose={() => setShowVisitLogger(false)}
        onVisitLogged={handleVisitLogged}
        verifyLocation={false} // No location verification by default
      />
    </>
  );
};

export default VisitButton;