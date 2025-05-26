// src/components/plaques/OptimizedPlaqueDetail.tsx - Performance Optimized Version
import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  MapPin, 
  Calendar, 
  User, 
  Building, 
  ExternalLink, 
  X,
  CheckCircle,
  Clock,
  Share2
} from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

interface OptimizedPlaqueDetailProps {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onFavoriteToggle: (id: number) => void;
  onMarkVisited: (id: number) => void;
  nearbyPlaques?: Plaque[];
  onSelectNearbyPlaque?: (plaque: Plaque) => void;
}

// Memoized nearby plaque item to prevent re-renders
const NearbyPlaqueItem = memo(({ 
  plaque, 
  onClick 
}: { 
  plaque: Plaque; 
  onClick: (plaque: Plaque) => void; 
}) => (
  <button
    onClick={() => onClick(plaque)}
    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left w-full"
  >
    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
      {plaque.image ? (
        <img 
          src={plaque.image} 
          alt={plaque.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <Building className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-sm text-gray-900 truncate">{plaque.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plaque.location}</p>
      {plaque.profession && (
        <Badge variant="secondary" className="mt-1 text-xs">
          {plaque.profession}
        </Badge>
      )}
    </div>
  </button>
));

NearbyPlaqueItem.displayName = 'NearbyPlaqueItem';

// Memoized detail section to prevent unnecessary re-renders
const DetailSection = memo(({ 
  icon: Icon, 
  title, 
  content, 
  className = "" 
}: {
  icon: React.ComponentType<any>;
  title: string;
  content: string | null | undefined;
  className?: string;
}) => {
  if (!content) return null;
  
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <dt className="text-sm font-medium text-gray-700">{title}</dt>
        <dd className="text-sm text-gray-600 mt-1">{content}</dd>
      </div>
    </div>
  );
});

DetailSection.displayName = 'DetailSection';

const OptimizedPlaqueDetail: React.FC<OptimizedPlaqueDetailProps> = ({
  plaque,
  isOpen,
  onClose,
  isFavorite,
  onFavoriteToggle,
  onMarkVisited,
  nearbyPlaques = [],
  onSelectNearbyPlaque
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Memoized handlers to prevent re-renders
  const handleFavoriteToggle = useCallback(() => {
    if (!plaque) return;
    onFavoriteToggle(plaque.id);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  }, [plaque, isFavorite, onFavoriteToggle]);

  const handleMarkVisited = useCallback(() => {
    if (!plaque) return;
    onMarkVisited(plaque.id);
    toast.success("Marked as visited!");
  }, [plaque, onMarkVisited]);

  const handleShare = useCallback(async () => {
    if (!plaque) return;
    
    const shareData = {
      title: plaque.title,
      text: `Check out this plaque: ${plaque.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Couldn't share this plaque");
    }
  }, [plaque]);

  const handleNearbyPlaqueClick = useCallback((nearbyPlaque: Plaque) => {
    if (onSelectNearbyPlaque) {
      onSelectNearbyPlaque(nearbyPlaque);
    }
  }, [onSelectNearbyPlaque]);

  // Memoized plaque data to prevent unnecessary recalculations
  const plaqueData = useMemo(() => {
    if (!plaque) return null;

    return {
      title: plaque.title || 'Unnamed Plaque',
      description: plaque.description || plaque.inscription || '',
      location: plaque.location || plaque.address || '',
      profession: plaque.profession,
      erected: plaque.erected,
      color: plaque.color,
      postcode: plaque.postcode,
      borough: plaque.borough,
      visited: plaque.visited,
      image: plaque.image
    };
  }, [plaque]);

  // Reset image state when plaque changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [plaque?.id]);

  // Early return if no plaque
  if (!plaque || !plaqueData) {
    return null;
  }

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header with image */}
        <div className="relative">
          {plaqueData.image && !imageError ? (
            <div className="w-full h-64 bg-gray-100 overflow-hidden">
              <img
                ref={imageRef}
                src={plaqueData.image}
                alt={plaqueData.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="eager"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <Building className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Building className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          
          {/* Action buttons overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="bg-white/90 hover:bg-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="bg-white/90 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {plaqueData.title}
                </DialogTitle>
              </DialogHeader>
              
              {/* Quick stats */}
              <div className="flex flex-wrap gap-2 mt-3">
                {plaqueData.color && (
                  <Badge variant="outline" className="capitalize">
                    {plaqueData.color} Plaque
                  </Badge>
                )}
                {plaqueData.profession && (
                  <Badge variant="secondary">
                    {plaqueData.profession}
                  </Badge>
                )}
                {plaqueData.visited && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Visited
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {plaqueData.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">
                  {plaqueData.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div>
<h3 className="font-semibold text-gray-900 mb-3">Details</h3>
             <dl className="space-y-3">
               <DetailSection
                 icon={MapPin}
                 title="Location"
                 content={plaqueData.location}
               />
               <DetailSection
                 icon={Calendar}
                 title="Erected"
                 content={plaqueData.erected}
               />
               <DetailSection
                 icon={Building}
                 title="Borough"
                 content={plaqueData.borough}
               />
               <DetailSection
                 icon={MapPin}
                 title="Postcode"
                 content={plaqueData.postcode}
               />
             </dl>
           </div>

           {/* Action buttons */}
           <div className="flex gap-3 pt-4 border-t">
             <Button
               onClick={handleFavoriteToggle}
               variant={isFavorite ? "default" : "outline"}
               className="flex-1"
             >
               <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
               {isFavorite ? 'Favorited' : 'Add to Favorites'}
             </Button>
             
             {!plaqueData.visited && (
               <Button
                 onClick={handleMarkVisited}
                 variant="outline"
                 className="flex-1"
               >
                 <Clock className="w-4 h-4 mr-2" />
                 Mark as Visited
               </Button>
             )}
           </div>

           {/* Nearby plaques */}
           {nearbyPlaques.length > 0 && (
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Nearby Plaques</h3>
               <div className="space-y-2">
                 {nearbyPlaques.slice(0, 3).map((nearbyPlaque) => (
                   <NearbyPlaqueItem
                     key={nearbyPlaque.id}
                     plaque={nearbyPlaque}
                     onClick={handleNearbyPlaqueClick}
                   />
                 ))}
               </div>
             </div>
           )}
         </div>
       </ScrollArea>
     </DialogContent>
   </Dialog>
 );
};

export default memo(OptimizedPlaqueDetail);