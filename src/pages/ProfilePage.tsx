// src/pages/ProfilePage.tsx - Mobile-optimized dashboard
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User, 
  Settings, 
  Edit,
  BookOpen,
  MapPin,
  Route,
  Plus,
  Star,
  CheckCircle,
  TrendingUp,
  Award,
  FolderOpen,
  Eye,
  Share2
} from 'lucide-react';
import { PageContainer } from '@/components';
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useCollections } from '@/hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import { usePlaques } from '@/hooks/usePlaques';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/utils/timeUtils';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

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
  const { user } = useAuth();
  const { collections } = useCollections();
  const { visits } = useVisitedPlaques();
  const { routes } = useRoutes();
  const { plaques } = usePlaques();
  
  // Mobile-specific state
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState<'visits' | 'collections' | 'routes' | null>(null);

  // Calculate stats
  const totalCollections = collections.length;
  const totalRoutes = routes.length;
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;
  
  // Calculate this month's visits
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
// Line 94 - Remove toDate() calls since visited_at is already Date
const thisMonthVisits = visits.filter(visit => {
  const visitDate = visit.visited_at instanceof Date 
    ? visit.visited_at 
    : new Date(visit.visited_at);
  return visitDate >= firstDayOfMonth;
}).length;

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
  const progressToNext = currentLevel === 5 ? 100 : ((uniquePlaquesVisited / nextLevelThreshold) * 100);

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
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  // Mobile-optimized handlers
  const handleMobileBack = () => {
    triggerHapticFeedback('light');
    navigate('/library');
  };

  const handleEditProfile = () => {
    triggerHapticFeedback('light');
    navigate('/settings');
  };

  const handleSettings = () => {
    triggerHapticFeedback('light');
    navigate('/settings');
  };

  const handleQuickAction = (action: string) => {
    triggerHapticFeedback('light');
    
    switch (action) {
      case 'explore':
        navigate('/discover?view=map');
        break;
      case 'library':
        navigate('/library');
        break;
      case 'route':
        navigate('/discover?view=map');
        break;
      case 'collection':
        navigate('/library/collections');
        break;
    }
  };

  const handleStatDetail = (type: 'visits' | 'collections' | 'routes') => {
    triggerHapticFeedback('light');
    setSelectedStatType(type);
    setShowStatsDetail(true);
  };

