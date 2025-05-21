// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Route as RouteIcon,
  LogOut,
  FolderOpen,
  CheckCircle,
  ArrowRight,
  Clock
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useCollections } from '@/hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import { usePlaques } from '@/hooks/usePlaques';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import VisitedPlaquesPage from '../components/profile/VisitedPlaquesPage';
import { formatTimeAgo } from '@/utils/timeUtils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user, signOut } = useAuth();
  const { collections, loading: collectionsLoading } = useCollections();
  const { visits, loading: visitsLoading } = useVisitedPlaques();
  const { routes, loading: routesLoading } = useRoutes();
  const { plaques } = usePlaques();
  
  const [currentTab, setCurrentTab] = useState(params.tab || 'overview');
  const [visitsByMonth, setVisitsByMonth] = useState([]);
  const fileInputRef = useRef(null);
  
  // Update tab when URL param changes
  useEffect(() => {
    if (params.tab && ['overview', 'visited'].includes(params.tab)) {
      setCurrentTab(params.tab);
    }
  }, [params.tab]);

  // Calculate statistics
  const totalVisits = visits.length;
  const totalCollections = collections.length;
  const totalFavorites = collections.filter(c => c.is_favorite).length;
  const totalRoutes = routes.length;
  const totalPlaquesInCollections = collections.reduce((sum, c) => 
    sum + (Array.isArray(c.plaques) ? c.plaques.length : 0), 0
  );
  
  // Calculate unique plaques visited
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;
  
  // Get plaque details for recent visits
  const getRecentVisitsWithDetails = () => {
    return visits.slice(0, 5).map(visit => {
      const plaque = plaques.find(p => p.id === visit.plaque_id);
      return {
        ...visit,
        plaque: plaque || {
          id: visit.plaque_id,
          title: `Plaque #${visit.plaque_id}`,
          location: 'Location unknown',
          address: ''
        }
      };
    });
  };
  
  // Calculate visit streak
  const calculateStreak = () => {
    if (visits.length === 0) return 0;
    
    // Sort visits by date (newest first)
    const sortedVisits = [...visits].sort((a, b) => {
      const dateA = new Date(a.visited_at instanceof Date ? a.visited_at : a.visited_at.toDate ? a.visited_at.toDate() : a.visited_at);
      const dateB = new Date(b.visited_at instanceof Date ? b.visited_at : b.visited_at.toDate ? b.visited_at.toDate() : b.visited_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Check if user visited a plaque today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const latestVisitDate = new Date(sortedVisits[0].visited_at instanceof Date ? sortedVisits[0].visited_at : sortedVisits[0].visited_at.toDate ? sortedVisits[0].visited_at.toDate() : sortedVisits[0].visited_at);
    latestVisitDate.setHours(0, 0, 0, 0);
    
    if (latestVisitDate.getTime() !== today.getTime()) {
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
      
      const visitDate = new Date(sortedVisits[i].visited_at instanceof Date ? sortedVisits[i].visited_at : sortedVisits[i].visited_at.toDate ? sortedVisits[i].visited_at.toDate() : sortedVisits[i].visited_at);
      visitDate.setHours(0, 0, 0, 0);
      
      if (visitDate.getTime() === prevDate.getTime()) {
        // Visit on the previous day, continue streak
        streak++;
        currentDate = prevDate;
      } else {
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
        
        const visitDate = new Date(visit.visited_at instanceof Date ? visit.visited_at : visit.visited_at.toDate ? visit.visited_at.toDate() : visit.visited_at);
        
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
    
    if (visits.length > 0) {
      getVisitsByMonth();
    }
  }, [visits]);
  
  // Handle photo upload
  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

// Replace lines 186-203 with:
const handleFileChange = async (e) => {
  if (!e.target.files || !e.target.files[0] || !user) return;
  
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
    // Show loading state
    toast.loading('Uploading profile photo...');
    
    // Import and use the profile image service
    const { profileImageService } = await import('@/services/profileImageService');
    
    // Delete old image if exists
    if (user.photoURL) {
      await profileImageService.deleteOldProfileImage(user.photoURL);
    }
    
    // Upload new image
    const downloadURL = await profileImageService.uploadProfileImage(user.uid, file);
    
    if (downloadURL) {
      // The auth state will update automatically through onAuthStateChanged
      toast.dismiss();
      toast.success('Profile photo updated');
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    toast.dismiss();
    toast.error('Failed to upload photo');
  }
};
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  const handleTabChange = (value) => {
    setCurrentTab(value);
    navigate(`/profile/${value !== 'overview' ? value : ''}`);
  };
  
  const streak = calculateStreak();
  
  if (!user) {
    return (
      <PageContainer 
        activePage="profile"
        simplifiedFooter={true}
      >
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-6">You need to sign in to view your profile.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }
  
  const isLoading = collectionsLoading || visitsLoading || routesLoading;
  
  // Get recent collections and favorites
  const recentCollections = [...collections]
    .sort((a, b) => {
      const dateA = a.updated_at?.toDate ? a.updated_at.toDate() : new Date(a.updated_at);
      const dateB = b.updated_at?.toDate ? b.updated_at.toDate() : new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);
    
  const favoriteCollections = collections.filter(c => c.is_favorite).slice(0, 3);
  const recentVisitsWithDetails = getRecentVisitsWithDetails();
  
  // Get recent routes sorted by creation date
  const recentRoutes = [...routes]
    .sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);
  
  return (
    <PageContainer 
      activePage="profile"
      simplifiedFooter={true}
    >
      {/* Hero Section with decorative background circles */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 px-4 overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Profile Photo */}
              <div className="relative">
                {user.photoURL ? (
                  <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full overflow-hidden">
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute bottom-0 right-0 h-7 w-7 p-0 rounded-full bg-white hover:bg-gray-100"
                  onClick={handlePhotoUpload}
                >
                  <Camera size={12} className="text-gray-700" />
                </Button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold">{user.displayName || 'User'}</h1>
                <p className="opacity-90 mt-1">
                  Member since {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate('/settings')}
              >
                <Settings size={16} className="mr-2" /> Settings
              </Button>
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut size={16} className="mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto max-w-5xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-blue-600">{uniquePlaquesVisited}</div>
              <div className="text-xs text-gray-500">Plaques Visited</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-purple-600">{totalCollections}</div>
              <div className="text-xs text-gray-500">Collections</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-green-600">{totalRoutes}</div>
              <div className="text-xs text-gray-500">Routes</div>
            </div>
            {streak > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center px-3 py-1">
                  <div className="text-lg font-bold text-amber-600">{streak}</div>
                  <div className="text-xs text-gray-500">Day Streak</div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <MapPin size={12} className="mr-1" /> Explorer
            </Badge>
            {totalFavorites > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star size={12} className="mr-1" /> {totalFavorites} Favorites
              </Badge>
            )}
          </div>
        </div>
        
        {/* Tab Bar */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              className={`px-4 py-3 font-medium text-sm ${currentTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-3 font-medium text-sm ${currentTab === 'visited' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => handleTabChange('visited')}
            >
              Visited Plaques
            </button>
          </div>
        </div>
        
        {/* Content */}
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
            {currentTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Visits - Enhanced with plaque details */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recent Visits</h2>
                    {visits.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleTabChange('visited')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View All
                        <ArrowRight size={16} className="ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  {visits.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <CheckCircle className="mx-auto text-gray-300 mb-3" size={32} />
                      <p className="text-gray-500">No visits yet. Start exploring!</p>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate('/discover')}
                      >
                        Discover Plaques
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentVisitsWithDetails.map((visit, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate('/discover')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                              <MapPin size={18} />
                            </div>
                            <div>
                              <p className="font-medium">{visit.plaque.title}</p>
                              <p className="text-sm text-gray-500">
                                {visit.plaque.location || visit.plaque.address || 'Unknown location'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {formatTimeAgo(visit.visited_at)}
                            </p>
                            {visit.notes && (
                              <Badge variant="outline" className="text-xs mt-1">Has notes</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Activity Chart */}
                  <div className="bg-white shadow-sm rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">Visit Activity</h3>
                    <div className="flex items-end h-36 gap-2 mt-4">
                      {visitsByMonth.map((month, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full bg-blue-100 rounded-t transition-all duration-300" 
                            style={{ height: `${Math.max(month.count * 10, 4)}px` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2">{month.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-white shadow-sm rounded-lg p-6">
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
                        onClick={() => navigate('/collections')}
                      >
                        <PlusCircle className="mr-2" size={16} /> Create New Collection
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => navigate('/discover?view=map')}
                      >
                        <RouteIcon className="mr-2" size={16} /> Plan a Route
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Collections Summary */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">My Collections</h3>
                      <p className="text-sm text-gray-500">
                        {totalCollections} collections • {totalPlaquesInCollections} total plaques
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/collections')}
                    >
                      View All Collections
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                  
                  {collections.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FolderOpen className="mx-auto text-gray-300 mb-3" size={32} />
                      <p className="text-gray-500">No collections yet</p>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate('/collections')}
                      >
                        Create Your First Collection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Favorite Collections */}
                      {favoriteCollections.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Favorite Collections</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {favoriteCollections.map(collection => (
                              <div 
                                key={collection.id}
                                className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-all bg-amber-50 border-amber-200"
                                onClick={() => navigate(`/collections/${collection.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${collection.color}`}>
                                    <span className="text-xl">{collection.icon}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{collection.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      {Array.isArray(collection.plaques) ? collection.plaques.length : 0} plaques
                                    </p>
                                  </div>
                                  <Star size={14} className="text-amber-500 flex-shrink-0" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recent Collections */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Collections</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {recentCollections.map(collection => (
                            <div 
                              key={collection.id}
                              className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-all"
                              onClick={() => navigate(`/collections/${collection.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${collection.color}`}>
                                  <span className="text-xl">{collection.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{collection.name}</h4>
                                  <p className="text-xs text-gray-500">
                                    {Array.isArray(collection.plaques) ? collection.plaques.length : 0} plaques
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Routes Section - Enhanced */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">My Routes</h3>
                      <p className="text-sm text-gray-500">
                        {totalRoutes} saved routes • {routes.reduce((sum, r) => sum + r.total_distance, 0).toFixed(1)} km total
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/discover?view=map')}
                    >
                      Plan New Route
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                  
                  {routes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <RouteIcon className="mx-auto text-gray-300 mb-3" size={32} />
                      <p className="text-gray-500">No routes saved yet</p>
                      <p className="text-xs text-gray-400 mt-1">Create walking routes to explore multiple plaques in one trip</p>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate('/discover?view=map')}
                      >
                        Create Your First Route
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRoutes.map(route => (
                        <div 
                          key={route.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all bg-gradient-to-r from-green-50 to-white"
                          onClick={() => navigate(`/routes/${route.id}`)}
                        >
                          <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                            <RouteIcon size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{route.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500">
                                {route.points.length} stops
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {route.total_distance.toFixed(1)} km
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                ~{Math.ceil(route.total_distance * 12)} min walk
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {formatTimeAgo(route.created_at)}
                            </p>
                            {route.is_public && (
                              <Badge variant="outline" className="text-xs mt-1 bg-green-50">Public</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Visited Tab */}
            {currentTab === 'visited' && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Visited Plaques ({visits.length})</h2>
                  <Button 
                    onClick={() => navigate('/discover')}
                  >
                    Discover More
                  </Button>
                </div>
                
                <VisitedPlaquesPage visits={visits} loading={visitsLoading} />
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default ProfilePage;