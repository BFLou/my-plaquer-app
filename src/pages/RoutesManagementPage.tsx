// src/pages/RoutesManagementPage.tsx - Complete version with proper syntax
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Route as RouteIcon, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoutes } from '@/hooks/useRoutes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import RouteCard from '@/components/routes/RouteCard';
import EditRouteForm from '@/components/routes/EditRouteForm';
import { PageContainer } from "@/components";
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

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'oldest' | 'name_asc' | 'name_desc' | 'distance_asc' | 'distance_desc';

const RoutesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { routes, loading, updateRoute, deleteRoute, createRoute } = useRoutes();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  
  // Edit/Delete state
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort routes
  const filteredAndSortedRoutes = routes
    .filter(route => {
      // Search filter
      const matchesSearch = !searchQuery || 
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Public filter
      const matchesPublic = !showOnlyPublic || route.is_public;
      
      return matchesSearch && matchesPublic;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          const dateA = a.updated_at?.toDate ? a.updated_at.toDate() : new Date(a.updated_at);
          const dateB = b.updated_at?.toDate ? b.updated_at.toDate() : new Date(b.updated_at);
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          const dateC = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
          const dateD = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
          return dateC.getTime() - dateD.getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'distance_asc':
          return a.total_distance - b.total_distance;
        case 'distance_desc':
          return b.total_distance - a.total_distance;
        default:
          return 0;
      }
    });

  // Handle actions
  const handleViewRoute = (route: any) => {
    navigate(`/library/routes/${route.id}`);
  };

  const handleEditRoute = (route: any) => {
    setRouteToEdit(route);
    setEditFormOpen(true);
  };

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
      
      const duplicatedRoute = await createRoute(
        `${route.name} (Copy)`,
        mockPlaques,
        route.total_distance,
        route.description || '',
        false // Make duplicate private by default
      );
      
      toast.success('Route duplicated successfully');
      
      if (duplicatedRoute) {
        navigate(`/library/routes/${duplicatedRoute.id}`);
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      toast.error('Failed to duplicate route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoute = (route: any) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

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

  // Get active filters count
  const activeFiltersCount = (searchQuery ? 1 : 0) + (showOnlyPublic ? 1 : 0);

  if (!user) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <RouteIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to manage your routes.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="library" simplifiedFooter={true}>
      {/* Header with breadcrumb */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
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
            <span className="text-white font-medium">Routes</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <RouteIcon size={24} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold">My Routes</h1>
                <p className="opacity-90 text-sm">
                  Plan and manage your walking routes through London's historic plaques.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/discover?view=map')}
              className="bg-white text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <Plus size={16} className="mr-2" /> Create Route
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{routes.length}</div>
              <div className="text-sm text-gray-500">Total Routes</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {routes.reduce((sum, r) => sum + r.total_distance, 0).toFixed(1)} km
              </div>
              <div className="text-sm text-gray-500">Total Distance</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {routes.filter(r => r.is_public).length}
              </div>
              <div className="text-sm text-gray-500">Public Routes</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                  <SelectItem value="distance_asc">Shortest First</SelectItem>
                  <SelectItem value="distance_desc">Longest First</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyPublic ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyPublic(!showOnlyPublic)}
                className="gap-1"
              >
                <Filter size={16} />
                Public Only
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <TabsList>
                  <TabsTrigger value="grid"><Grid size={16} /></TabsTrigger>
                  <TabsTrigger value="list"><List size={16} /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading your routes...</p>
            </div>
          </div>
        ) : filteredAndSortedRoutes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <RouteIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {routes.length === 0 ? 'No routes yet' : 'No matching routes'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {routes.length === 0 
                ? 'Create walking routes to explore multiple plaques in one trip'
                : 'Try adjusting your search or filters'
              }
            </p>
            {routes.length === 0 ? (
              <Button onClick={() => navigate('/discover?view=map')}>
                Create Your First Route
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setShowOnlyPublic(false);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }>
            {filteredAndSortedRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                onView={handleViewRoute}
                onEdit={handleEditRoute}
                onDuplicate={handleDuplicateRoute}
                onDelete={handleDeleteRoute}
                className={viewMode === 'list' ? 'max-w-none' : ''}
              />
            ))}
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
    </PageContainer>
  );
};

export default RoutesManagementPage;