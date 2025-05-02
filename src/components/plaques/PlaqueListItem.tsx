import React from 'react';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Plaque } from './PlaqueCard';

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

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-32 sm:h-auto h-32 shrink-0">
          <img 
            src={plaque.image} 
            alt={plaque.title} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-grow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{plaque.title}</h3>
              <p className="text-gray-500 text-sm flex items-center mt-1">
                <MapPin size={14} className="mr-1" /> {plaque.location}
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
          
          <div className="mt-2 flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`
                ${plaque.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${plaque.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                ${plaque.color === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                ${plaque.color === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
              `}
            >
              {plaque.color.charAt(0).toUpperCase() + plaque.color.slice(1)}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {plaque.profession}
            </Badge>
            {plaque.visited && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle size={12} className="mr-1" /> Visited
              </Badge>
            )}
            
            {plaque.added && (
              <span className="text-xs text-gray-500 ml-auto">Added {plaque.added}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlaqueListItem;