// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Star, 
  List, 
  Settings, 
  Calendar, 
  Edit, 
  PlusCircle, 
  TrendingUp,
  Camera,
  Route
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from '@/components/common/StatCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCollections } from '@/hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import VisitedPlaquesPanel from '@/components/profile/VisitedPlaquesPanel';
import UserCollectionsPanel from '@/components/profile/UserCollectionsPanel';
import UserRoutesPanel from '@/components/profile/UserRoutesPanel';
import { toast } from 'sonner';

interface ProfilePageProps {
  activeTab?: 'overview' | 'visited' | 'collections' | 'routes';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ activeTab = 'overview' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collections, loading: collectionsLoading } = useCollections();
  const { visits, loading: visitsLoading } = useVisitedPlaques();
  const { routes, loading: routesLoading } = useRoutes();
  
  const [currentTab, setCurrentTab] = useState<string>(activeTab);
  const [visitsByMonth, setVisitsByMonth] = useState<{month: string, year: number, count: number}[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Calculate statistics
  const totalVisits = visits.length;
  const totalCollections = collections.length;
  const totalFavorites = collections.filter(c => c.is_favorite).length;
  const totalRoutes = routes.length;
  
  // Calculate unique plaques visited
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;
  
  // Calculate visit streak
  const calculateStreak = () => {
    if (visits.length === 0) return 0;
    
    // Sort visits by date (newest first)
    const sortedVisits = [...visits].sort((a, b) => 
      new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
    );
    
    // Check if user visited a plaque today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const latestVisit = new Date(sortedVisits[0].visited_at);
    latestVisit.setHours(0, 0, 0, 0);
    
    if (latestVisit.getTime() !== today.getTime()) {
      // No visit today, so no streak
      return 0;
    }
    
    // Count consecutive days with visits
    let streak = 1;
    let currentDate = today;
    
    for (let i = 1; i < sortedVisits.length; i++) {
      // Move to the previous day
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      
      const visitDate = new Date(sortedVisits[i].visited_at);
      visitDate.setHours(0, 0, 0, 0);
      
      if (visitDate.getTime() === prevDate.getTime()) {
        // Visit on the previous day, continue streak
        streak++;
        currentDate = prevDate;
      } else if (visitDate.getTime() < prevDate.getTime()) {
        // Gap in visits, streak ends
        break;
      }
    }
    
    return streak;
  };
  
  // Calculate visits by month for the chart
  useEffect(() => {
    const getVisitsByMonth = () => {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      
      const months = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(sixMonthsAgo);
        date.setMonth(date.getMonth() + i);
        months.push({
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          count: 0
        });
      }
      
      // Count visits per month
      visits.forEach(visit => {
        if (!visit.visited_at) return;
        
        const visitDate = new Date(visit.visited_at);
        
        if (visitDate >= sixMonthsAgo) {
          const monthIndex = visitDate.getMonth() - sixMonthsAgo.getMonth() + 
                           (visitDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12;
          
          if (monthIndex >= 0 && monthIndex < 6) {
            months[monthIndex].count++;
          }
        }
      });
      
      setVisitsByMonth(months);
    };
    
    getVisitsByMonth();
  }, [visits]);
  
  // Add profile photo update handler
  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large', {
        description: 'Please select an image under 5MB'
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file'
      });
      return;
    }
    
    try {
      toast.promise(
        // This would be your actual implementation for uploading profile photo
        new Promise(resolve => setTimeout(resolve, 1500)),
        {
          loading: 'Uploading photo...',
          success: 'Photo updated successfully',
          error: 'Failed to upload photo'
        }
      );
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };
  
  const streak = calculateStreak();
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="mb-6">You need to sign in to view your profile.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }
  
  const isLoading = collectionsLoading || visitsLoading || routesLoading;
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <div className="relative">
          {user.photoURL ? (
            <div className="bg-blue-100 w-24 h-24 rounded-full overflow-hidden">
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center">
              <User size={40} className="text-blue-600" />
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute bottom-0 right-0 h-8 w-8 p-0 rounded-full bg-white"
            onClick={handlePhotoUpload}
          >
            <Camera size={14} />
          </Button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.displayName || 'User'}</h1>
          <p className="text-gray-500 mb-3">
            Member since {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <MapPin size={12} className="mr-1" /> {uniquePlaquesVisited} Unique Plaques
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <List size={12} className="mr-1" /> {totalCollections} Collections
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Star size={12} className="mr-1" /> {totalFavorites} Favorites
            </Badge>
            {streak > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp size={12} className="mr-1" /> {streak} Day Streak
              </Badge>
            )}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/settings')}
        >
          <Settings size={16} /> Settings
        </Button>
      </div>
      
      {/* Tab Navigation */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visited">Visited</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading your profile data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                label="Total Visits" 
                value={totalVisits}
                icon={<MapPin className="text-blue-500" size={20} />} 
              />
              <StatCard 
                label="Collections" 
                value={totalCollections}
                icon={<List className="text-purple-500" size={20} />} 
              />
              <StatCard 
                label="Saved Routes" 
                value={totalRoutes} 
                icon={<Route className="text-green-500" size={20} />} 
              />
              <StatCard 
                label="Visit Streak" 
                value={streak} 
                subValue="days"
                icon={<Calendar className="text-amber-500" size={20} />} 
              />
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Visits */}
              <div className="lg:col-span-2">
                <VisitedPlaquesPanel 
                  visits={visits.slice(0, 5)} 
                  showAll={() => setCurrentTab('visited')} 
                />
              </div>
              
              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Favorite Collections */}
                <UserCollectionsPanel 
                  collections={collections.filter(c => c.is_favorite).slice(0, 3)} 
                  showFavoritesOnly={true}
                  showAll={() => setCurrentTab('collections')}
                />
                
                {/* Saved Routes */}
                <UserRoutesPanel 
                  routes={routes.slice(0, 3)}
                  showAll={() => setCurrentTab('routes')}
                />
                
                {/* Visits By Month */}
                <div className="bg-white shadow-sm rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Visit Activity</h3>
                  <div className="flex items-end h-36 gap-2 mt-4">
                    {visitsByMonth.map((month, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-100 rounded-t" 
                          style={{ height: `${Math.max(month.count * 10, 4)}px` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2">{month.month}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      {visitsByMonth[0]?.month} {visitsByMonth[0]?.year}
                    </span>
                    <span className="text-sm text-gray-500">
                      {visitsByMonth[5]?.month} {visitsByMonth[5]?.year}
                    </span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-white shadow-sm rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/discover')}
                    >
                      <MapPin className="mr-2" size={16} /> Discover New Plaques
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/collections/new')}
                    >
                      <PlusCircle className="mr-2" size={16} /> Create New Collection
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/settings/profile')}
                    >
                      <Edit className="mr-2" size={16} /> Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Visited Tab */}
          <TabsContent value="visited" className="mt-0">
            <div className="bg-white shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Visited Plaques</h2>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/discover')}
                >
                  Discover More
                </Button>
              </div>
              
              {visits.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Visited Plaques Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Start exploring and visiting plaques around London. Your visits will appear here.
                  </p>
                  <Button 
                    onClick={() => navigate('/discover')}
                  >
                    Explore Plaques
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map(visit => (
                    <div 
                      key={visit.id}
                      className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/discover/plaque/${visit.plaque_id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium">Plaque #{visit.plaque_id}</h4>
                          <p className="text-sm text-gray-500">
                            Visited on {new Date(visit.visited_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          {visit.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              "{visit.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-0">
            <div className="bg-white shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">My Collections</h2>
                <Button 
                  onClick={() => navigate('/collections/new')}
                  className="gap-2"
                >
                  <PlusCircle size={16} /> New Collection
                </Button>
              </div>
              
              {collections.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <List className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Collections Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Create collections to organize the plaques you discover and visit.
                  </p>
                  <Button 
                    onClick={() => navigate('/collections/new')}
                  >
                    Create Collection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map(collection => (
                    <div 
                      key={collection.id}
                      className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/collections/${collection.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white bg-blue-500`}>
                          {collection.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{collection.name}</h4>
                          <p className="text-sm text-gray-500">
                            {collection.plaques.length} plaques
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {collection.is_favorite && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Favorite
                              </Badge>
                            )}
                            {collection.is_public && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Routes Tab */}
          <TabsContent value="routes" className="mt-0">
            <div className="bg-white shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">My Routes</h2>
                <Button 
                  onClick={() => navigate('/discover?view=map')}
                  className="gap-2"
                >
                  <Route size={16} /> Create Route
                </Button>
              </div>
              
              {routes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <Route className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Routes Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Create walking routes to explore multiple plaques in one trip.
                  </p>
                  <Button 
                    onClick={() => navigate('/discover?view=map')}
                  >
                    Open Map
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {routes.map(route => (
                    <div 
                      key={route.id}
                      className="border rounded-lg p-4 hover:border-green-300 hover:bg-green-50/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/profile/routes/${route.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 text-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                          <Route size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium">{route.name}</h4>
                          <p className="text-sm text-gray-500">
                            {route.points.length} stops • {route.total_distance.toFixed(1)} km
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created on {new Date(route.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </>
      )}
    </div>
  );
};

export default ProfilePage;