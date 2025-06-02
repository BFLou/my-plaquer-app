// src/components/auth/PendingActionHandler.tsx - Handles post-auth action execution
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';

interface PendingActionHandlerProps {
  onCollectionAction?: (plaqueId: number) => void;
}

export const PendingActionHandler: React.FC<PendingActionHandlerProps> = ({
  onCollectionAction
}) => {
  const { user } = useAuth();
  const { retrievePendingAction } = useAuthGate();
  const { markAsVisited } = useVisitedPlaques();
  const { toggleFavorite } = useFavorites();

  useEffect(() => {
    // Only run when user becomes authenticated
    if (!user) return;

    const handlePendingAction = async () => {
      const pendingAction = retrievePendingAction();
      if (!pendingAction) return;

      console.log('Executing pending action:', pendingAction);

      try {
        switch (pendingAction.type) {
          case 'mark-visited':
            await markAsVisited(pendingAction.plaqueId, pendingAction.data || {});
            toast.success('Plaque marked as visited!');
            break;

          case 'toggle-favorite':
            toggleFavorite(pendingAction.plaqueId);
            toast.success('Added to favorites!');
            break;

          case 'add-to-collection':
            if (onCollectionAction) {
              onCollectionAction(pendingAction.plaqueId);
              toast.success('Ready to add to collection!');
            }
            break;

          default:
            console.warn('Unknown pending action type:', pendingAction.type);
        }
      } catch (error) {
        console.error('Error executing pending action:', error);
        toast.error('Failed to complete your action. Please try again.');
      }
    };

    // Small delay to ensure all auth-dependent hooks are ready
    const timer = setTimeout(handlePendingAction, 100);
    return () => clearTimeout(timer);
  }, [user, retrievePendingAction, markAsVisited, toggleFavorite, onCollectionAction]);

  return null; // This is a logic-only component
};

export default PendingActionHandler;