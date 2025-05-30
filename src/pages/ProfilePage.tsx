// src/pages/ProfilePage.tsx - Redesigned as Personal Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User, 
  Settings, 
  Camera,
  Edit,
  BookOpen,
  MapPin,
  Route,
  Plus,
  Star,
  CheckCircle,
  TrendingUp,
  Award,
  Calendar,
  FolderOpen
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
import { formatTimeAgo } from '@/utils/timeUtils';

// Achievement system constants
const ACHIEVEMENTS = [
  {
    id: 'first_visit',
    name: 'First Visit',
    description: 'Visited your first plaque',
    icon: '🏆',
    colorClass: 'bg-amber-50 border-amber-200 text-amber-800',
    requirement: 1
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Created 5 collections',
    icon: '🗂️',
    colorClass: 'bg-blue-50 border-blue-200 text-blue-800',
    requirement: 5
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visited 25 plaques',
    icon: '🚶',
    colorClass: 'bg-green-50 border-green-200 text-green-800',
    requirement: 25
  },
  {
    id: 'specialist',
    name: 'Specialist',
    description: 'Visit 50 plaques',
    icon: '🌟',
    colorClass: 'bg-purple-50 border-purple-200 text-purple-800',
    requirement: 50
  }
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { collections } = useCollections();
  const { visits } = useVisitedPlaques();
  const { routes } = useRoutes();
  const { plaques } = usePlaques();

  // Calculate stats
  const totalVisits = visits.length;
  const totalCollections = collections.length;
  const totalRoutes = routes.length;
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;
  
  // Calculate this month's visits
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const thisMonthVisits = visits.filter(visit => {
    const visitDate = visit.visited_at?.toDate ? visit.visited_at.toDate() : new Date(visit.visited_at);
    return visitDate >= firstDayOfMonth;
  }).length;

  // Calculate streak (simplified - consecutive days with visits)
  const calculateStreak = () => {
    if (visits.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    // Simple streak calculation - check last 7 days
    for (let i = 0; i < 7; i++) {
      const hasVisitOnDate = visits.some(visit => {
        const visitDate = visit.visited_at?.toDate ? visit.visited_at.toDate() : new Date(visit.visited_at);
        return visitDate.toDateString() === currentDate.toDateString();
      });
      
      if (hasVisitOnDate) {
        streak++;
      } else if (i > 0) {
        break; // Break streak if no visit found (but allow today to be empty)
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  // Calculate level based on visits
  const calculateLevel = (visits: number) => {
    if (visits < 10) return 1;
    if (visits < 25) return 2;
    if (visits < 50) return 3;
    if (visits < 100) return 4;
    return 5;
  };

  const currentLevel = calculateLevel(uniquePlaquesVisited);
  const nextLevelThreshold = currentLevel === 1 ? 10 : currentLevel === 2 ? 25 : currentLevel === 3 ? 50 : currentLevel === 4 ? 100 : 150;

  // Get recent visits with plaque data
  const getRecentVisitsWithPlaques = () => {
    return visits
      .slice(0, 3)
      .map(visit => {
        const plaque = plaques.find(p => p.id === visit.plaque_id);
        return {
          ...visit,
          plaque: plaque || { 
            id: visit.plaque_id, 
            title: `Plaque #${visit.plaque_id}`, 
            location: 'Unknown location' 
          }
        };
      });
  };

  // Get favorite collections
  const getFavoriteCollections = () => {
    return collections
      .filter(c => c.is_favorite)
      .slice(0, 3);
  };

  // Check which achievements are unlocked
  const getUnlockedAchievements = () => {
    return ACHIEVEMENTS.map(achievement => {
      let isUnlocked = false;
      
      switch (achievement.id) {
        case 'first_visit':
          isUnlocked = uniquePlaquesVisited >= 1;
          break;
        case 'collector':
          isUnlocked = totalCollections >= 5;
          break;
        case 'explorer':
          isUnlocked = uniquePlaquesVisited >= 25;
          break;
        case 'specialist':
          isUnlocked = uniquePlaquesVisited >= 50;
          break;
      }
      
      return {
        ...achievement,
        isUnlocked
      };
    });
  };

  // Calculate area exploration
  const getAreaExploration = () => {
    const visitedAreas = new Set();
    visits.forEach(visit => {
      const plaque = plaques.find(p => p.id === visit.plaque_id);
      if (plaque?.area) {
        visitedAreas.add(plaque.area);
      }
    });
    
    const totalAreas = 33; // Approximate number of London areas with plaques
    const visitedCount = visitedAreas.size;
    const percentage = Math.round((visitedCount / totalAreas) * 100);
    
    return { visitedCount, totalAreas, percentage };
  };

  const areaStats = getAreaExploration();
  const recentVisitsWithPlaques = getRecentVisitsWithPlaques();
  const favoriteCollections = getFavoriteCollections();
  const achievements = getUnlockedAchievements();

  // Handle edit profile - navigate to settings
  const handleEditProfile = () => {
    navigate('/settings');
  };

  // Handle settings
  const handleSettings = () => {
    navigate('/settings');
  };

  if (!user) {
    return (
      <PageContainer 
        activePage="profile"
        simplifiedFooter={true}
      >
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <User className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view your profile.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      activePage="profile"
      simplifiedFooter={true}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-4 overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/library')}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <span className="text-white/80 text-sm">Back to Library</span>
          </div>

          {/* Profile Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Profile Photo with Level Badge */}
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
                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  Level {currentLevel}
                </div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold">{user.displayName || 'Explorer'}</h1>
                <p className="opacity-90 mt-1">
                  Member since {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  {currentStreak > 0 && (
                    <span className="ml-2">• 🔥 {currentStreak} day streak</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleEditProfile}
              >
                <Edit size={16} className="mr-2" /> Edit Profile
              </Button>
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleSettings}
              >
                <Settings size={16} className="mr-2" /> Settings
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
              <div class="text-xs text-gray-500">Collections</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-green-600">{totalRoutes}</div>
              <div className="text-xs text-gray-500">Routes</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-bold text-amber-600">{thisMonthVisits}</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              Explorer Level {currentLevel}
            </Badge>
          </div>
        </div>


        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Visits */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="text-blue-500" size={18} />
                Recent Visits
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/library/visits')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Button>
            </div>
            
            {recentVisitsWithPlaques.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="mx-auto mb-2" size={32} />
                <p className="text-sm">No visits yet</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/discover')}
                >
                  Start Exploring
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVisitsWithPlaques.map((visit) => (
                  <div 
                    key={visit.id}
                    className="border p-3 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => navigate(`/plaque/${visit.plaque.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{visit.plaque.title}</h4>
                        <p className="text-sm text-gray-500">
                          {visit.plaque.location} • {formatTimeAgo(visit.visited_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Collections */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FolderOpen className="text-purple-500" size={18} />
                My Collections
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/library/collections')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Button>
            </div>
            
            {favoriteCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="mx-auto mb-2" size={32} />
                <p className="text-sm">No favorite collections yet</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/library/collections')}
                >
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteCollections.map((collection) => (
                  <div 
                    key={collection.id}
                    className="border p-3 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => navigate(`/library/collections/${collection.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${collection.color} rounded-lg flex items-center justify-center text-white`}>
                        {collection.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{collection.name}</h4>
                          <Star className="text-amber-500" size={14} fill="currentColor" />
                        </div>
                        <p className="text-sm text-gray-500">
                          {Array.isArray(collection.plaques) ? collection.plaques.length : collection.plaques} plaques • Updated {formatTimeAgo(collection.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/discover?view=map')}
              className="h-16 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center"
            >
              <MapPin size={20} className="mb-1" />
              Explore Map
            </Button>
            
            <Button 
              onClick={() => navigate('/library')}
              className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center"
            >
              <BookOpen size={20} className="mb-1" />
              My Library
            </Button>
            
            <Button 
              onClick={() => navigate('/discover?view=map')}
              className="h-16 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center"
            >
              <Route size={20} className="mb-1" />
              Plan Route
            </Button>
            
            <Button 
              onClick={() => navigate('/library/collections')}
              className="h-16 bg-amber-600 hover:bg-amber-700 flex flex-col items-center justify-center"
            >
              <Plus size={20} className="mb-1" />
              New Collection
            </Button>
          </div>
        </div>

        {/* Achievements/Badges */}
        <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-amber-500" size={20} />
            Recent Achievements
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`text-center p-4 rounded-lg border ${
                  achievement.isUnlocked 
                    ? achievement.colorClass 
                    : 'bg-gray-100 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className={`font-medium text-sm ${
                  achievement.isUnlocked ? '' : 'text-gray-600'
                }`}>
                  {achievement.name}
                </h4>
                <p className={`text-xs ${
                  achievement.isUnlocked ? '' : 'text-gray-500'
                }`}>
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;