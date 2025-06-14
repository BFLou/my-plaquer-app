// src/pages/RouteDetailPage.tsx - FIXED: Working map view and cleaned up private route
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Navigation,
  Download,
  Clock,
  Trash2,
  ArrowLeft,
  Edit,
  Copy,
  MoreVertical,
  Route as RouteIcon,
  Eye,
  Star
} from 'lucide-react';
import { PageContainer } from "@/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoutes } from '@/hooks/useRoutes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import EditRouteForm from '../components/routes/EditRouteForm';
import RouteMapContainer from "../components/maps/RouteMapContainer"; // Re-enabled
import { RouteStats } from '../components/routes/RouteStats';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { formatTimeAgo } from '@/utils/timeUtils';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { navigateToPlaqueWithContext } from '@/utils/navigationUtils';
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
// Import plaque data for matching route points
import plaqueData from '../data/plaque_data.json';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

// Import proper types
import type { RouteData, RoutePoint as ServiceRoutePoint } from '@/services/RouteService';
import type { Plaque } from '@/types/plaque';

// Local interfaces
interface LocalRoutePoint {
  plaque_id: number;
  order: number;
  latitude?: number;
  longitude?: number;
}

interface LocalRouteData {
  id: string;
  name: string;
  description?: string;
  points: LocalRoutePoint[];
  total_distance: number;
  is_favorite?: boolean;
  created_at: any;
  updated_at: any;
  user_id: string;
  is_public: boolean;
}

// Extended Plaque interface that includes order for local use
interface PlaqueWithOrder extends Plaque {
  order?: number;
}

// Helper function to convert local route data to service RouteData
const toServiceRouteData = (localRoute: LocalRouteData): RouteData => {
  const servicePoints: ServiceRoutePoint[] = localRoute.points.map(point => ({
    plaque_id: point.plaque_id,
    order: point.order,
    title: '', // Will be filled from plaque data
    lat: point.latitude || 0,
    lng: point.longitude || 0,
  }));

  return {
    id: localRoute.id,
    name: localRoute.name,
    description: localRoute.description,
    points: servicePoints,
    total_distance: localRoute.total_distance,
    is_favorite: localRoute.is_favorite,
    created_at: localRoute.created_at,
    updated_at: localRoute.updated_at,
    user_id: localRoute.user_id,
    is_public: localRoute.is_public,
  };
};

// Helper function to convert adapted plaque data to Plaque type with order
const toPlaqueWithOrder = (adaptedPlaque: any): PlaqueWithOrder => ({
  id: adaptedPlaque.id,
  title: adaptedPlaque.title,
  inscription: adaptedPlaque.inscription,
  latitude: adaptedPlaque.latitude,
  longitude: adaptedPlaque.longitude,
  address: adaptedPlaque.address,
  erected: String(adaptedPlaque.erected),
  main_photo: adaptedPlaque.main_photo,
  colour: adaptedPlaque.colour,
  location: adaptedPlaque.location || adaptedPlaque.address,
  description: adaptedPlaque.description || adaptedPlaque.inscription,
  order: adaptedPlaque.order,
  // Add missing properties to match Plaque interface
  profession: adaptedPlaque.profession,
  postcode: adaptedPlaque.postcode,
  area: adaptedPlaque.area,
  organisations: adaptedPlaque.organisations,
  color: adaptedPlaque.colour, // Map colour to color
  visited: false // Default value
});

// Helper function to convert PlaqueWithOrder to regular Plaque for RouteMapContainer
const convertToStandardPlaques = (plaquesWithOrder: PlaqueWithOrder[]): Plaque[] => {
  return plaquesWithOrder.map(({ order, ...plaque }) => plaque as Plaque);
};