const handleShare = async () => {
  triggerHapticFeedback('light');
  
  const shareText = `I've visited ${uniquePlaquesVisited} historic plaques in London using Plaquer! 🏛️`;
  const shareUrl = window.location.origin;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'My Plaquer Journey',
        text: shareText,
        url: shareUrl
      });
    } catch (error) {
      // Proper error type checking
      if (error instanceof Error && error.name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success('Shared to clipboard!');
      }
    }
  } else {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    toast.success('Shared to clipboard!');
  }
};

  // Profile actions for mobile header
  const profileActions = [
    {
      label: 'Edit Profile',
      icon: <Edit size={16} />,
      onClick: handleEditProfile
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: handleSettings
    },
    {
      label: 'Share Progress',
      icon: <Share2 size={16} />,
      onClick: handleShare
    }
  ];

  if (!user) {
    return (
      <PageContainer 
        activePage="profile"
        simplifiedFooter={true}
        paddingBottom="mobile-nav"
      >
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <User className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view your profile.</p>
            <MobileButton onClick={() => navigate('/')} touchOptimized>
              Back to Home
            </MobileButton>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Desktop Header (hidden on mobile)
  const renderDesktopHeader = () => (
    <section className="hidden md:block relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
        <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Back Button */}
        <div className="flex items-center gap-2 mb-4">
          <MobileButton 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/library')}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            touchOptimized
          >
            <ArrowLeft size={18} />
          </MobileButton>
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
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <MobileButton 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleEditProfile}
              touchOptimized
            >
              <Edit size={16} className="mr-2" /> Edit Profile
            </MobileButton>
            <MobileButton 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleSettings}
              touchOptimized
            >
              <Settings size={16} className="mr-2" /> Settings
            </MobileButton>
          </div>
        </div>
      </div>
    </section>
  );

  // Mobile Header
  const renderMobileHeader = () => (
    <div className="md:hidden">
      <MobileHeader
        title={user.displayName || 'Explorer'}
        subtitle={`Level ${currentLevel} • ${uniquePlaquesVisited} plaques visited`}
        onBack={handleMobileBack}
        actions={profileActions}
        className="bg-blue-600 text-white border-blue-700"
      />
    </div>
  );

  // Mobile Profile Card
  const renderMobileProfileCard = () => (
    <div className="md:hidden -mt-4 mx-4 mb-6 relative z-10">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Profile Photo */}
          <div className="relative">
            {user.photoURL ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100">
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                <User size={24} className="text-blue-600" />
              </div>
            )}
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              L{currentLevel}
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user.displayName || 'Explorer'}</h2>
            <p className="text-sm text-gray-500">
              Member since {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Level {currentLevel} Explorer</span>
            <span className="text-gray-500">
              {currentLevel === 5 ? 'Max Level!' : `${nextLevelThreshold - uniquePlaquesVisited} to Level ${currentLevel + 1}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{uniquePlaquesVisited}</div>
            <div className="text-xs text-gray-500">Plaques</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{totalCollections}</div>
            <div className="text-xs text-gray-500">Collections</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{totalRoutes}</div>
            <div className="text-xs text-gray-500">Routes</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer 
      activePage="profile"
      simplifiedFooter={true}
      paddingBottom="mobile-nav"
    >
      {/* Desktop Header */}
      {renderDesktopHeader()}
      
      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Mobile Profile Card */}
      {isMobile() && renderMobileProfileCard()}
      
      <div className="container mx-auto max-w-5xl px-4">
        {/* Desktop Stats Banner */}
        <div className="md:block bg-white rounded-lg shadow-sm p-3 flex justify-between items-center -mt-5 mb-6 relative z-10">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Recent Visits */}
          <div className="bg-white shadow-sm rounded-xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="text-blue-500" size={18} />
                Recent Visits
              </h3>
              <MobileButton 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  triggerHapticFeedback('light');
                  navigate('/library/visits');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                touchOptimized
              >
                View All
              </MobileButton>
            </div>
            
            {recentVisitsWithPlaques.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <MapPin className="mx-auto mb-2" size={32} />
                <p className="text-sm">No visits yet</p>
                <MobileButton 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleQuickAction('explore')}
                  touchOptimized
                >
                  Start Exploring
                </MobileButton>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVisitsWithPlaques.map((visit) => (
                  <div 
                    key={visit.id}
                    className="border p-3 rounded-lg hover:border-blue-300 cursor-pointer transition-colors touch-target"
                    onClick={() => {
                      triggerHapticFeedback('selection');
                      navigate(`/plaque/${visit.plaque.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{visit.plaque.title}</h4>
                        <p className="text-sm text-gray-500 truncate">
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
          <div className="bg-white shadow-sm rounded-xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FolderOpen className="text-purple-500" size={18} />
                My Collections
              </h3>
              <MobileButton 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  triggerHapticFeedback('light');
                  navigate('/library/collections');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                touchOptimized
              >
                View All
              </MobileButton>
            </div>
            
            {favoriteCollections.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <FolderOpen className="mx-auto mb-2" size={32} />
                <p className="text-sm">No favorite collections yet</p>
                <MobileButton 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleQuickAction('collection')}
                  touchOptimized
                >
                  Create Collection
                </MobileButton>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteCollections.map((collection) => (
                  <div 
                    key={collection.id}
                    className="border p-3 rounded-lg hover:border-blue-300 cursor-pointer transition-colors touch-target"
                    onClick={() => {
                      triggerHapticFeedback('selection');
                      navigate(`/library/collections/${collection.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${collection.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                        {collection.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{collection.name}</h4>
                          <Star className="text-amber-500 flex-shrink-0" size={14} fill="currentColor" />
                        </div>
                        <p className="text-sm text-gray-500 truncate">
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

        {/* Mobile Stats Grid */}
        <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
          <div 
            className="bg-white rounded-xl shadow-sm p-4 touch-target"
            onClick={() => handleStatDetail('visits')}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{uniquePlaquesVisited}</div>
              <div className="text-sm text-gray-500 mb-2">Plaques Visited</div>
              <div className="text-xs text-green-600">+{thisMonthVisits} this month</div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm p-4 touch-target"
            onClick={() => handleStatDetail('collections')}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{totalCollections}</div>
              <div className="text-sm text-gray-500 mb-2">Collections</div>
              <div className="text-xs text-blue-600">{collections.filter(c => c.is_favorite).length} favorites</div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm p-4 touch-target"
            onClick={() => handleStatDetail('routes')}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{totalRoutes}</div>
              <div className="text-sm text-gray-500 mb-2">Routes</div>
              <div className="text-xs text-amber-600">
                {routes.reduce((sum, r) => sum + r.total_distance, 0).toFixed(1)} km total
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">{areaStats.visitedCount}</div>
              <div className="text-sm text-gray-500 mb-2">Areas Explored</div>
              <div className="text-xs text-purple-600">{areaStats.percentage}% of London</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-xl p-4 lg:p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4">
            <MobileButton 
              onClick={() => handleQuickAction('explore')}
              className="h-14 lg:h-16 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center"
              touchOptimized
            >
              <MapPin size={20} className="mb-1" />
              Explore Map
            </MobileButton>
            
            <MobileButton 
              onClick={() => handleQuickAction('library')}
              className="h-14 lg:h-16 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center"
              touchOptimized
            >
              <BookOpen size={20} className="mb-1" />
              My Library
            </MobileButton>
            
            <MobileButton 
              onClick={() => handleQuickAction('route')}
              className="h-14 lg:h-16 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center"
              touchOptimized
            >
              <Route size={20} className="mb-1" />
              Plan Route
            </MobileButton>
            
            <MobileButton 
              onClick={() => handleQuickAction('collection')}
              className="h-14 lg:h-16 bg-amber-600 hover:bg-amber-700 flex flex-col items-center justify-center"
              touchOptimized
            >
              <Plus size={20} className="mb-1" />
              New Collection
            </MobileButton>
          </div>
        </div>

        {/* Achievements/Badges */}
        <div className="bg-white shadow-sm rounded-xl p-4 lg:p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              Achievements
            </h3>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {unlockedCount} / {ACHIEVEMENTS.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`text-center p-3 lg:p-4 rounded-lg border transition-all ${
                  achievement.isUnlocked 
                    ? `${achievement.colorClass} transform hover:scale-105` 
                    : 'bg-gray-100 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-2xl lg:text-3xl mb-2">{achievement.icon}</div>
                <h4 className={`font-medium text-xs lg:text-sm ${
                  achievement.isUnlocked ? '' : 'text-gray-600'
                }`}>
                  {achievement.name}
                </h4>
                <p className={`text-xs ${
                  achievement.isUnlocked ? '' : 'text-gray-500'
                }`}>
                  {achievement.description}
                </p>
                {achievement.isUnlocked && (
                  <div className="mt-2">
<Badge className="bg-white/50 text-current border-current/20">
  Unlocked!
</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button for mobile */}
      {isMobile() && (
        <FloatingActionButton
          onClick={handleShare}
          icon={<Share2 size={20} />}
          variant="default"
        />
      )}

      {/* Mobile Stats Detail Dialog */}
      <MobileDialog
        isOpen={showStatsDetail}
        onClose={() => setShowStatsDetail(false)}
        title={
          selectedStatType === 'visits' ? 'Visit Statistics' :
          selectedStatType === 'collections' ? 'Collection Statistics' :
          selectedStatType === 'routes' ? 'Route Statistics' : 'Statistics'
        }
        size="md"
      >
        <div className="p-4">
          {selectedStatType === 'visits' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{uniquePlaquesVisited}</div>
                  <div className="text-sm text-gray-600">Total Visits</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{thisMonthVisits}</div>
                  <div className="text-sm text-gray-600">This Month</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Area Coverage</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{areaStats.visitedCount} / {areaStats.totalAreas} areas</span>
                  <span className="font-medium text-purple-600">{areaStats.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${areaStats.percentage}%` }}
                  ></div>
                </div>
              </div>

              <MobileButton
                onClick={() => {
                  setShowStatsDetail(false);
                  navigate('/library/visits');
                }}
                className="w-full"
                touchOptimized
              >
                <Eye size={16} className="mr-2" />
                View All Visits
              </MobileButton>
            </div>
          )}

          {selectedStatType === 'collections' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{totalCollections}</div>
                  <div className="text-sm text-gray-600">Total Collections</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-amber-600">{collections.filter(c => c.is_favorite).length}</div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Total Plaques in Collections</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {collections.reduce((sum, c) => sum + (Array.isArray(c.plaques) ? c.plaques.length : 0), 0)}
                </div>
              </div>

              <MobileButton
                onClick={() => {
                  setShowStatsDetail(false);
                  navigate('/library/collections');
                }}
                className="w-full"
                touchOptimized
              >
                <FolderOpen size={16} className="mr-2" />
                View All Collections
              </MobileButton>
            </div>
          )}

          {selectedStatType === 'routes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{totalRoutes}</div>
                  <div className="text-sm text-gray-600">Total Routes</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {routes.reduce((sum, r) => sum + r.total_distance, 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Total KM</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Average Route Distance</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {totalRoutes > 0 ? (routes.reduce((sum, r) => sum + r.total_distance, 0) / totalRoutes).toFixed(1) : '0'} km
                </div>
              </div>

              <MobileButton
                onClick={() => {
                  setShowStatsDetail(false);
                  navigate('/library/routes');
                }}
                className="w-full"
                touchOptimized
              >
                <Route size={16} className="mr-2" />
                View All Routes
              </MobileButton>
            </div>
          )}
        </div>
      </MobileDialog>

      {/* Mobile Profile Actions Dialog */}
      <MobileDialog
        isOpen={showProfileActions}
        onClose={() => setShowProfileActions(false)}
        title="Profile Actions"
        size="sm"
      >
        <div className="p-4 space-y-3">
          <MobileButton
            onClick={() => {
              setShowProfileActions(false);
              handleEditProfile();
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Edit size={16} className="mr-3" />
            Edit Profile
          </MobileButton>
          
          <MobileButton
            onClick={() => {
              setShowProfileActions(false);
              handleSettings();
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Settings size={16} className="mr-3" />
            Settings
          </MobileButton>
          
          <MobileButton
            onClick={() => {
              setShowProfileActions(false);
              handleShare();
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Share2 size={16} className="mr-3" />
            Share Progress
          </MobileButton>
        </div>
      </MobileDialog>
    </PageContainer>
  );
};

export default ProfilePage;