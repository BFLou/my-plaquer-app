import React from 'react';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Plaque = {
  id: number;
  title: string;
  location: string;
  postcode?: string;
  color: string;
  profession: string;
  description: string;
  visited: boolean;
  image: string;
  added?: string;
};

type PlaqueCardProps = {
  plaque: Plaque;
  isFavorite?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onFavoriteToggle?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
};

export const PlaqueCard = ({
  plaque,
  isFavorite = false,
  isSelected = false,
  onSelect,
  onFavoriteToggle,
  onClick
}: PlaqueCardProps) => {
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
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="relative h-40 bg-blue-50">
        <img 
          src={plaque.image} 
          alt={plaque.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {plaque.visited && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
              <CheckCircle size={12} className="mr-1" /> Visited
            </Badge>
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
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
            {plaque.title}
          </CardTitle>
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
        </div>
        <CardDescription className="flex items-center text-gray-500">
          <MapPin size={14} className="mr-1 shrink-0" /> 
          <span className="truncate">{plaque.location}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
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
        <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-700 border-gray-200">
          {plaque.profession}
        </Badge>
        
        {plaque.added && (
          <div className="mt-3 text-xs text-gray-500 text-right">
            Added {plaque.added}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaqueCard;