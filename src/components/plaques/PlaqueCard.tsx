import React from 'react';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Use the updated Plaque type
import { Plaque } from '@/types/plaque';

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

  // Handle color for display (merging color and colour fields)
  const plaqueColor = plaque.color || plaque.colour || 'unknown';
  
  // Handle location display (address or custom formatted location)
  const locationDisplay = plaque.location || plaque.address || '';

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="relative h-40 bg-blue-50">
        <img 
          src={plaque.image || "/api/placeholder/400/300"} 
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
          <span className="truncate">{locationDisplay}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
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
          <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-700 border-gray-200">
            {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
             (plaque.lead_subject_primary_role as string).slice(1)}
          </Badge>
        )}
        
        {/* Short description preview - using inscription */}
        {plaque.inscription && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {plaque.inscription}
          </p>
        )}
        
      </CardContent>
    </Card>
  );
};

export default PlaqueCard;