import React from 'react';
import { MapPin, Star, CheckCircle, X, User } from 'lucide-react';
import { 
  Sheet, 
  SheetContent,
  SheetHeader,
  SheetTitle, 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Plaque } from './PlaqueCard';

type PlaqueDetailProps = {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  nearbyPlaques?: Plaque[];
  onSelectNearbyPlaque?: (plaque: Plaque) => void;
};

export const PlaqueDetail = ({
  plaque,
  isOpen,
  onClose,
  isFavorite = false,
  onFavoriteToggle,
  onMarkVisited,
  nearbyPlaques = [],
  onSelectNearbyPlaque
}: PlaqueDetailProps) => {
  if (!plaque) return null;

  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) onFavoriteToggle(plaque.id);
  };

  const handleMarkVisited = () => {
    if (onMarkVisited) onMarkVisited(plaque.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:max-w-md sm:h-full sm:right-0 sm:left-auto p-0">
        <div className="h-full flex flex-col overflow-hidden">
          <div className="relative h-56 bg-blue-50">
            <img 
              src={plaque.image} 
              alt={plaque.title} 
              className="w-full h-full object-cover"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full bg-black/30 text-white hover:bg-black/40"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
            {onFavoriteToggle && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`absolute top-4 left-4 rounded-full bg-black/30 hover:bg-black/40 ${isFavorite ? 'text-amber-500' : 'text-white'}`}
                onClick={handleFavoriteToggle}
              >
                <Star size={18} className={isFavorite ? 'fill-amber-500' : ''} />
              </Button>
            )}
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow">
            <h2 className="text-2xl font-bold mb-1">{plaque.title}</h2>
            <p className="text-gray-600 flex items-center mb-4">
              <MapPin size={16} className="mr-1" /> {plaque.location}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge 
                variant="outline" 
                className={`
                  ${plaque.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${plaque.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${plaque.color === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                  ${plaque.color === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                `}
              >
                {plaque.color.charAt(0).toUpperCase() + plaque.color.slice(1)} Plaque
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {plaque.profession}
              </Badge>
              {plaque.visited && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle size={12} className="mr-1" /> Visited
                </Badge>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">
                {plaque.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Erected</h4>
                <p className="font-medium">1968</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Organization</h4>
                <p className="font-medium">English Heritage</p>
              </div>
            </div>
            
            {nearbyPlaques.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Nearby Plaques</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {nearbyPlaques.map(nearbyPlaque => (
                    <div 
                      key={nearbyPlaque.id} 
                      className="shrink-0 w-40 rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => onSelectNearbyPlaque?.(nearbyPlaque)}
                    >
                      <h4 className="font-medium text-sm mb-1 truncate">{nearbyPlaque.title}</h4>
                      <p className="text-gray-500 text-xs truncate">{nearbyPlaque.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="font-medium">User Contributions</h3>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Jane Doe</p>
                    <p className="text-xs text-gray-500">2 months ago</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Visited this plaque during my London walking tour. The building has been beautifully preserved and there's a small exhibition inside that's worth checking out.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                variant={plaque.visited ? "outline" : "default"}
                onClick={handleMarkVisited}
              >
                {plaque.visited ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Visited
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Visited
                  </>
                )}
              </Button>
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => window.open(`https://maps.google.com/?q=${plaque.location}`, '_blank')}
              >
                <MapPin className="mr-2 h-4 w-4" /> Directions
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlaqueDetail;