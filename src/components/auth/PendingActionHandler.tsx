// src/components/auth/PendingActionHandler.tsx - Enhanced with route saving support
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useRoutes } from '@/hooks/useRoutes';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PendingActionHandlerProps {
  onCollectionAction?: (plaqueId: number) => void;
  onRouteAction?: (routeData: any) => void;
}

export const PendingActionHandler: React.FC<PendingActionHandlerProps> = ({
  onCollectionAction,
  onRouteAction
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { retrievePendingAction, restoreNavigation, clearStoredData } = useAuthGate();
  const { markAsVisited } = useVisitedPlaques();
  const { toggleFavorite } = useFavorites();
  const { createRoute } = useRoutes ? useRoutes() : { createRoute: null };

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
              if (pendingAction.plaqueId) {
                await markAsVisited(pendingAction.plaqueId, pendingAction.data || {});
                toast.success('Plaque marked as visited!');
              }
              break;

            case 'toggle-favorite':
              if (pendingAction.plaqueId) {
                toggleFavorite(pendingAction.plaqueId);
                toast.success('Added to favorites!');
              }
              break;

            case 'add-to-collection':
              if (pendingAction.plaqueId && onCollectionAction) {
                onCollectionAction(pendingAction.plaqueId);
                toast.success('Ready to add to collection!');
              }
              break;

            case 'save-route':
              if (pendingAction.routeData) {
                if (onRouteAction) {
                  // Delegate to parent component (e.g., MapContainer)
                  onRouteAction(pendingAction.routeData);
                  toast.success('Ready to save route!');
                } else if (createRoute && pendingAction.routeData.points?.length >= 2) {
                  // Handle route creation directly if possible
                  try {
                    await createRoute(
                      pendingAction.routeData.name || `Route ${new Date().toLocaleDateString()}`,
                      pendingAction.routeData.description || '',
                      pendingAction.routeData.points,
                      pendingAction.routeData.distance || 0
                    );
                    toast.success('Route saved successfully!');
                  } catch (error) {
                    console.error('Error saving route:', error);
                    toast.error('Failed to save route. Please try again.');
                  }
                }
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
        }, 150);
      } else if (pendingAction) {
        // If we had a pending action but no stored navigation context,
        // show a success message and stay where we are
        console.log('✅ Pending action completed, staying on current page');
      }

      // Clean up any remaining stored data
      setTimeout(() => {
        clearStoredData();
      }, 200);
    };

    // Small delay to ensure all auth-dependent hooks are ready
    const timer = setTimeout(handlePostAuthFlow, 100);
    return () => clearTimeout(timer);
  }, [user, retrievePendingAction, restoreNavigation, clearStoredData, markAsVisited, toggleFavorite, onCollectionAction, onRouteAction, createRoute, navigate]);

  return null; // This is a logic-only component
};

export default PendingActionHandler;