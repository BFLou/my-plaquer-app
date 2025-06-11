// src/components/plaques/PlaqueDetail.tsx - COMPLETE MOBILE-OPTIMIZED VERSION
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Star, CheckCircle, X, ExternalLink, Calendar, User, Building, 
  Navigation, Plus, Eye, FileText, FolderOpen, Share2, MoreHorizontal
} from 'lucide-react';
import { 
  Dialog as MainDialog,
  DialogContent as MainDialogContent,
  DialogHeader as MainDialogHeader,
  DialogTitle as MainDialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MobileButton } from "@/components/ui/mobile-button";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollections } from '@/hooks/useCollection';
import { useAuthGate } from '@/hooks/useAuthGate';
import AddToCollectionDialog from './AddToCollectionDialog';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useNavigate } from 'react-router-dom';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PlaqueDetailProps = {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  nearbyPlaques?: Plaque[];
  onSelectNearbyPlaque?: (plaque: Plaque) => void;
  className?: string;
  isMapView?: boolean;
  distance?: number;
  formatDistance?: (distance: number) => string;
  showDistance?: boolean;
  isFullPage?: boolean;
  generateShareUrl?: (plaqueId: number) => string;
  currentPath?: string;
};

export const PlaqueDetail: React.FC<PlaqueDetailProps> = ({
  plaque,
  isOpen,
  onClose,
  isFavorite = false,
  onFavoriteToggle,
  nearbyPlaques = [],
  onSelectNearbyPlaque,
  className = '',
  isMapView = false,
  distance,
  formatDistance = (d) => `${d.toFixed(1)} km`,
  showDistance = false,
  isFullPage = false,
  generateShareUrl
}) => {
  // Hooks
  const navigate = useNavigate();
  const { isPlaqueVisited, getVisitInfo, markAsVisited } = useVisitedPlaques();
  const { isFavorite: isInFavorites, toggleFavorite } = useFavorites();
  const { collections } = useCollections();
  
  // Auth gate integration
  const { 
    requireAuthForVisit, 
    requireAuthForFavorite, 
    requireAuthForCollection
  } = useAuthGate();
  
  // State
  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showFullInscription, setShowFullInscription] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showAllCollections, setShowAllCollections] = useState(false);
  
  // Visit dialog state
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // CRITICAL: Early return if no plaque - MUST be before any plaque usage
  if (!plaque) return null;

  // NOW SAFE: All plaque-dependent logic goes here
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isPlaqueFavorite = isFavorite || isInFavorites(plaque.id);
  const visitInfo = isVisited ? getVisitInfo(plaque.id) : null;

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

  // Helper functions
  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const safeTrim = (value: any): string => {
    return safeString(value).trim();
  };

  const isValidValue = (value: any): boolean => {
    const str = safeTrim(value);
    return str !== '' && str !== 'Unknown' && str !== 'unknown';
  };

  const formatVisitDate = () => {
    if (!visitInfo?.visited_at) return '';
    try {
      const date = visitInfo.visited_at instanceof Date
        ? visitInfo.visited_at
        : new Date(visitInfo.visited_at);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const parseOrganisations = () => {
    try {
      if (plaque.organisations && isValidValue(plaque.organisations)) {
        return JSON.parse(safeString(plaque.organisations));
      }
    } catch (e) {
      console.error('Error parsing organisations:', e);
    }
    return [];
  };

  const getLifeYears = () => {
    const bornIn = safeTrim(plaque.lead_subject_born_in);
    const diedIn = safeTrim(plaque.lead_subject_died_in);
    
    if (isValidValue(bornIn) && isValidValue(diedIn)) {
      return `(${bornIn} - ${diedIn})`;
    }
    return '';
  };

  // Get derived values
  const organisations = parseOrganisations();
  const lifeYears = getLifeYears();
  const plaqueColor = safeTrim(plaque.color || plaque.colour) || 'unknown';
  const locationDisplay = safeTrim(plaque.location || plaque.address);
  const imageUrl = plaque.image || plaque.main_photo;

  // Enhanced handlers with auth gate integration and haptic feedback
  const handleFavoriteToggle = () => {
    const favoriteAction = () => {
      triggerHapticFeedback('selection');
      if (onFavoriteToggle) {
        onFavoriteToggle(plaque.id);
      } else {
        toggleFavorite(plaque.id);
      }
    };

    requireAuthForFavorite(plaque.id, favoriteAction);
  };

  const handleMarkVisitedClick = () => {
    if (isVisited) return;
    
    const visitAction = () => {
      setVisitDate(new Date());
      setVisitNotes('');
      setShowVisitDialog(true);
    };

    requireAuthForVisit(plaque.id, visitAction);
  };

  const handleAddToCollection = () => {
    const collectionAction = () => {
      setShowAddToCollection(true);
    };

    requireAuthForCollection(plaque.id, collectionAction);
  };

  const handleGetDirections = () => {
    triggerHapticFeedback('light');
    if (plaque.latitude && plaque.longitude) {
      const url = `https://maps.google.com/?q=${plaque.latitude},${plaque.longitude}`;
      window.open(url, '_blank');
    } else if (plaque.address || plaque.location) {
      const location = safeTrim(plaque.address || plaque.location);
      const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  // Navigate to full page
  const handleViewFullDetails = () => {
    triggerHapticFeedback('selection');
    navigate(`/plaque/${plaque.id}`);
  };

  // Enhanced copy link functionality
  const handleCopyLink = async () => {
    try {
      const plaqueUrl = generateShareUrl 
        ? generateShareUrl(plaque.id)
        : `${window.location.origin}/plaque/${plaque.id}`;
      
      await navigator.clipboard.writeText(plaqueUrl);
      triggerHapticFeedback('success');
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      triggerHapticFeedback('error');
      toast.error("Couldn't copy link");
    }
  };

  // Share functionality
  const handleShare = async () => {
    const shareUrl = generateShareUrl 
      ? generateShareUrl(plaque.id)
      : `${window.location.origin}/plaque/${plaque.id}`;
    
    const shareData = {
      title: plaque.title,
      text: `Check out this historic plaque: ${plaque.title}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        triggerHapticFeedback('light');
        await navigator.share(shareData);
        triggerHapticFeedback('success');
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name !== 'AbortError') {
          handleCopyLink(); // Fallback to copy
        }
      }
    } else {
      handleCopyLink(); // Fallback to copy
    }
  };

  // Visit form submission
  const handleVisitSubmit = async () => {
    setIsMarkingVisited(true);
    triggerHapticFeedback('light');
    
    try {
      console.log('🎯 PlaqueDetail submitting visit:', {
        plaqueId: plaque.id,
        selectedDate: visitDate,
        isoString: visitDate.toISOString(),
        formatted: format(visitDate, 'PPP')
      });

      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      triggerHapticFeedback('success');
      toast.success(`Marked as visited on ${format(visitDate, 'PPP')}`);
      setShowVisitDialog(false);
      
    } catch (error) {
      console.error("Error marking as visited:", error);
      triggerHapticFeedback('error');
      toast.error("Failed to mark as visited");
    } finally {
      setIsMarkingVisited(false);
    }
  };

  // Enhanced z-index management for map view
  const dialogZIndex = isMapView ? 9999 : 1000;
  const sheetClassName = isMapView 
    ? `${className} z-[9999] [&>div]:z-[9999]` 
    : className;

  // Mobile Action Strip Component
  const MobileActionStrip = () => (
    <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Primary Actions - Left Side */}
        <div className="flex items-center gap-2 flex-1">
          <MobileButton 
            onClick={handleMarkVisitedClick}
            disabled={isVisited}
            size="sm"
            className={`h-9 text-xs flex-1 max-w-[120px] ${
              isVisited 
                ? 'bg-green-100 text-green-700 cursor-default' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            touchOptimized={true}
          >
            <CheckCircle size={14} className="mr-1.5" />
            {isVisited ? 'Visited' : 'Mark Visited'}
          </MobileButton>
          
          <MobileButton 
            onClick={handleFavoriteToggle}
            size="sm"
            className={`h-9 text-xs flex-1 max-w-[100px] ${
              isPlaqueFavorite 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            touchOptimized={true}
          >
            <Star size={14} className={`mr-1.5 ${isPlaqueFavorite ? 'fill-current' : ''}`} />
            {isPlaqueFavorite ? 'Favorited' : 'Favorite'}
          </MobileButton>
        </div>
        
        {/* Secondary Actions - Center */}
        <div className="flex items-center gap-2">
          <MobileButton 
            onClick={handleGetDirections}
            variant="outline"
            size="sm"
            className="h-9 px-3"
            touchOptimized={true}
          >
            <Navigation size={14} />
          </MobileButton>
          
          <MobileButton 
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="h-9 px-3"
            touchOptimized={true}
          >
            <Share2 size={14} />
          </MobileButton>
        </div>
        
        {/* More Actions - Right Side */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MobileButton 
              variant="outline" 
              size="sm" 
              className="h-9 w-9 p-0"
              touchOptimized={true}
            >
              <MoreHorizontal size={14} />
            </MobileButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={handleAddToCollection}>
              <Plus size={16} className="mr-2" />
              Add to Collection
            </DropdownMenuItem>
            {!isFullPage && (
              <DropdownMenuItem onSelect={handleViewFullDetails}>
                <FileText size={16} className="mr-2" />
                Full Details
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // Content sections component
  const ContentSections = () => (
    <div className="space-y-6">
      {/* Collections Preview */}
      {plaqueCollections.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-purple-600" />
              <span className="font-medium text-purple-900">
                In Collections ({plaqueCollections.length})
              </span>
            </div>
            {plaqueCollections.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCollections(!showAllCollections)}
                className="text-purple-600 hover:text-purple-700 text-xs"
              >
                {showAllCollections ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(showAllCollections ? plaqueCollections : plaqueCollections.slice(0, 3)).map((collection) => (
             <span 
                key={collection.id}
                className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200 flex items-center gap-2 cursor-pointer hover:bg-purple-50 transition-colors"
                onClick={() => {
                  const url = `/library/collections/${collection.id}`;
                  window.open(url, '_blank');
                }}
                title={`View ${collection.name} collection`}
              >
                <span className="text-lg">{collection.icon}</span>
                <span className="truncate max-w-[120px]">{collection.name}</span>
              </span>
            ))}
            
            {!showAllCollections && plaqueCollections.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm border border-gray-200 flex items-center gap-1">
                <Plus size={12} />
                {plaqueCollections.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Inscription */}
      {isValidValue(plaque.inscription) && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border-l-4 border-purple-500">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Inscription</h3>
            <div className="text-3xl text-purple-400 opacity-50">"</div>
          </div>
          <div className="text-gray-700 leading-relaxed">
            {showFullInscription ? (
              <p className="italic">{safeString(plaque.inscription)}</p>
            ) : (
              <p className="italic">{truncateText(safeString(plaque.inscription))}</p>
            )}
            {safeString(plaque.inscription).length > 150 && (
              <button 
                onClick={() => setShowFullInscription(!showFullInscription)}
                className="text-purple-600 hover:underline mt-2 text-sm font-medium"
              >
                {showFullInscription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subject Information */}
      {isValidValue(plaque.lead_subject_name) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-blue-600" />
                <h3 className="font-semibold text-lg text-gray-900">
                  {safeString(plaque.lead_subject_name)} {lifeYears}
                </h3>
              </div>
              
              {isValidValue(plaque.lead_subject_primary_role) && (
                <p className="text-gray-700 mb-2 capitalize">
                  {safeString(plaque.lead_subject_primary_role)}
                </p>
              )}
              

              
              {isValidValue(plaque.lead_subject_wikipedia) && (
                <a 
                  href={safeString(plaque.lead_subject_wikipedia)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium mt-3"
                >
                  <ExternalLink size={14} />
                  Learn more on Wikipedia
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {organisations.length > 0 && (
          <div className="bg-white border rounded-lg p-3 col-span-full">
            <div className="flex items-center gap-2 mb-1">
              <Building size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisations</span>
            </div>
            <div className="font-semibold text-gray-900">{organisations.join(', ')}</div>
          </div>
        )}

        {isValidValue(plaque.profession) && (
          <div className="bg-white border rounded-lg p-3 col-span-full">
            <div className="flex items-center gap-2 mb-1">
              <User size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profession</span>
            </div>
            <div className="font-semibold text-gray-900">{safeString(plaque.profession)}</div>
          </div>
        )}

        {plaque.latitude && plaque.longitude && (
          <div className="bg-white border rounded-lg p-3 col-span-full">
            <div className="flex items-center gap-2 mb-1">
              <Navigation size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coordinates</span>
            </div>
            <div className="font-semibold text-gray-900 text-sm">
              {Number(plaque.latitude).toFixed(6)}, {Number(plaque.longitude).toFixed(6)}
            </div>
          </div>
        )}
      </div>
      
      {/* Nearby Plaques */}
      {nearbyPlaques.length > 0 && (
        <div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye size={16} className="text-gray-600" />
              Nearby Plaques ({nearbyPlaques.length})
            </h3>
            <button 
              onClick={() => setShowNearby(!showNearby)}
              className="text-purple-600 text-sm hover:underline font-medium"
            >
              {showNearby ? 'Show less' : 'View all'}
            </button>
          </div>
          
          <div className="space-y-3">
            {nearbyPlaques.slice(0, showNearby ? nearbyPlaques.length : 2).map((nearby) => {
              const nearbyImageUrl = nearby.image || nearby.main_photo;
              const nearbyPlaqueColor = nearby.color || nearby.colour || 'unknown';
              
              return (
                <div 
                  key={nearby.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onSelectNearbyPlaque?.(nearby)}
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
                    <div className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{safeString(nearby.title)}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span>{safeTrim(nearby.address || nearby.location)}</span>
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
  );

  // If full page mode, render without Dialog wrapper
  if (isFullPage) {
    return (
      <div className={`fixed inset-0 bg-white z-50 overflow-hidden ${className}`}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-48 bg-blue-50">
            <PlaqueImage 
              src={imageUrl}
              alt={safeString(plaque.title)} 
              className="w-full h-full object-cover"
              placeholderClassName="bg-blue-50"
              plaqueColor={plaqueColor}
            />
            
            {/* Status Badges - Top Left */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                plaqueColor === 'blue' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                plaqueColor === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                plaqueColor === 'brown' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                plaqueColor === 'black' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {plaqueColor?.charAt(0).toUpperCase() + plaqueColor?.slice(1)} Plaque
              </div>
              
              {isValidValue(plaque.erected) && (
                <div className="bg-white/90 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Calendar size={10} />
                  {safeString(plaque.erected)}
                </div>
              )}
            </div>

            {/* Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-white/90 hover:bg-white text-gray-700 rounded-full w-10 h-10 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Visit Status Badge - Bottom Right */}
            {isVisited && (
              <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle size={12} />
                Visited {formatVisitDate()}
              </div>
            )}

            {/* Distance Badge - Bottom Left */}
            {showDistance && distance && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                {formatDistance(distance)} away
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-4 pb-2 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{safeString(plaque.title)}</h1>
              {locationDisplay && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-gray-600 text-sm leading-relaxed">{locationDisplay}</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 pb-20">
              <ContentSections />
            </div>
          </div>

          {/* Mobile Action Strip - Fixed Bottom */}
          <MobileActionStrip />
        </div>

        {/* Dialogs */}
{showAddToCollection && (
  <AddToCollectionDialog
    plaque={plaque}
    isOpen={showAddToCollection}
    onClose={() => setShowAddToCollection(false)}
  />
)}

        {/* Visit Dialog */}
        <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark as Visited</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visit-date">Visit Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setShowCalendar(true)}
                    >
                      <Calendar size={16} className="mr-2" />
                      {format(visitDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={visitDate}
                      onSelect={(date) => {
                        if (date) {
                          setVisitDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visit-notes">Notes (Optional)</Label>
                <Textarea
                  id="visit-notes"
                  placeholder="Add any notes about your visit..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVisitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleVisitSubmit} disabled={isMarkingVisited}>
                {isMarkingVisited ? 'Saving...' : 'Mark as Visited'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Regular dialog mode (not full page)
  return (
    <MainDialog open={isOpen} onOpenChange={onClose}>
      <MainDialogContent 
        className={`max-w-2xl max-h-[90vh] overflow-hidden p-0 ${sheetClassName}`}
        style={{ zIndex: dialogZIndex }}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Hero Image */}
          <div className="relative h-48 bg-blue-50">
            <PlaqueImage 
              src={imageUrl}
              alt={safeString(plaque.title)} 
              className="w-full h-full object-cover"
              placeholderClassName="bg-blue-50"
              plaqueColor={plaqueColor}
            />
            
            {/* Status Badges - Top Left */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                plaqueColor === 'blue' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                plaqueColor === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                plaqueColor === 'brown' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                plaqueColor === 'black' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {plaqueColor?.charAt(0).toUpperCase() + plaqueColor?.slice(1)} Plaque
              </div>
              
              {isValidValue(plaque.erected) && (
                <div className="bg-white/90 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Calendar size={10} />
                  {safeString(plaque.erected)}
                </div>
              )}
            </div>

            {/* Close Button - Top Right */}
            <div className="absolute top-3 right-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-white/90 hover:bg-white text-gray-700 rounded-full w-10 h-10 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Visit Status Badge - Bottom Right */}
            {isVisited && (
              <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle size={12} />
                Visited {formatVisitDate()}
              </div>
            )}

            {/* Distance Badge - Bottom Left */}
            {showDistance && distance && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                {formatDistance(distance)} away
              </div>
            )}
          </div>

          {/* Header */}
          <MainDialogHeader className="p-4 pb-2 border-b border-gray-100">
            <MainDialogTitle className="text-xl font-bold text-gray-900 mb-2 text-left">
              {safeString(plaque.title)}
            </MainDialogTitle>
            {locationDisplay && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                <p className="text-gray-600 text-sm leading-relaxed">{locationDisplay}</p>
              </div>
            )}
          </MainDialogHeader>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <ContentSections />
          </div>

          {/* Mobile Action Strip - Fixed Bottom */}
          <MobileActionStrip />
        </div>

        {/* Dialogs */}
{showAddToCollection && (
  <AddToCollectionDialog
    plaque={plaque}
    isOpen={showAddToCollection}
    onClose={() => setShowAddToCollection(false)}
  />
)}

        {/* Visit Dialog */}
        <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark as Visited</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visit-date">Visit Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setShowCalendar(true)}
                    >
                      <Calendar size={16} className="mr-2" />
                      {format(visitDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={visitDate}
                      onSelect={(date) => {
                        if (date) {
                          setVisitDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visit-notes">Notes (Optional)</Label>
                <Textarea
                  id="visit-notes"
                  placeholder="Add any notes about your visit..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVisitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleVisitSubmit} disabled={isMarkingVisited}>
                {isMarkingVisited ? 'Saving...' : 'Mark as Visited'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainDialogContent>
    </MainDialog>
  );
};

export default PlaqueDetail;