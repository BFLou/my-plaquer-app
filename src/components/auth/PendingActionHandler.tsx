// src/components/auth/PendingActionHandler.tsx - Complete enhanced with navigation restoration
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PendingActionHandlerProps {
  onCollectionAction?: (plaqueId: number) => void;
}

export const PendingActionHandler: React.FC<PendingActionHandlerProps> = ({
  onCollectionAction
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { retrievePendingAction, restoreNavigation, clearStoredData } = useAuthGate();
  const { markAsVisited } = useVisitedPlaques();
  const { toggleFavorite } = useFavorites();

  useEffect(() => {
    // Only run when user becomes authenticated
    if (!user) return;

    const handlePostAuthFlow = async () => {
      console.log('🎯 PendingActionHandler: User authenticated, checking for pending actions...');
      
      // First, check for pending actions
      const pendingAction = retrievePendingAction();
      
      if (pendingAction) {
        console.log('🎯 Executing pending action:', pendingAction);

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
      }

      // Then, try to restore navigation context
      const restoredUrl = restoreNavigation();
      if (restoredUrl) {
        console.log('🔄 Restoring navigation to:', restoredUrl);
        
        // Small delay to ensure the action completed and DOM is ready
        setTimeout(() => {
          navigate(restoredUrl, { replace: true });
        }, 150); // Slightly longer delay for better UX
      } else if (pendingAction) {
        // If we had a pending action but no stored navigation context,
        // show a success message and stay where we are
        console.log('✅ Pending action completed, staying on current page');
      }

      // Clean up any remaining stored data
      setTimeout(() => {
        clearStoredData();
      }, 200); // Clean up after navigation
    };

    // Small delay to ensure all auth-dependent hooks are ready
    const timer = setTimeout(handlePostAuthFlow, 100);
    return () => clearTimeout(timer);
  }, [user, retrievePendingAction, restoreNavigation, clearStoredData, markAsVisited, toggleFavorite, onCollectionAction, navigate]);

  return null; // This is a logic-only component
};

export default PendingActionHandler;