// Create a route object compatible with RouteMapContainer
const createMapRoute = (localRoute: LocalRouteData, orderedPlaques: PlaqueWithOrder[]): RouteData => {
  return {
    id: localRoute.id,
    name: localRoute.name,
    description: localRoute.description || '',
    points: orderedPlaques.map((plaque, index) => ({
      plaque_id: plaque.id,
      order: index + 1,
      title: plaque.title,
      lat: typeof plaque.latitude === 'string' ? parseFloat(plaque.latitude) : (plaque.latitude || 0),
      lng: typeof plaque.longitude === 'string' ? parseFloat(plaque.longitude) : (plaque.longitude || 0),
    })),
    total_distance: localRoute.total_distance,
    is_favorite: localRoute.is_favorite,
    created_at: localRoute.created_at,
    updated_at: localRoute.updated_at,
    user_id: localRoute.user_id,
    is_public: localRoute.is_public,
  };
};

const RouteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { routes, updateRoute, deleteRoute, duplicateRoute } = useRoutes();
  
  // Modal plaque from URL
  const modalPlaqueId = searchParams.get('plaque') ? parseInt(searchParams.get('plaque')!) : null;
  
  // State definitions using correct interfaces
  const [route, setRoute] = useState<LocalRouteData | null>(null);
  const [routePlaques, setRoutePlaques] = useState<PlaqueWithOrder[]>([]);
  const [selectedPlaque, setSelectedPlaque] = useState<PlaqueWithOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [editFormOpen, setEditFormOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Load route data
  useEffect(() => {
    const loadRouteData = async (): Promise<void> => {
      if (!id || !user) {
        setError('Route ID or user not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading route with ID:', id);
        
        const existingRoute = routes.find((r: any) => r.id === id);
        
        if (existingRoute) {
          console.log('Found route in existing data:', existingRoute);
          const localRoute: LocalRouteData = {
            id: existingRoute.id || '',
            name: existingRoute.name,
            description: existingRoute.description,
            points: existingRoute.points || [],
            total_distance: existingRoute.total_distance || 0,
            is_favorite: existingRoute.is_favorite || false,
            created_at: existingRoute.created_at,
            updated_at: existingRoute.updated_at,
            user_id: existingRoute.user_id || user.uid,
            is_public: existingRoute.is_public || false,
          };
          setRoute(localRoute);
          setIsFavorite(existingRoute.is_favorite || false);
          
          await loadRoutePlaques(localRoute);
          setLoading(false);
        } else if (routes.length > 0) {
          console.log('Route not found in loaded routes');
          setError('Route not found');
          setLoading(false);
        }
        
      } catch (err) {
        console.error('Error loading route:', err);
        setError('Failed to load route');
        setLoading(false);
      }
    };

    loadRouteData();
  }, [id, user, routes]);

  // Load route plaques with proper type handling
  const loadRoutePlaques = async (routeData: LocalRouteData): Promise<void> => {
    try {
      if (routeData.points && routeData.points.length > 0) {
        const adaptedPlaques = adaptPlaquesData(plaqueData as any[]);
        const plaqueIds = routeData.points.map((point: LocalRoutePoint) => point.plaque_id);
        
        const matchedPlaques: PlaqueWithOrder[] = adaptedPlaques
          .filter((plaque: any) => plaqueIds.includes(plaque.id))
          .map((plaque: any) => ({
            ...toPlaqueWithOrder(plaque),
            order: routeData.points.find((p: LocalRoutePoint) => p.plaque_id === plaque.id)?.order || 0
          }))
          .sort((a: PlaqueWithOrder, b: PlaqueWithOrder) => (a.order || 0) - (b.order || 0));
        
        console.log('Loaded route plaques:', matchedPlaques.length);
        setRoutePlaques(matchedPlaques);
      }
    } catch (error) {
      console.error('Error loading plaque data:', error);
      setRoutePlaques([]);
    }
  };

  // Handle modal plaque from URL
  useEffect(() => {
    if (modalPlaqueId && routePlaques.length > 0) {
      const plaque = routePlaques.find((p: PlaqueWithOrder) => p.id === modalPlaqueId);
      if (plaque) {
        setSelectedPlaque(plaque);
      } else {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('plaque');
        setSearchParams(newParams, { replace: true });
      }
    } else if (!modalPlaqueId) {
      setSelectedPlaque(null);
    }
  }, [modalPlaqueId, routePlaques, searchParams, setSearchParams]);

  // Action handlers
  const handleToggleFavorite = async (): Promise<void> => {
    if (!route) return;

    try {
      setIsLoading(true);
      setDropdownOpen(false);
      
      const updatedRoute = await updateRoute(route.id, {
        is_favorite: !isFavorite
      });
      
      if (updatedRoute) {
        setIsFavorite(!isFavorite);
        setRoute((prev: LocalRouteData | null) => prev ? ({
          ...prev,
          is_favorite: !isFavorite
        }) : null);
        
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoute = (): void => {
    setDropdownOpen(false);
    setEditFormOpen(true);
  };

  const handleDuplicateRoute = async (): Promise<void> => {
    if (!route) return;
    
    try {
      setIsLoading(true);
      setDropdownOpen(false);
      
      const serviceRoute = toServiceRouteData(route);
      const duplicatedRoute = await duplicateRoute(serviceRoute);
      
      if (duplicatedRoute) {
        toast.success('Route duplicated successfully');
        navigate(`/library/routes/${duplicatedRoute.id}`);
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      toast.error('Failed to duplicate route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoute = async (): Promise<void> => {
    if (!route) return;

    try {
      setIsLoading(true);
      const success = await deleteRoute(route.id);
      
      if (success) {
        toast.success('Route deleted successfully');
        navigate('/library/routes');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleUpdateRoute = async (data: { name: string; description?: string }): Promise<void> => {
    if (!route) return;

    try {
      setIsLoading(true);
      const updatedRoute = await updateRoute(route.id, {
        name: data.name,
        description: data.description
      });
      
      if (updatedRoute) {
        setRoute((prev: LocalRouteData | null) => prev ? ({
          ...prev,
          name: data.name,
          description: data.description
        }) : null);
        
        setEditFormOpen(false);
        toast.success('Route updated successfully');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setIsLoading(false);
    }
  };

  // Export and share handlers
  const handleExportRoute = (): void => {
    setDropdownOpen(false);
    
    if (!route || !routePlaques.length) {
      toast.error('No route data to export');
      return;
    }

    try {
      const gpxData = generateGPX(route, routePlaques);
      const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${route.name.replace(/\s+/g, '-').toLowerCase()}.gpx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Route exported as GPX file');
    } catch (error) {
      console.error('Error exporting route:', error);
      toast.error('Failed to export route');
    }
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const generateGPX = (route: LocalRouteData, plaques: PlaqueWithOrder[]): string => {
    const waypoints = plaques.map((plaque: PlaqueWithOrder) => `
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

  // Plaque handlers
  const handlePlaqueClick = useCallback((plaque: PlaqueWithOrder): void => {
    if (!route) return;
    
    const plaqueIndex = routePlaques.findIndex((p: PlaqueWithOrder) => p.id === plaque.id);
    const progress = plaqueIndex >= 0 ? `${plaqueIndex + 1} of ${routePlaques.length}` : undefined;
    
    navigateToPlaqueWithContext(navigate, plaque.id, {
      from: 'route',
      routeId: route.id,
      routeName: route.name,
      progress: progress
    });
  }, [navigate, route, routePlaques]);

  const handleCloseModal = useCallback((): void => {
    setSelectedPlaque(null);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('plaque');
    
    if (route) {
      newParams.set('from', 'route');
      newParams.set('route', route.id);
      newParams.set('routeName', route.name);
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, route]);

  // Auth check
  if (!user) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <RouteIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view routes.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading route...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !route) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="min-h-screen bg-gray-50 pt-6">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 font-medium mb-2">Error Loading Route</h3>
              <p className="text-red-500 mb-4">{error || 'Route not found'}</p>
              <Button variant="outline" onClick={() => navigate('/library/routes')} className="mt-4">
                Back to Routes
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="library" simplifiedFooter={true}>
      {/* Route Header */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/library')} 
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <a 
              className="text-white/80 hover:text-white text-sm cursor-pointer" 
              onClick={() => navigate('/library')}
            >
              My Library
            </a>
            <span className="text-white/50">/</span>
            <a 
              className="text-white/80 hover:text-white text-sm cursor-pointer" 
              onClick={() => navigate('/library/routes')}
            >
              Routes
            </a>
            <span className="text-white/50">/</span>
            <span className="text-white font-medium truncate max-w-xs">{route.name}</span>
          </div>

          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white text-2xl">
                <RouteIcon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{route.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <RouteIcon size={14} />
                    <span>{route.points.length} stops</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{route.total_distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>~{Math.ceil(route.total_distance * 12)} min walk</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
                className={isFavorite 
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400" 
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"}
                disabled={isLoading}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${isFavorite ? "fill-current" : ""}`} 
                />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>              
              
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    disabled={isLoading}
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 z-[9999]"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem 
                    onClick={handleEditRoute}
                    disabled={isLoading}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Route
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDuplicateRoute} 
                    disabled={isLoading}
                  >
                    <Copy size={16} className="mr-2" />
                    Duplicate Route
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportRoute}
                    disabled={isLoading}
                  >
                    <Download size={16} className="mr-2" />
                    Export GPX
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setDropdownOpen(false);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 focus:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Route
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Route description */}
          {route.description && (
            <p className="text-lg opacity-90 mb-4 max-w-3xl">
              {route.description}
            </p>
          )}
          
          {/* Route metadata - CLEANED UP: Removed view counts and public stats */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Clock size={12} className="mr-1" /> Updated {formatTimeAgo(route.updated_at)}
            </Badge>

            {isFavorite && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <Star size={12} className="mr-1 fill-current" /> Favorite
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Route Stats */}
        <RouteStats 
          route={toServiceRouteData(route)}
          plaques={convertToStandardPlaques(routePlaques)}
          className="mb-6 -mt-5 relative z-10"
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
                  <MapPin size={16} />
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
                    toast.info('Navigation feature coming soon');
                  }}
                  className="gap-2"
                >
                  <Navigation size={16} />
                  Start Navigation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/library/routes/${route.id}`;
                    copyToClipboard(shareUrl);
                  }}
                  className="gap-2"
                >
                  <Copy size={16} />
                  Share Route
                </Button>
              </div>
            </div>

            {/* Route Information - CLEANED UP: Removed public visibility references */}
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
                  <p className="text-sm text-gray-600">
                    Created: <span className="font-medium">{new Date(route.created_at?.toDate ? route.created_at.toDate() : route.created_at).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Last Updated: <span className="font-medium">{new Date(route.updated_at?.toDate ? route.updated_at.toDate() : route.updated_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-[600px]">
                {/* FIXED: Working RouteMapContainer with WALKING ROUTES */}
                <RouteMapContainer
                  route={createMapRoute(route, routePlaques)}
                  plaques={convertToStandardPlaques(routePlaques)}
                  onPlaqueClick={handlePlaqueClick}
                  className="h-full w-full"
                  showRoute={true}
                  routeColor="#10b981"
                  useWalkingRoutes={true}
                  onError={() => {
                    console.error('Map loading error');
                    toast.error('Map failed to load. Please refresh the page.');
                  }}
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
                {routePlaques.map((plaque: PlaqueWithOrder, index: number) => (
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
                        onClick={() => handlePlaqueClick(plaque)}
                      >
                        <Eye size={16} className="mr-2" />
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

      {/* Plaque detail modal */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque as Plaque}
          isOpen={!!selectedPlaque}
          onClose={handleCloseModal}
          onFavoriteToggle={() => {
            toast.info('Favorite feature not implemented for route plaques');
          }}
          isFavorite={false}
          onMarkVisited={() => {
            toast.info('Visit tracking not implemented for route plaques');
          }}
          nearbyPlaques={[]}
          onSelectNearbyPlaque={() => {}}
          generateShareUrl={(plaqueId: number) => generatePlaqueUrl(plaqueId)}
          currentPath={location.pathname}
        />
      )}

      {/* Edit Route Form */}
      <EditRouteForm
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSave={handleUpdateRoute}
        route={toServiceRouteData(route)}
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