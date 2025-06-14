// src/components/collections/CollectionPlaqueGrid.tsx
import React from 'react';
import { Plaque } from '@/types/plaque';
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { EmptyState } from '@/components/common/EmptyState';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  onAddToRoute?: (plaque: Plaque) => void;
  className?: string;
};

const CollectionPlaqueGrid: React.FC<CollectionPlaqueGridProps> = ({
  plaques,
  isLoading = false,
  selectedPlaques,
  searchQuery,
  onClearSearch,
  onToggleSelect,
  onMarkVisited,
  onRemovePlaque,
  onPlaqueClick,
  onAddToRoute,
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
        icon={<MapPin />}
        title="No Plaques Yet"
        description="Start building your collection by adding plaques"
      />
    );
  }

  if (plaques.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Search className="mx-auto text-gray-400 mb-3" size={32} />
        <h3 className="text-lg font-medium text-gray-700 mb-1">
          No Results Found
        </h3>
        <p className="text-gray-500 mb-4">
          No plaques match your search criteria
        </p>
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {plaques.map((plaque) => (
        <PlaqueCard
          key={plaque.id}
          plaque={plaque}
          isSelected={selectedPlaques.includes(plaque.id)}
          onSelect={onToggleSelect}
          onMarkVisited={onMarkVisited}
          onRemovePlaque={onRemovePlaque}
          onClick={onPlaqueClick}
          onAddToRoute={onAddToRoute}
          showSelection={false} // Changed from true to false
          variant="collection"
        />
      ))}
    </div>
  );
};

export default CollectionPlaqueGrid;
