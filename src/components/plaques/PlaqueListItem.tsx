import React from 'react';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage'; // Import the image component

type PlaqueListItemProps = {
  plaque: Plaque;
  isFavorite?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onFavoriteToggle?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
};

export const PlaqueListItem = ({
  plaque,
  isFavorite = false,
  isSelected = false,
  onSelect,
  onFavoriteToggle,
  onClick
}: PlaqueListItemProps) => {
  const handleClick = () => {
    if (onClick) onClick(plaque);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) onFavoriteToggle(plaque.id);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(plaque.id);
  };

  // Handle color for display (merging color and colour fields)
  const plaqueColor = plaque.color || plaque.colour || 'unknown';
  
  // Handle location display (address or custom formatted location)
  const locationDisplay = plaque.location || plaque.address || '';

  // Image source with fallback
  const imageUrl = plaque.image || plaque.main_photo;

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-32 sm:h-auto h-32 shrink-0">
          <PlaqueImage 
            src={imageUrl}
            alt={plaque.title} 
            className="w-full h-full object-cover"
            fallbackIcon={<MapPin size={24} className="text-gray-400" />}
          />
        </div>
        
        <div className="flex-grow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{plaque.title}</h3>
              <p className="text-gray-500 text-sm flex items-center mt-1">
                <MapPin size={14} className="mr-1 shrink-0" /> 
                <span className="truncate">{locationDisplay}</span>
                {plaque.area && <span className="ml-1 hidden sm:inline">, {plaque.area}</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {onFavoriteToggle && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isFavorite ? 'text-amber-500' : 'text-gray-400'}`}
                  onClick={handleFavoriteClick}
                >
                  <Star size={18} className={isFavorite ? 'fill-amber-500' : ''} />
                </Button>
              )}
              
              {isSelected && (
                <div 
                  className="bg-blue-100 text-blue-600 p-1 rounded-full cursor-pointer"
                  onClick={handleSelectClick}
                >
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {plaqueColor && plaqueColor !== "Unknown" && (
              <Badge 
                variant="outline" 
                className={`
                  ${plaqueColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${plaqueColor === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${plaqueColor === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                  ${plaqueColor === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                  ${plaqueColor === 'grey' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                `}
              >
                {plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} Plaque
              </Badge>
            )}
            
            {plaque.lead_subject_primary_role && plaque.lead_subject_primary_role !== "Unknown" && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
                 (plaque.lead_subject_primary_role as string).slice(1)}
              </Badge>
            )}
            
            {plaque.visited && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle size={12} className="mr-1" /> Visited
              </Badge>
            )}
          </div>
          
          {/* Short description preview - using inscription */}
          {plaque.inscription && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {plaque.inscription}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlaqueListItem;