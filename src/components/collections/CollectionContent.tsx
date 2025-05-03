import React from 'react';
import { MapIcon } from 'lucide-react';
import { 
  PlaqueCard,
  PlaqueListItem,
  EmptyState,
  ViewMode,
  type Plaque 
} from '@/components';
import { Button } from "@/components/ui/button";

type CollectionContentProps = {
  viewMode: ViewMode;
  plaques: Plaque[];
  searchQuery: string;
  sortOption: string;
  selectedPlaques: number[];
  onToggleSelect: (id: number) => void;
  onPlaqueClick: (plaque: Plaque) => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onAddPlaques: () => void;
};

export const CollectionContent: React.FC<CollectionContentProps> = ({
  viewMode,
  plaques,
  searchQuery,
  sortOption,
  selectedPlaques,
  onToggleSelect,
  onPlaqueClick,
  favorites,
  onToggleFavorite,
  onAddPlaques,
}) => {
  // Sort plaques based on the selected option
  const sortedPlaques = [...plaques].sort((a, b) => {
    if (sortOption === 'recently_added') return -1; // Assuming the array is already in recently added order
    if (sortOption === 'oldest_first') return 1;
    if (sortOption === 'a_to_z') return a.title.localeCompare(b.title);
    if (sortOption === 'z_to_a') return b.title.localeCompare(a.title);
    return 0;
  }).filter(plaque => 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (plaques.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="No Plaques Yet"
        description="Start building your collection by adding plaques"
        actionLabel="Add Your First Plaque"
        onAction={onAddPlaques}
      />
    );
  }

  return (
    <>
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedPlaques.map((plaque) => (
            <PlaqueCard 
              key={plaque.id}
              plaque={plaque}
              isSelected={selectedPlaques.includes(plaque.id)}
              onSelect={onToggleSelect}
              onClick={onPlaqueClick}
              isFavorite={favorites.includes(plaque.id)}
              onFavoriteToggle={onToggleFavorite}
            />
          ))}
        </div>
      )}
      
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedPlaques.map((plaque) => (
            <PlaqueListItem 
              key={plaque.id}
              plaque={plaque}
              isSelected={selectedPlaques.includes(plaque.id)}
              onSelect={onToggleSelect}
              onClick={onPlaqueClick}
              isFavorite={favorites.includes(plaque.id)}
              onFavoriteToggle={onToggleFavorite}
            />
          ))}
        </div>
      )}
      
      {viewMode === 'map' && (
        <div className="bg-gray-50 rounded-xl p-8 h-[500px] flex flex-col items-center justify-center text-center">
          <MapIcon size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
          <p className="text-gray-500 mb-4">Visualize your collection's plaques geographically</p>
          <Button variant="outline">Get Notified When Ready</Button>
        </div>
      )}
    </>
  );
};

export default CollectionContent;