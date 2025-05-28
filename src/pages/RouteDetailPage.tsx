// src/pages/RouteDetailPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  List as ListIcon, 
  Map as MapIcon,
  Navigation,
  Download,
  Share,
  Clock,
  Trash2
} from 'lucide-react';
import { PageContainer } from "@/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRoutes } from '@/hooks/useRoutes';
import { usePlaques } from '@/hooks/usePlaques';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import RouteDetailHeader from '../components/routes/RouteDetailHeader';
import EditRouteForm from '../components/routes/EditRouteForm';
import { MapContainer } from "../components/maps/MapContainer";
import { RouteStats } from '../components/routes/RouteStats';
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

const RouteDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRoute, updateRoute, deleteRoute } = useRoutes();
  const { plaques } = usePlaques();
  const mapRef = useRef(null);
  
  // State
  const [route, setRoute] = useState(null);
  const [routePlaques, setRoutePlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load route data
  useEffect(() => {
    const loadRoute = async () => {
      if (!id || !user) {
        setError('Route ID or user not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const routeData = await getRoute(id);
        
        if (!routeData) {
          setError('Route not found');
          setLoading(false);
          return;
        }

        setRoute(routeData);

        // Get plaque details for route points
        if (routeData.points && routeData.points.length > 0) {
          const plaqueIds = routeData.points.map(point => point.plaque_id);
          const matchedPlaques = plaques.filter(plaque => 
            plaqueIds.includes(plaque.id)
          ).map(plaque => ({
            ...plaque,
            // Add order from route points
            order: routeData.points.find(p => p.plaque_id === plaque.id)?.order || 0
          })).sort((a, b) => a.order - b.order);
          
          setRoutePlaques(matchedPlaques);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading route:', err);
        setError('Failed to load route');
        setLoading(false);
      }
    };

    loadRoute();
  }, [id, user, getRoute, plaques]);

  // Handle route update
  const handleUpdateRoute = async (data) => {
    if (!route) return;

    try {
      setIsLoading(true);
      await updateRoute(route.id, {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic
      });
      
      setRoute(prev => ({
        ...prev,
        name: data.name,
        description: data.description,
        is_public: data.isPublic
      }));
      
      setEditFormOpen(false);
      toast.success('Route updated successfully');
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle route deletion
  const handleDeleteRoute = async () => {
    if (!route) return;

    try {
      setIsLoading(true);
      await deleteRoute(route.id);
      toast.success('Route deleted successfully');
      navigate('/routes');
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle route duplication
  const handleDuplicateRoute = async () => {
    if (!route) return;
    
    try {
      setIsLoading(true);
      // Implementation would depend on your createRoute function
      toast.success('Route duplicated successfully');
      // Navigate to new route or refresh current
    } catch (error) {
      console.error('Error duplicating route:', error);
      toast.error('Failed to duplicate route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle route export
  const handleExportRoute = () => {
    if (!route || !routePlaques.length) return;

    // Create GPX data
    const gpxData = generateGPX(route, routePlaques);
    
    // Download as file
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.name.replace(/\s+/g, '-').toLowerCase()}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Route exported as GPX file');
  };

  // Generate GPX file content
  const generateGPX = (route, plaques) => {
    const waypoints = plaques.map(plaque => `
    <wpt lat="${plaque.latitude}" lon="${plaque.longitude}">
      <name>${plaque.title}</name>
      <desc>${plaque.description || ''}</desc>
    </wpt>`).join('');

    return `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaquer App">
  <metadata>
    <name>${route.name}</name>
    <desc>${route.description || ''}</desc>
  </metadata>
  ${waypoints}
</gpx>`;
  };

  if (!user) {
    return (
      <PageContainer activePage="routes" simplifiedFooter={true}>
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-6">You need to sign in to view routes.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer activePage="routes" simplifiedFooter={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading route...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !route) {
    return (
      <PageContainer activePage="routes" simplifiedFooter={true}>
        <div className="min-h-screen bg-gray-50 pt-6">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 font-medium mb-2">Error Loading Route</h3>
              <p className="text-red-500 mb-4">{error || 'Route not found'}</p>
              <Button variant="outline" onClick={() => navigate('/routes')}>
                Back to Routes
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="routes" simplifiedFooter={true}>
      {/* Route Header */}
      <RouteDetailHeader
        route={route}
        onBack={() => navigate('/routes')}
        onEdit={() => setEditFormOpen(true)}
        onDuplicate={handleDuplicateRoute}
        onDelete={() => setDeleteDialogOpen(true)}
        onToggleFavorite={() => {
          // Implementation for toggling favorite
          toast.info('Favorite toggle not yet implemented');
        }}
        isLoading={isLoading}
      />

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Route Stats */}
        <RouteStats 
          route={route}
          plaques={routePlaques}
          className="mb-6"
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="waypoints">Waypoints</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Route Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Route Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button 
                  onClick={() => setActiveTab('map')}
                  className="gap-2"
                >
                  <MapIcon size={16} />
                  View on Map
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportRoute}
                  className="gap-2"
                >
                  <Download size={16} />
                  Export GPX
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Implementation for navigation
                    toast.info('Navigation not yet implemented');
                  }}
                  className="gap-2"
                >
                  <Navigation size={16} />
                  Start Navigation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Implementation for sharing
                    toast.info('Sharing not yet implemented');
                  }}
                  className="gap-2"
                >
                  <Share size={16} />
                  Share Route
                </Button>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Distance & Time</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Distance: <span className="font-medium">{route.total_distance.toFixed(1)} km</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Estimated Walking Time: <span className="font-medium">~{Math.ceil(route.total_distance * 12)} minutes</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Number of Stops: <span className="font-medium">{route.points.length}</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Route Details</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Visibility: <span className="font-medium">{route.is_public ? 'Public' : 'Private'}</span>
                  </p>
                  {route.views && (
                    <p className="text-sm text-gray-600 mb-1">
                      Views: <span className="font-medium">{route.views}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Created: <span className="font-medium">{new Date(route.created_at?.toDate ? route.created_at.toDate() : route.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-[600px]">
      <MapContainer
        plaques={filteredPlaques}
        onPlaqueClick={handlePlaqueClick}
        className="h-full w-full"
      />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="waypoints">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Route Waypoints</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {routePlaques.length} stops in order
                </p>
              </div>
              <div className="divide-y">
                {routePlaques.map((plaque, index) => (
                  <div key={plaque.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{plaque.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {plaque.location || plaque.address}
                        </p>
                        {plaque.description && (
                          <p className="text-sm text-gray-700 mt-2">
                            {plaque.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Navigate to plaque detail
                          navigate(`/discover/plaque/${plaque.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Route Form */}
      <EditRouteForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSave={handleUpdateRoute}
        route={route}
        isSaving={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{route?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRoute}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Route'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default RouteDetailPage;