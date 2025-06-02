// src/pages/PlaqueDetailPage.tsx - Enhanced with smart context detection and progressive disclosure
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Plus, 
  Navigation, 
  ExternalLink, 
  Calendar, 
  User, 
  Building, 
  Clock, 
  MapPin, 
  Share2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Route as RouteIcon,
  Search,
  Eye,
  Copy,
  Home
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adaptPlaquesData } from '@/utils/plaqueAdapter';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollections } from '@/hooks/useCollection';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import PlaqueImage from '@/components/plaques/PlaqueImage';
import AddToCollectionDialog from '@/components/plaques/AddToCollectionDialog';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Context detection types
type EntryContext = 'direct' | 'collection' | 'route' | 'search' | 'discover';

interface ContextInfo {
  type: EntryContext;
  data?: {
    collectionId?: string;
    collectionName?: string;
    routeId?: string;
    routeName?: string;
    searchQuery?: string;
    progress?: string;
    nextItem?: string;
  };
}

const PlaqueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // State
  const [plaque, setPlaque] = useState<Plaque | null>(null);
  const [nearbyPlaques, setNearbyPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Visit dialog state
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  
  // Hooks
  const { isPlaqueVisited, markAsVisited, getVisitInfo } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { collections } = useCollections();

  // Smart context detection
  const contextInfo = useMemo((): ContextInfo => {
    const referrer = document.referrer;
    const fromParam = searchParams.get('from');
    const collectionParam = searchParams.get('collection');
    const routeParam = searchParams.get('route');
    const searchParam = searchParams.get('search');
    
    console.log('Context detection:', { referrer, fromParam, collectionParam, routeParam, searchParam });
    
    // Collection context - improved detection
    if (collectionParam || 
        referrer.includes('/library/collections/') || 
        fromParam === 'collection' ||
        location.pathname.includes('/collection')) {
      
      let collectionId = collectionParam;
      
      // Extract collection ID from referrer if not in params
      if (!collectionId && referrer.includes('/collections/')) {
        const referrerParts = referrer.split('/collections/')[1];
        collectionId = referrerParts?.split('/')[0]?.split('?')[0];
      }
      
      // Try to get from current location state if available
      if (!collectionId && location.state?.collectionId) {
        collectionId = location.state.collectionId;
      }
      
      const collection = collections.find(c => c.id === collectionId);
      
      console.log('Collection context detected:', { collectionId, collection });
      
      return {
        type: 'collection',
        data: {
          collectionId,
          collectionName: collection?.name || 'Collection',
          progress: searchParams.get('progress') || undefined
        }
      };
    }
    
    // Route context - improved detection
    if (routeParam || 
        referrer.includes('/library/routes/') || 
        fromParam === 'route') {
      
      let routeId = routeParam;
      
      // Extract route ID from referrer if not in params
      if (!routeId && referrer.includes('/routes/')) {
        const referrerParts = referrer.split('/routes/')[1];
        routeId = referrerParts?.split('/')[0]?.split('?')[0];
      }
      
      return {
        type: 'route',
        data: {
          routeId,
          routeName: searchParams.get('routeName') || 'Route',
          progress: searchParams.get('progress') || undefined,
          nextItem: searchParams.get('next') || undefined
        }
      };
    }
    
    // Search context
    if (searchParam || 
        (referrer.includes('/discover') && referrer.includes('search=')) ||
        fromParam === 'search') {
      
      let searchQuery = searchParam;
      
      // Extract search from referrer if not in params
      if (!searchQuery && referrer.includes('search=')) {
        const referrerUrl = new URL(referrer);
        searchQuery = referrerUrl.searchParams.get('search') || 'Unknown';
      }
      
      return {
        type: 'search',
        data: {
          searchQuery: searchQuery || 'Unknown'
        }
      };
    }
    
    // Discover context
    if (fromParam === 'discover' || referrer.includes('/discover')) {
      return { type: 'discover' };
    }
    
    // Library context (if coming from main library page)
    if (referrer.includes('/library') && !referrer.includes('/collections') && !referrer.includes('/routes')) {
      return { type: 'discover' }; // Treat as discover for now
    }
    
    // Direct access
    return { type: 'direct' };
  }, [searchParams, collections, location]);

  // Load plaque data
  useEffect(() => {
    const loadPlaqueData = async () => {
      if (!id) {
        navigate('/discover');
        return;
      }

      try {
        setLoading(true);
        
        const { default: plaqueData } = await import('@/data/plaque_data.json');
        const adaptedData = adaptPlaquesData(plaqueData);
        setAllPlaques(adaptedData);
        
        const plaqueId = parseInt(id);
        const foundPlaque = adaptedData.find(p => p.id === plaqueId);
        
        if (!foundPlaque) {
          toast.error('Plaque not found');
          navigate('/discover');
          return;
        }
        
        const plaqueWithStatus = {
          ...foundPlaque,
          visited: foundPlaque.visited || isPlaqueVisited(foundPlaque.id)
        };
        
        setPlaque(plaqueWithStatus);
        
        // Find nearby plaques
        const nearby = adaptedData
          .filter(p => 
            p.id !== plaqueId && 
            (
              (p.postcode === foundPlaque.postcode) ||
              (p.profession === foundPlaque.profession && foundPlaque.profession) ||
              (p.area === foundPlaque.area && foundPlaque.area)
            )
          )
          .slice(0, 6);
        
        setNearbyPlaques(nearby);
        
      } catch (error) {
        console.error('Error loading plaque data:', error);
        toast.error('Failed to load plaque data');
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    loadPlaqueData();
  }, [id, navigate, isPlaqueVisited]);

  // Helper functions
  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const isValidValue = (value: any): boolean => {
    const str = safeString(value).trim();
    return str !== '' && str !== 'Unknown' && str !== 'unknown';
  };

  const getLifeYears = () => {
    const bornIn = safeString(plaque?.lead_subject_born_in).trim();
    const diedIn = safeString(plaque?.lead_subject_died_in).trim();
    
    if (isValidValue(bornIn) && isValidValue(diedIn)) {
      return `(${bornIn} - ${diedIn})`;
    }
    return '';
  };

  // Find collections containing this plaque
  const plaqueCollections = useMemo(() => {
    if (!collections || !plaque) return [];
    
    return collections.filter(collection => {
      const collectionPlaques = Array.isArray(collection.plaques) 
        ? collection.plaques 
        : [];
      
      return collectionPlaques.includes(plaque.id);
    });
  }, [collections, plaque]);

  // Event handlers
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleBack = useCallback(() => {
    // Smart back navigation based on context
    switch (contextInfo.type) {
      case 'collection':
        if (contextInfo.data?.collectionId) {
          navigate(`/library/collections/${contextInfo.data.collectionId}`);
        } else {
          navigate('/library/collections');
        }
        break;
      case 'route':
        if (contextInfo.data?.routeId) {
          navigate(`/library/routes/${contextInfo.data.routeId}`);
        } else {
          navigate('/library/routes');
        }
        break;
      case 'search':
      case 'discover':
        const searchQuery = contextInfo.data?.searchQuery;
        navigate(searchQuery ? `/discover?search=${encodeURIComponent(searchQuery)}` : '/discover');
        break;
      default:
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/discover');
        }
    }
  }, [contextInfo, navigate]);

  const handleFavoriteToggle = useCallback(() => {
    if (!plaque) return;
    toggleFavorite(plaque.id);
  }, [plaque, toggleFavorite]);

  const handleMarkVisitedClick = () => {
    if (!plaque || isPlaqueVisited(plaque.id)) return;
    setVisitDate(new Date());
    setVisitNotes('');
    setShowVisitDialog(true);
  };

  const handleVisitSubmit = async () => {
    if (!plaque) return;
    
    setIsMarkingVisited(true);
    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      setPlaque(prev => prev ? { ...prev, visited: true } : null);
      toast.success("Plaque marked as visited");
      setShowVisitDialog(false);
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsMarkingVisited(false);
    }
  };

  const handleGetDirections = () => {
    if (!plaque) return;
    
    if (plaque.latitude && plaque.longitude) {
      const url = `https://maps.google.com/?q=${plaque.latitude},${plaque.longitude}`;
      window.open(url, '_blank');
    } else if (plaque.address || plaque.location) {
      const location = safeString(plaque.address || plaque.location);
      const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    if (!plaque) return;
    
    const shareUrl = `${window.location.origin}/plaque/${plaque.id}`;
    const shareData = {
      title: plaque.title,
      text: `Check out this historic plaque: ${plaque.title}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  // Render context-specific breadcrumb
  const renderBreadcrumb = () => {
    const baseClasses = "flex items-center gap-2 mb-6 text-sm";
    
    switch (contextInfo.type) {
      case 'collection':
        return (
          <div className={baseClasses}>
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft size={16} />
            </Button>
            <span className="text-gray-500">My Library</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">Collections</span>
            <span className="text-gray-300">/</span>
            <span className="text-purple-600 font-medium truncate max-w-xs">
              {contextInfo.data?.collectionName}
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{plaque?.title}</span>
          </div>
        );
      
      case 'route':
        return (
          <div className={baseClasses}>
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft size={16} />
            </Button>
            <span className="text-gray-500">My Library</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">Routes</span>
            <span className="text-gray-300">/</span>
            <span className="text-green-600 font-medium truncate max-w-xs">
              {contextInfo.data?.routeName}
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{plaque?.title}</span>
          </div>
        );
      
      case 'search':
        return (
          <div className={baseClasses}>
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft size={16} />
            </Button>
            <span className="text-gray-500">Discover</span>
            <span className="text-gray-300">/</span>
            <span className="text-blue-600 font-medium">
              Search: "{contextInfo.data?.searchQuery}"
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{plaque?.title}</span>
          </div>
        );
      
      default:
        return (
          <div className={baseClasses}>
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft size={16} />
            </Button>
            <span className="text-gray-500">Discover</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{plaque?.title}</span>
          </div>
        );
    }
  };

  // Render context banner
  const renderContextBanner = () => {
    switch (contextInfo.type) {
      case 'collection':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📚
                </div>
                <div>
                  <p className="font-semibold text-purple-900">{contextInfo.data?.collectionName}</p>
                  <p className="text-sm text-purple-700">
                    {contextInfo.data?.progress || 'Part of your collection'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/library/collections/${contextInfo.data?.collectionId}`)}
                className="border-purple-200 text-purple-600 hover:bg-purple-100"
              >
                View Collection
              </Button>
            </div>
          </div>
        );
      
      case 'route':
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
                  🚶
                </div>
                <div>
                  <p className="font-semibold text-green-900">{contextInfo.data?.routeName}</p>
                  <p className="text-sm text-green-700">
                    {contextInfo.data?.progress || 'Part of your walking route'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGetDirections}
                  className="border-green-200 text-green-600 hover:bg-green-100"
                >
                  <Navigation size={14} className="mr-1" />
                  Directions
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/library/routes/${contextInfo.data?.routeId}`)}
                  className="border-green-200 text-green-600 hover:bg-green-100"
                >
                  View Route
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 'search':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                  🔍
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Search Result</p>
                  <p className="text-sm text-blue-700">
                    From search: "{contextInfo.data?.searchQuery}"
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBack}
                className="border-blue-200 text-blue-600 hover:bg-blue-100"
              >
                <Search size={14} className="mr-1" />
                Back to Results
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render action buttons based on context
  const renderActionButtons = () => {
    const isVisited = plaque?.visited || (plaque && isPlaqueVisited(plaque.id));
    const isFav = plaque && isFavorite(plaque.id);
    
    // Primary action varies by context
    let primaryAction;
    let secondaryActions = [];
    
    switch (contextInfo.type) {
      case 'collection':
        primaryAction = (
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate(`/library/collections/${contextInfo.data?.collectionId}`)}
          >
            📖 Back to Collection
          </Button>
        );
        secondaryActions = [
          {
            icon: <Star size={16} className={`mr-1 ${isFav ? 'fill-current' : ''}`} />,
            label: isFav ? 'Favorited' : 'Favorite',
            onClick: handleFavoriteToggle,
            className: isFav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
          },
          {
            icon: <Navigation size={16} className="mr-1" />,
            label: 'Directions',
            onClick: handleGetDirections
          },
          {
            icon: <Share2 size={16} className="mr-1" />,
            label: 'Share',
            onClick: handleShare
          },
          !isVisited ? {
            icon: <CheckCircle size={16} className="mr-1" />,
            label: 'Mark Visited',
            onClick: handleMarkVisitedClick
          } : null
        ].filter(Boolean);
        break;
        
      case 'route':
        primaryAction = (
          <Button 
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={handleGetDirections}
          >
            🧭 Start Navigation
          </Button>
        );
        secondaryActions = [
          {
            icon: <Plus size={16} className="mr-1" />,
            label: 'Add to Collection',
            onClick: () => setShowAddToCollection(true)
          },
          {
            icon: <Star size={16} className={`mr-1 ${isFav ? 'fill-current' : ''}`} />,
            label: isFav ? 'Favorited' : 'Favorite',
            onClick: handleFavoriteToggle,
            className: isFav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
          },
          {
            icon: <Share2 size={16} className="mr-1" />,
            label: 'Share',
            onClick: handleShare
          },
          !isVisited ? {
            icon: <CheckCircle size={16} className="mr-1" />,
            label: 'Mark Visited',
            onClick: handleMarkVisitedClick
          } : null
        ].filter(Boolean);
        break;
        
      default:
        // For discover, search, or direct access
        if (!isVisited) {
          primaryAction = (
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleMarkVisitedClick}
            >
              ✓ Mark as Visited
            </Button>
          );
          secondaryActions = [
            {
              icon: <Plus size={16} className="mr-1" />,
              label: 'Add to Collection',
              onClick: () => setShowAddToCollection(true)
            },
            {
              icon: <Star size={16} className={`mr-1 ${isFav ? 'fill-current' : ''}`} />,
              label: isFav ? 'Favorited' : 'Favorite',
              onClick: handleFavoriteToggle,
              className: isFav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
            },
            {
              icon: <Navigation size={16} className="mr-1" />,
              label: 'Directions',
              onClick: handleGetDirections
            },
            {
              icon: <Share2 size={16} className="mr-1" />,
              label: 'Share',
              onClick: handleShare
            }
          ];
        } else {
          // If already visited, prioritize adding to collection
          primaryAction = (
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowAddToCollection(true)}
            >
              💜 Add to Collection
            </Button>
          );
          secondaryActions = [
            {
              icon: <Star size={16} className={`mr-1 ${isFav ? 'fill-current' : ''}`} />,
              label: isFav ? 'Favorited' : 'Favorite',
              onClick: handleFavoriteToggle,
              className: isFav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
            },
            {
              icon: <Navigation size={16} className="mr-1" />,
              label: 'Directions',
              onClick: handleGetDirections
            },
            {
              icon: <Share2 size={16} className="mr-1" />,
              label: 'Share',
              onClick: handleShare
            }
          ];
        }
    }

    return (
      <div className="space-y-3">
        {primaryAction}
        {secondaryActions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={action.onClick}
                className={`py-2.5 px-3 rounded-lg font-medium ${action.className || ''}`}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Loading and error states
  if (loading) {
    return (
      <PageContainer activePage="discover" hasFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plaque details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!plaque) {
    return (
      <PageContainer activePage="discover" hasFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Plaque Not Found</h1>
            <p className="text-gray-600 mb-6">The plaque you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/discover')}>
              Browse All Plaques
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Computed values
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const visitInfo = isVisited ? getVisitInfo(plaque.id) : null;
  const plaqueColor = safeString(plaque.color || plaque.colour) || 'unknown';
  const locationDisplay = safeString(plaque.location || plaque.address);
  const imageUrl = plaque.image || plaque.main_photo;
  const lifeYears = getLifeYears();

  const formatVisitDate = () => {
    if (!visitInfo?.visited_at) return '';
    try {
      const date = visitInfo.visited_at.toDate
        ? visitInfo.visited_at.toDate()
        : new Date(visitInfo.visited_at);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <PageContainer activePage="discover" hasFooter={false}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* Smart Breadcrumb */}
          {renderBreadcrumb()}
          
          {/* Context Banner */}
          {renderContextBanner()}
          
          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Hero Image */}
            <div className="relative h-64 bg-blue-50">
              <PlaqueImage 
                src={imageUrl}
                alt={safeString(plaque.title)} 
                className="w-full h-full object-cover"
                placeholderClassName="bg-blue-50"
                plaqueColor={plaqueColor}
              />
              
              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  plaqueColor === 'blue' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  plaqueColor === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                  plaqueColor === 'brown' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  plaqueColor === 'black' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {plaqueColor?.charAt(0).toUpperCase() + plaqueColor?.slice(1)} Plaque
                </div>
                
                {isValidValue(plaque.erected) && (
                  <div className="bg-white/90 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Calendar size={12} />
                    {safeString(plaque.erected)}
                  </div>
                )}
                
                {isVisited && visitInfo && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <CheckCircle size={12} />
                    Visited {formatVisitDate()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Title & Location */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{safeString(plaque.title)}</h1>
                <div className="flex items-start text-gray-600">
                  <MapPin size={16} className="mr-2 mt-0.5 text-purple-500 flex-shrink-0" /> 
                  <div>
                    <div>{locationDisplay}</div>
                    {(isValidValue(plaque.area) || isValidValue(plaque.postcode)) && (
                      <div className="text-sm">
                        {isValidValue(plaque.area) && safeString(plaque.area)}
                        {isValidValue(plaque.area) && isValidValue(plaque.postcode) && ', '}
                        {isValidValue(plaque.postcode) && safeString(plaque.postcode)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {renderActionButtons()}

              {/* Collections Preview */}
              {plaqueCollections.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen size={16} className="text-purple-600" />
                    <span className="font-medium text-purple-900">
                      In Collections ({plaqueCollections.length})
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {plaqueCollections.slice(0, 3).map((collection) => (
                      <span 
                        key={collection.id}
                        className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200 flex items-center gap-2 cursor-pointer hover:bg-purple-50 transition-colors"
                        onClick={() => navigate(`/library/collections/${collection.id}`)}
                        title={`View ${collection.name} collection`}
                      >
                        <span className="text-lg">{collection.icon}</span>
                        <span className="truncate max-w-[120px]">{collection.name}</span>
                      </span>
                    ))}
                    
                    {plaqueCollections.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm border border-gray-200 flex items-center gap-1">
                        <Plus size={12} />
                        {plaqueCollections.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Progressive Disclosure Sections */}
              <div className="space-y-4 mt-6">
                {/* Inscription */}
                {isValidValue(plaque.inscription) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleSection('inscription')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📜</span>
                        <div>
                          <div className="font-medium">Full Inscription</div>
                          <div className="text-sm text-gray-600">
                            {expandedSections.inscription 
                              ? 'Click to collapse'
                              : truncateText(safeString(plaque.inscription), 100)
                            }
                          </div>
                        </div>
                      </div>
                      {expandedSections.inscription ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections.inscription && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                          <div className="text-gray-700 leading-relaxed italic">
                            "{safeString(plaque.inscription)}"
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subject Information */}
                {isValidValue(plaque.lead_subject_name) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleSection('subject')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">👤</span>
                        <div>
                          <div className="font-medium">About {safeString(plaque.lead_subject_name)}</div>
                          <div className="text-sm text-gray-600">
                            {isValidValue(plaque.lead_subject_primary_role) 
                              ? `${safeString(plaque.lead_subject_primary_role)} ${lifeYears}`
                              : 'Click to learn more'
                            }
                          </div>
                        </div>
                      </div>
                      {expandedSections.subject ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections.subject && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <User size={16} className="text-blue-600" />
                            <h3 className="font-semibold text-lg text-gray-900">
                              {safeString(plaque.lead_subject_name)} {lifeYears}
                            </h3>
                          </div>
                          
                          {isValidValue(plaque.lead_subject_primary_role) && (
                            <p className="text-gray-700 mb-3 capitalize">
                              {safeString(plaque.lead_subject_primary_role)}
                            </p>
                          )}
                          
                          {isValidValue(plaque.lead_subject_wikipedia) && (
                            <a 
                              href={safeString(plaque.lead_subject_wikipedia)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                            >
                              <ExternalLink size={14} />
                              Learn more on Wikipedia
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nearby Plaques */}
                {nearbyPlaques.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleSection('nearby')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📍</span>
                        <div>
                          <div className="font-medium">Nearby Plaques</div>
                          <div className="text-sm text-gray-600">
                            {nearbyPlaques.length} other plaques in this area
                          </div>
                        </div>
                      </div>
                      {expandedSections.nearby ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections.nearby && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        <div className="space-y-3">
                          {nearbyPlaques.slice(0, 4).map((nearby) => {
                            const nearbyImageUrl = nearby.image || nearby.main_photo;
                            const nearbyPlaqueColor = nearby.color || nearby.colour || 'unknown';
                            
                            return (
                              <div 
                                key={nearby.id} 
                                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border"
                                onClick={() => navigate(`/plaque/${nearby.id}`)}
                              >
                                <div className="w-16 h-12 bg-gray-200 rounded object-cover flex-shrink-0 overflow-hidden">
                                  <PlaqueImage 
                                    src={nearbyImageUrl}
                                    alt={safeString(nearby.title)}
                                    className="w-full h-full object-cover"
                                    plaqueColor={nearbyPlaqueColor}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                                    {safeString(nearby.title)}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-3">
                                    <span>{safeString(nearby.address || nearby.location)}</span>
                                    {isValidValue(nearby.profession) && (
                                      <>
                                        <span>•</span>
                                        <span>{safeString(nearby.profession)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  nearbyPlaqueColor === 'blue' ? 'bg-blue-500' :
                                  nearbyPlaqueColor === 'green' ? 'bg-green-500' :
                                  nearbyPlaqueColor === 'brown' ? 'bg-amber-500' : 'bg-gray-500'
                                }`}></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSection('metadata')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">ℹ️</span>
                      <div>
                        <div className="font-medium">Additional Details</div>
                        <div className="text-sm text-gray-600">
                          Plaque details, location info, and more
                        </div>
                      </div>
                    </div>
                    {expandedSections.metadata ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSections.metadata && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isValidValue(plaque.erected) && (
                          <div className="bg-white border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Erected</span>
                            </div>
                            <div className="font-semibold text-gray-900">{safeString(plaque.erected)}</div>
                          </div>
                        )}
                        
                        {isValidValue(plaque.area) && (
                          <div className="bg-white border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Borough</span>
                            </div>
                            <div className="font-semibold text-gray-900">{safeString(plaque.area)}</div>
                          </div>
                        )}
                        
                        {plaqueColor && plaqueColor !== "unknown" && (
                          <div className="bg-white border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Building size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Material</span>
                            </div>
                            <div className="font-semibold text-gray-900 capitalize">{plaqueColor}</div>
                          </div>
                        )}
                        
                        {isValidValue(plaque.postcode) && (
                          <div className="bg-white border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postcode</span>
                            </div>
                            <div className="font-semibold text-gray-900">{safeString(plaque.postcode)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Date Picker Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>When did you visit this plaque?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Visit Date</Label>
              
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    id="visit-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(visitDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => {
                      if (date) {
                        setVisitDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-notes">Notes (optional)</Label>
              <Textarea
                id="visit-notes"
                placeholder="Any memories or observations about your visit?"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVisitDialog(false)}
              disabled={isMarkingVisited}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVisitSubmit}
              disabled={isMarkingVisited}
            >
              {isMarkingVisited ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Saving...
                </>
              ) : (
                "Save Visit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        isOpen={showAddToCollection}
        onClose={() => setShowAddToCollection(false)}
        plaque={plaque}
      />
    </PageContainer>
  );
};

export default PlaqueDetailPage;