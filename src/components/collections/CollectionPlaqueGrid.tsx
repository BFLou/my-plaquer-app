// src/features/collections/components/CollectionPlaqueGrid.tsx
import React from 'react';
import { Plaque } from '@/types/plaque';
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { EmptyState } from '@/components/common/EmptyState';
import { MapPin, Search, MoreHorizontal, Star, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CollectionPlaqueGridProps = {
  plaques: Plaque[];
  isLoading?: boolean;
  favorites: number[];
  selectedPlaques: number[];
  searchQuery: string;
  onClearSearch: () => void;
  onToggleSelect: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onMarkVisited: (id: number) => void;
  onRemovePlaque: (id: number) => void;
  onPlaqueClick: (plaque: Plaque) => void;
  onAddPlaquesClick: () => void;
  className?: string;
};

const CollectionPlaqueGrid: React.FC<CollectionPlaqueGridProps> = ({
  plaques,
  isLoading = false,
  favorites,
  selectedPlaques,
  searchQuery,
  onClearSearch,
  onToggleSelect,
  onToggleFavorite,
  onMarkVisited,
  onRemovePlaque,
  onPlaqueClick,
  onAddPlaquesClick,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-500">Loading plaques...</p>
        </div>
      </div>
    );
  }

  if (plaques.length === 0 && !searchQuery) {
    return (
      <EmptyState
        icon={MapPin}
        title="No Plaques Yet"
        description="Start building your collection by adding plaques"
        actionLabel="Add Your First Plaque"
        onAction={onAddPlaquesClick}
      />
    );
  }

  if (plaques.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Search className="mx-auto text-gray-400 mb-3" size={32} />
        <h3 className="text-lg font-medium text-gray-700 mb-1">No Results Found</h3>
        <p className="text-gray-500 mb-4">No plaques match your search criteria</p>
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {plaques.map((plaque) => (
        <div key={plaque.id} className="relative group">
          <PlaqueCard
            plaque={plaque}
            isFavorite={favorites.includes(plaque.id)}
            isSelected={selectedPlaques.includes(plaque.id)}
            onSelect={() => onToggleSelect(plaque.id)}
            onFavoriteToggle={() => onToggleFavorite(plaque.id)}
            onClick={() => onPlaqueClick(plaque)}
          />
          
          {/* Context menu for more actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 hover:bg-white shadow-sm"
                onClick={(e) => e.stopPropagation()} // Prevent card click
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkVisited(plaque.id);
                }}
              >
                <Check size={16} className="mr-2" /> Mark as Visited
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(plaque.id);
                }}
              >
                <Star size={16} className={`mr-2 ${favorites.includes(plaque.id) ? "fill-amber-500" : ""}`} />
                {favorites.includes(plaque.id) ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlaque(plaque.id);
                }}
              >
                <Trash2 size={16} className="mr-2" /> Remove from Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
};

export default CollectionPlaqueGrid;