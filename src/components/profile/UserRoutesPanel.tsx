// src/components/profile/UserRoutesPanel.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRoutes } from '@/hooks/useRoutes';
import { toast } from 'sonner';
import RouteCard from '../routes/RouteCard';
import EditRouteForm from '../routes/EditRouteForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserRoutesPanelProps {
  routes: any[];
  showAll?: () => void;
  limit?: number;
}

const UserRoutesPanel: React.FC<UserRoutesPanelProps> = ({
  routes,
  showAll,
  limit = 3
}) => {
  const navigate = useNavigate();
  const { updateRoute, deleteRoute, createRoute } = useRoutes();
  
  // State for edit form
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);

  // Format distance and time
  const formatDistance = (distance: number) => `${distance.toFixed(1)} km`;
  const formatWalkingTime = (distance: number) => `~${Math.ceil(distance * 12)} min`;

  // Handle viewing a route
  const handleViewRoute = (route: any) => {
    navigate(`/routes/${route.id}`);
  };

  // Handle editing a route
  const handleEditRoute = (route: any) => {
    setRouteToEdit(route);
    setEditFormOpen(true);
  };

  // Handle saving route edits
  const handleSaveRoute = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!routeToEdit) return;

    try {
      setIsLoading(true);
      
      await updateRoute(routeToEdit.id, {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic
      });
      
      setEditFormOpen(false);
      setRouteToEdit(null);
      toast.success('Route updated successfully');
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle duplicating a route
  const handleDuplicateRoute = async (route: any) => {
    try {
      setIsLoading(true);
      
      // Create mock plaque objects from route points
      const mockPlaques = route.points.map(point => ({
        id: point.plaque_id,
        title: point.title,
        latitude: point.lat,
        longitude: point.lng
      }));
      
      // Create a new route with similar data
      const duplicatedRoute = await createRoute(
        `${route.name} (Copy)`,
        mockPlaques,
        route.total_distance,
        route.description || '',
        false // Make duplicate private by default
      );
      
      toast.success('Route duplicated successfully');
      
      // Navigate to the duplicated route
      if (duplicatedRoute) {
        navigate(`/routes/${duplicatedRoute.id}`);
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      toast.error('Failed to duplicate route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete route
  const handleDeleteRoute = (route: any) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

  // Confirm delete route
  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;

    try {
      setIsLoading(true);
      
      await deleteRoute(routeToDelete.id);
      
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
      toast.success('Route deleted successfully');
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    } finally {
      setIsLoading(false);
    }
  };

  // Get routes to display (limited)
  const routesToDisplay = routes.slice(0, limit);

  return (
    <>
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Route className="text-green-500" size={18} />
            My Routes
          </h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/discover?view=map')}
              className="gap-1"
            >
              <Plus size={14} />
              Create
            </Button>
            {showAll && routes.length > limit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={showAll}
                className="gap-1"
              >
                View All
              </Button>
            )}
          </div>
        </div>
        
        {routes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Route className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-600">No routes yet</h4>
            <p className="text-gray-500 mb-4">Create walking routes to explore multiple plaques in one trip</p>
            <Button 
              onClick={() => navigate('/discover?view=map')}
              size="sm"
            >
              Create Your First Route
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {routesToDisplay.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                onView={handleViewRoute}
                onEdit={handleEditRoute}
                onDuplicate={handleDuplicateRoute}
                onDelete={handleDeleteRoute}
              />
            ))}
            
            {routes.length > limit && showAll && (
              <Button
                variant="ghost"
                className="w-full justify-center text-sm text-gray-600 hover:text-green-600"
                onClick={showAll}
              >
                View All {routes.length} Routes
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Route Form */}
      <EditRouteForm
        isOpen={editFormOpen}
        onClose={() => {
          setEditFormOpen(false);
          setRouteToEdit(null);
        }}
        onSave={handleSaveRoute}
        route={routeToEdit}
        isSaving={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{routeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRoute}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Route'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserRoutesPanel;