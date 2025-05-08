import React from 'react';
import { CollectionCard } from '@/components';
import type { Collection } from '@/types/collection';

type CollectionsGridProps = {
  collections: Collection[];
  selectedCollections: number[];
  menuOpenId: number | null;
  onToggleSelect: (id: number) => void;
  onMenuOpen: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
  getUpdatedText: (timestamp: string) => string;
};

const CollectionsGrid = ({
  collections,
  selectedCollections,
  menuOpenId,
  onToggleSelect,
  onMenuOpen,
  onEdit,
  onDuplicate,
  onShare,
  onDelete,
  getUpdatedText
}: CollectionsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => {
        // Format the "updated X ago" text
        const updatedText = getUpdatedText(collection.updated_at);
        
        // Create a collection object compatible with the component
        const collectionData = {
          ...collection,
          updated: updatedText,
          plaques: collection.plaques.length, // Convert array to count for display
          isFavorite: collection.is_favorite
        };
        
        return (
          <CollectionCard 
            key={collection.id}
            collection={collectionData}
            isSelected={selectedCollections.includes(collection.id)}
            menuOpenId={menuOpenId}
            onToggleSelect={onToggleSelect}
            onMenuOpen={onMenuOpen}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onShare={onShare}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};

export default CollectionsGrid;