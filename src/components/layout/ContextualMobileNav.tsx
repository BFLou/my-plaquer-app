// src/components/layout/ContextualMobileNav.tsx
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  BookOpen, 
  User, 
  Map,
  List,
  Grid,
  ArrowLeft,
  Navigation
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { triggerHapticFeedback, isMobile } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';

interface ContextualMobileNavProps {
  currentView?: 'map' | 'list' | 'grid';
  onViewChange?: (view: 'map' | 'list' | 'grid') => void;
  context?: 'discover' | 'library' | 'profile' | 'standard';
  onBack?: () => void;
  showBack?: boolean;
  routeMode?: boolean;
  onToggleRoute?: () => void;
  customActions?: Array<{
    icon: React.ReactElement;
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
  }>;
}

export const ContextualMobileNav: React.FC<ContextualMobileNavProps> = ({
  currentView,
  onViewChange,
  context = 'standard',
  onBack,
  showBack = false,
  routeMode = false,
  onToggleRoute,
  customActions = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const safeArea = useSafeArea();
  const mobile = isMobile();

  // Generate navigation items based on context
  type NavItem = {
    icon: React.ReactElement;
    label: string;
    onClick: () => void;
    active: boolean;
    requiresAuth?: boolean;
    badge?: number;
  };

  const navItems: NavItem[] = useMemo(() => {
    if (context === 'discover' && currentView === 'map') {
      // Map view navigation - focus on view switching and essential actions
      return [
        {
          icon: <List size={20} />,
          label: 'List',
          onClick: () => {
            triggerHapticFeedback('selection');
            onViewChange?.('list');
          },
          active: false
        },
        {
          icon: <Grid size={20} />,
          label: 'Grid', 
          onClick: () => {
            triggerHapticFeedback('selection');
            onViewChange?.('grid');
          },
          active: false
        },
        {
          icon: <Map size={20} />,
          label: 'Map',
          onClick: () => {},
          active: true
        },
        {
          icon: <Home size={20} />,
          label: 'Home',
          onClick: () => {
            triggerHapticFeedback('selection');
            navigate('/');
          },
          active: false
        }
      ];
    }

    if (context === 'discover') {
      // Standard discover navigation with view switching
      return [
        {
          icon: <Map size={20} />,
          label: 'Map',
          onClick: () => {
            triggerHapticFeedback('selection');
            onViewChange?.('map');
          },
          active: currentView === 'map'
        },
        {
          icon: <Grid size={20} />,
          label: 'Grid',
          onClick: () => {
            triggerHapticFeedback('selection');
            onViewChange?.('grid');
          },
          active: currentView === 'grid'
        },
        {
          icon: <List size={20} />,
          label: 'List',
          onClick: () => {
            triggerHapticFeedback('selection');
            onViewChange?.('list');
          },
          active: currentView === 'list'
        },
        {
          icon: <Home size={20} />,
          label: 'Home',
          onClick: () => {
            triggerHapticFeedback('selection');
            navigate('/');
          },
          active: location.pathname === '/'
        }
      ];
    }

    // Standard navigation for other contexts
    return [
      {
        icon: <Home size={20} />,
        label: 'Home',
        onClick: () => {
          triggerHapticFeedback('selection');
          navigate('/');
        },
        active: location.pathname === '/'
      },
      {
        icon: <Search size={20} />,
        label: 'Discover',
        onClick: () => {
          triggerHapticFeedback('selection');
          navigate('/discover');
        },
        active: location.pathname.startsWith('/discover')
      },
      {
        icon: <BookOpen size={20} />,
        label: 'Library',
        onClick: () => {
          if (!user) {
            triggerHapticFeedback('error');
            navigate('/signin', { 
              state: { 
                featureName: 'access your library',
                redirectTo: '/library'
              }
            });
            return;
          }
          triggerHapticFeedback('selection');
          navigate('/library');
        },
        active: location.pathname.startsWith('/library'),
        requiresAuth: true
      },
      {
        icon: <User size={20} />,
        label: 'Profile',
        onClick: () => {
          if (!user) {
            triggerHapticFeedback('error');
            navigate('/signin', {
              state: {
                featureName: 'access your profile',
                redirectTo: '/profile'
              }
            });
            return;
          }
          triggerHapticFeedback('selection');
          navigate('/profile');
        },
        active: location.pathname.startsWith('/profile'),
        requiresAuth: true
      }
    ];
  }, [context, currentView, location.pathname, user, navigate, onViewChange]);

  // Combine custom actions with standard nav items
  const allItems = useMemo(() => {
    const items = [...navItems];
    
    // Add custom actions
    customActions.forEach(action => {
      if (action.icon) {
        items.push({
          icon: action.icon,
          label: action.label,
          onClick: action.onClick,
          active: action.active || false,
          badge: action.badge
        });
      }
    });

    // Add route toggle if in route mode context
    if (routeMode && onToggleRoute) {
      items.unshift({
        icon: <Navigation size={20} />,
        label: 'Route',
        onClick: () => {
          triggerHapticFeedback('medium');
          onToggleRoute();
        },
        active: true,
        badge: undefined
      });
    }

    return items;
  }, [navItems, customActions, routeMode, onToggleRoute]);

  if (!mobile) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-white/98 backdrop-blur border-t border-gray-200 shadow-lg"
      style={{
        paddingBottom: safeArea.bottom
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {/* Back button - only show if specified */}
        {showBack && onBack && (
          <button
            onClick={() => {
              triggerHapticFeedback('selection');
              onBack();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] relative active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-600 mb-1" />
            <span className="text-xs font-medium text-gray-600">Back</span>
          </button>
        )}

        {/* Main navigation items */}
        {allItems.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] relative active:scale-95 ${
              item.active 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            {/* Icon with badge support */}
            <div className="relative mb-1">
              {item.icon}
              
              {item.badge && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                </div>
              )}
              
              {/* Auth required indicator */}
              {(item as any).requiresAuth && !user && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white" />
              )}
            </div>
            
            {/* Label */}
            <span className={`text-xs font-medium ${
              item.active ? 'font-semibold' : ''
            }`}>
              {item.label}
            </span>
            
            {/* Active indicator */}
            {item.active && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Hook for managing contextual navigation state
export const useContextualNavigation = () => {
  const location = useLocation();
  
  const getContext = (): 'discover' | 'library' | 'profile' | 'standard' => {
    if (location.pathname.startsWith('/discover')) return 'discover';
    if (location.pathname.startsWith('/library')) return 'library';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'standard';
  };

  const shouldShowBack = () => {
    // Show back button on detail pages or nested routes
    const detailRoutes = ['/plaque/', '/collection/', '/route/'];
    return detailRoutes.some(route => location.pathname.includes(route));
  };

  return {
    context: getContext(),
    shouldShowBack: shouldShowBack(),
    currentPath: location.pathname
  };
};