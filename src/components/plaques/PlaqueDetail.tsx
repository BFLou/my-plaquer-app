// src/components/plaques/PlaqueDetail.tsx - Enhanced with shareable URLs and full-page mode
import React, { useState, useRef, useMemo } from 'react';
import { 
  MapPin, Star, CheckCircle, X, ExternalLink, Calendar, User, Building, 
  Clock, Share2, Navigation, Plus, Copy, Eye, FileText, FolderOpen
} from 'lucide-react';
import { 
  Dialog as MainDialog,
  DialogContent as MainDialogContent,
  DialogHeader as MainDialogHeader,
  DialogTitle as MainDialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollections } from '@/hooks/useCollection';
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
  isFullPage?: boolean; // NEW: Add support for full-page mode
};

export const PlaqueDetail: React.FC<PlaqueDetailProps> = ({
  plaque,
  isOpen,
  onClose,
  isFavorite = false,
  onFavoriteToggle,
  onMarkVisited,
  onAddToRoute,
  nearbyPlaques = [],
  onSelectNearbyPlaque,
  className = '',
  isMapView = false,
  distance,
  formatDistance = (d) => `${d.toFixed(1)} km`,
  showDistance = false,
  isFullPage = false // NEW: Add support for full-page mode
}) => {
  // Hooks
  const { isPlaqueVisited, getVisitInfo, markAsVisited } = useVisitedPlaques();
  const { isFavorite: isInFavorites, toggleFavorite } = useFavorites();
  const { collections } = useCollections();
  
  // State
  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showFullInscription, setShowFullInscription] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showAllCollections, setShowAllCollections] = useState(false);
  
  // Visit dialog state
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Refs
  const shareMenuRef = useRef<HTMLDivElement>(null);

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
      const date = visitInfo.visited_at.toDate
        ? visitInfo.visited_at.toDate()
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

  // Handlers
  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(plaque.id);
    } else {
      toggleFavorite(plaque.id);
    }
    toast.success(isPlaqueFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleMarkVisitedClick = () => {
    if (isVisited) return;
    setVisitDate(new Date());
    setVisitNotes('');
    setShowVisitDialog(true);
  };

  const handleVisitSubmit = async () => {
    setIsMarkingVisited(true);
    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      if (onMarkVisited) {
        onMarkVisited(plaque.id);
      }
      
      toast.success("Plaque marked as visited");
      setShowVisitDialog(false);
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsMarkingVisited(false);
    }
  };

  const handleAddToCollection = () => {
    setShowAddToCollection(true);
  };

  const handleAddToRoute = () => {
    if (!onAddToRoute) return;
    onAddToRoute(plaque);
    toast.success("Added to route");
  };

  const handleGetDirections = () => {
    if (plaque.latitude && plaque.longitude) {
      const url = `https://maps.google.com/?q=${plaque.latitude},${plaque.longitude}`;
      window.open(url, '_blank');
    } else if (plaque.address || plaque.location) {
      const location = safeTrim(plaque.address || plaque.location);
      const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

// Updated handleShare function with multiple URL generation strategies

const handleShare = async (method: 'native' | 'copy') => {
  // Strategy 1: Use current page URL with plaque parameter
  const currentUrl = new URL(window.location.href);
  const plaqueUrl = `${currentUrl.origin}${currentUrl.pathname}?plaque=${plaque.id}`;
  
  // Strategy 2: If you have a dedicated plaque route structure
  // const plaqueUrl = `${window.location.origin}/plaques/${plaque.id}`;
  
  // Strategy 3: If using hash-based routing
  // const plaqueUrl = `${window.location.origin}/#/plaque/${plaque.id}`;
  
  // Strategy 4: Preserve current route context (recommended for My-plaquer-App)
  // const plaqueUrl = `${window.location.origin}${window.location.pathname}?selected=${plaque.id}`;

  const shareData = {
    title: safeString(plaque.title),
    text: `Check out this historical plaque: ${safeString(plaque.title)}`,
    url: plaqueUrl
  };

  try {
    if (method === 'native' && navigator.share) {
      await navigator.share(shareData);
    } else if (method === 'copy') {
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing:', error);
    toast.error("Couldn't share this plaque");
  }
  setShowShareMenu(false);
};

// Alternative: Add URL generation as a prop or hook
interface PlaqueDetailProps {
  // ... existing props
  generateShareUrl?: (plaqueId: number) => string;
}

// Usage with prop:
const handleShareWithProp = async (method: 'native' | 'copy') => {
  const plaqueUrl = generateShareUrl 
    ? generateShareUrl(plaque.id)
    : `${window.location.origin}/plaque/${plaque.id}`;
    
  // ... rest of share logic
};

  // Apply higher z-index for map view
  const sheetClassName = isMapView 
    ? `${className} z-[9999] [&>div]:z-[9999]` 
    : className;

  // NEW: If full page mode, render without Dialog wrapper
  if (isFullPage) {
    return (
      <div className={`fixed inset-0 bg-white z-50 overflow-hidden ${className}`}>
<div className="h-full flex flex-col overflow-hidden">
         {/* Hero Image with Floating Action Bar */}
         <div className="relative h-56 bg-blue-50">
           <PlaqueImage 
             src={imageUrl}
             alt={safeString(plaque.title)} 
             className="w-full h-full object-cover"
             placeholderClassName="bg-blue-50"
             plaqueColor={plaqueColor}
           />
           
           {/* Status Badges - Top Left */}
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

             {/* Distance Badge */}
             {showDistance && distance !== undefined && distance !== Infinity && (
               <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-200">
                 <Navigation size={12} />
                 {formatDistance(distance)}
               </div>
             )}
           </div>
           
           {/* Close Button - Top Right */}
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-colors z-10"
             onClick={onClose}
           >
             <X size={18} />
           </Button>
           
           {/* MOBILE-FRIENDLY FLOATING ACTION BAR - Right side */}
           <div className="absolute bottom-4 right-4">
             <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
               <div className="p-2">
                 {/* Mobile: Vertical stack, Desktop: Horizontal row */}
                 <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
                   {/* Visit/Visited button */}
                   {!isVisited ? (
                     <Button 
                       onClick={handleMarkVisitedClick}
                       size="sm"
                       className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors touch-manipulation"
                       title="Mark as Visited"
                     >
                       <CheckCircle size={16} className="sm:w-3.5 sm:h-3.5" />
                     </Button>
                   ) : (
                     <div 
                       className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center"
                       title="Visited"
                     >
                       <CheckCircle size={16} className="sm:w-3.5 sm:h-3.5" />
                     </div>
                   )}
                   
                   {/* Add to Collection */}
                   <Button 
                     onClick={handleAddToCollection}
                     size="sm"
                     className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors touch-manipulation"
                     title="Add to Collection"
                   >
                     <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
                   </Button>
                   
                   {/* Get Directions */}
                   <Button 
                     onClick={handleGetDirections}
                     size="sm"
                     className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors touch-manipulation"
                     title="Get Directions"
                   >
                     <Navigation size={16} className="sm:w-3.5 sm:h-3.5" />
                   </Button>
                   
                   {/* Toggle Favorite */}
                   <Button 
                     onClick={handleFavoriteToggle}
                     size="sm"
                     className={`h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors touch-manipulation ${
                       isPlaqueFavorite 
                         ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                     }`}
                     title="Toggle Favorite"
                   >
                     <Star size={16} className={`sm:w-3.5 sm:h-3.5 ${isPlaqueFavorite ? 'fill-current' : ''}`} />
                   </Button>
                   
                   {/* Share */}
                   <div className="relative">
                     <Button 
                       onClick={() => setShowShareMenu(!showShareMenu)}
                       size="sm"
                       className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors touch-manipulation"
                       title="Share"
                     >
                       <Share2 size={16} className="sm:w-3.5 sm:h-3.5" />
                     </Button>
                     
                     {/* Share menu positioned to not cover image */}
                     {showShareMenu && (
                       <div 
                         ref={shareMenuRef}
                         className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[120px] z-10"
                       >
                         <button 
                           onClick={() => handleShare('copy')}
                           className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm touch-manipulation"
                         >
                           <Copy size={12} />
                           Copy Link
                         </button>
                         {navigator.share && (
                           <button 
                             onClick={() => handleShare('native')}
                             className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm touch-manipulation"
                           >
                             <Share2 size={12} />
                             Share...
                           </button>
                         )}
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
         
         {/* Content Section - Scrollable */}
         <div className="flex-1 overflow-y-auto">
           <div className="p-6 space-y-4">
             
             {/* Title & Location */}
             <div>
               <h1 className="text-xl sm:text-2xl font-bold leading-tight text-left text-gray-900">
                 {safeString(plaque.title)}
               </h1>
               <div className="flex items-start text-gray-600 mt-2">
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

             {/* Collections Preview - Only show if plaque is in actual collections */}
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
             
             {/* Metadata Grid */}
             <div className="grid grid-cols-2 gap-4">
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

               {organisations.length > 0 && (
                 <div className="bg-white border rounded-lg p-3 col-span-2">
                   <div className="flex items-center gap-2 mb-1">
                     <Building size={14} className="text-gray-400" />
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisations</span>
                   </div>
                   <div className="font-semibold text-gray-900">{organisations.join(', ')}</div>
                 </div>
               )}
             </div>
             
             {/* Nearby Plaques */}
             {nearbyPlaques.length > 0 && (
               <div>
                 <div className="flex items-center justify-between mb-4">
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
         </div>
       </div>
     </div>
   );
 }

 return (
   <>
     <MainDialog open={isOpen} onOpenChange={onClose}>
       <MainDialogContent 
         className={`max-w-2xl max-h-[90vh] p-0 overflow-hidden ${sheetClassName}`}
         style={isMapView ? { zIndex: 9999 } : {}}
       >
         <div className="h-full flex flex-col overflow-hidden max-h-[90vh]">
           {/* Hero Image with Floating Action Bar */}
           <div className="relative h-56 bg-blue-50">
             <PlaqueImage 
               src={imageUrl}
               alt={safeString(plaque.title)} 
               className="w-full h-full object-cover"
               placeholderClassName="bg-blue-50"
               plaqueColor={plaqueColor}
             />
             
             {/* Status Badges - Top Left */}
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

               {/* Distance Badge */}
               {showDistance && distance !== undefined && distance !== Infinity && (
                 <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-200">
                   <Navigation size={12} />
                   {formatDistance(distance)}
                 </div>
               )}
             </div>
             
             {/* Close Button - Top Right */}
             <Button 
               variant="ghost" 
               size="icon" 
               className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-colors z-10"
               onClick={onClose}
             >
               <X size={18} />
             </Button>
             
             {/* MOBILE-FRIENDLY FLOATING ACTION BAR - Right side */}
             <div className="absolute bottom-4 right-4">
               <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                 <div className="p-2">
                   {/* Mobile: Vertical stack, Desktop: Horizontal row */}
                   <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
                     {/* Visit/Visited button */}
                     {!isVisited ? (
                       <Button 
                         onClick={handleMarkVisitedClick}
                         size="sm"
                         className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors touch-manipulation"
                         title="Mark as Visited"
                       >
                         <CheckCircle size={16} className="sm:w-3.5 sm:h-3.5" />
                       </Button>
                     ) : (
                       <div 
                         className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center"
                         title="Visited"
                       >
                         <CheckCircle size={16} className="sm:w-3.5 sm:h-3.5" />
                       </div>
                     )}
                     
                     {/* Add to Collection */}
                     <Button 
                       onClick={handleAddToCollection}
                       size="sm"
                       className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors touch-manipulation"
                       title="Add to Collection"
                     >
                       <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
                     </Button>
                     
                     {/* Get Directions */}
                     <Button 
                       onClick={handleGetDirections}
                       size="sm"
                       className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors touch-manipulation"
                       title="Get Directions"
                     >
                       <Navigation size={16} className="sm:w-3.5 sm:h-3.5" />
                     </Button>
                     
                     {/* Toggle Favorite */}
                     <Button 
                       onClick={handleFavoriteToggle}
                       size="sm"
                       className={`h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors touch-manipulation ${
                         isPlaqueFavorite 
                           ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}
                       title="Toggle Favorite"
                     >
                       <Star size={16} className={`sm:w-3.5 sm:h-3.5 ${isPlaqueFavorite ? 'fill-current' : ''}`} />
                     </Button>
                     
                     {/* Share */}
                     <div className="relative">
                       <Button 
                         onClick={() => setShowShareMenu(!showShareMenu)}
                         size="sm"
                         className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors touch-manipulation"
                         title="Share"
                       >
                         <Share2 size={16} className="sm:w-3.5 sm:h-3.5" />
                       </Button>
                       
                       {/* Share menu positioned to not cover image */}
                       {showShareMenu && (
                         <div 
                           ref={shareMenuRef}
                           className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[120px] z-10"
                         >
                           <button 
                             onClick={() => handleShare('copy')}
                             className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm touch-manipulation"
                           >
                             <Copy size={12} />
                             Copy Link
                           </button>
                           {navigator.share && (
                             <button 
                               onClick={() => handleShare('native')}
                               className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm touch-manipulation"
                             >
                               <Share2 size={12} />
                               Share...
                             </button>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Content Section - Scrollable */}
           <div className="flex-1 overflow-y-auto max-h-[calc(90vh-14rem)]">
             <div className="p-6 space-y-6">
               
               {/* Title & Location */}
               <div>
                 <MainDialogHeader>
                   <MainDialogTitle className="text-xl sm:text-2xl font-bold leading-tight text-left">
                     {safeString(plaque.title)}
                   </MainDialogTitle>
                 </MainDialogHeader>
                 <div className="flex items-start text-gray-600 mt-2">
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

               {/* Collections Preview - Only show if plaque is in actual collections */}
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
                           // Navigate to collection detail
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
               
               {/* Metadata Grid */}
               <div className="grid grid-cols-2 gap-4">
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

                 {organisations.length > 0 && (
                   <div className="bg-white border rounded-lg p-3 col-span-2">
                     <div className="flex items-center gap-2 mb-1">
                       <Building size={14} className="text-gray-400" />
                       <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisations</span>
                     </div>
                     <div className="font-semibold text-gray-900">{organisations.join(', ')}</div>
                   </div>
                 )}
               </div>
               
               {/* Nearby Plaques */}
               {nearbyPlaques.length > 0 && (
                 <div>
                   <div className="flex items-center justify-between mb-4">
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
           </div>
         </div>
       </MainDialogContent>
     </MainDialog>

     {/* Visit Date Picker Dialog */}
     <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
       <DialogContent 
         className={`sm:max-w-md ${isMapView ? 'z-[9999]' : ''}`}
         style={isMapView ? { zIndex: 9999 } : {}}
       >
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
   </>
 );
};

export default PlaqueDetail;