// src/components/plaques/PlaqueCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage'; 
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';

type PlaqueCardProps = {
  plaque: Plaque;
  isFavorite?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onFavoriteToggle?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  onRemovePlaque?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
};

export const PlaqueCard = ({
  plaque,
  isFavorite = false,
  isSelected = false,
  onSelect,
  onFavoriteToggle,
  onMarkVisited,
  onRemovePlaque,
  onClick
}: PlaqueCardProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use the hook to check if a plaque is visited in Firebase
  const { isPlaqueVisited } = useVisitedPlaques();
  
  // Determine if the plaque is visited - either from the prop or from Firebase
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleClick = () => {
    if (onClick) onClick(plaque);
  };

  const handleMarkVisited = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkVisited) onMarkVisited(plaque.id);
    setShowDropdown(false);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) onFavoriteToggle(plaque.id);
    setShowDropdown(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemovePlaque) onRemovePlaque(plaque.id);
    setShowDropdown(false);
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
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative h-full"
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-full ring-2 ring-blue-500 rounded-lg z-10 pointer-events-none"></div>
      )}
      
      <div className="relative h-40 bg-blue-50">
        <PlaqueImage 
          src={imageUrl}
          alt={plaque.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          placeholderClassName="bg-blue-50"
          plaqueColor={plaqueColor}
        />
        
        {/* Corner Action Menu */}
        <div className="absolute top-2 right-2 z-20" ref={dropdownRef}>
          <button 
            className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/40 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-md shadow-lg py-1 z-30 border">
              {/* Mark as Visited */}
              {!isVisited && onMarkVisited && (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleMarkVisited}
                >
                  <CheckCircle size={14} className="mr-2 text-green-600" />
                  Mark as visited
                </button>
              )}
              
              {/* Favorite */}
              {onFavoriteToggle && (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleFavoriteToggle}
                >
                  <Star size={14} className={`mr-2 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </button>
              )}
              
              {/* Remove */}
              {onRemovePlaque && (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  onClick={handleRemove}
                >
                  <Trash2 size={14} className="mr-2" />
                  Remove from collection
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isVisited && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <CheckCircle size={10} className="mr-1" /> Visited
            </Badge>
          )}
          {isSelected && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <CheckCircle size={10} className="mr-1" /> Selected
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors line-clamp-2">
          {plaque.title}
        </CardTitle>
        <CardDescription className="flex items-center text-gray-500">
          <MapPin size={14} className="mr-1 shrink-0" /> 
          <span className="truncate">{locationDisplay}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {plaqueColor && plaqueColor !== "Unknown" && (
            <Badge 
              variant="outline" 
              className={`text-xs
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
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
              {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
               (plaque.lead_subject_primary_role as string).slice(1)}
            </Badge>
          )}
        </div>
        
        {/* Short description preview with line clamping */}
        {plaque.inscription && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {plaque.inscription}
          </p>
        )}
        
        {/* Selection checkbox */}
        {onSelect && (
          <div className="mt-3 flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectClick}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Select for bulk actions</span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaqueCard;