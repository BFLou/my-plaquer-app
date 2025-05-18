// src/features/collections/components/CollectionGrid.tsx
import React from 'react';
import { Collection } from './CollectionCard';
import CollectionCard from './CollectionCard';

type CollectionGridProps = {
  collections: Collection[];
  selectedCollections: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  className?: string;
};

const CollectionGrid: React.FC<CollectionGridProps> = ({
  collections,
  selectedCollections,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onDelete,
  onClick,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {collections.map(collection => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          isSelected={selectedCollections.includes(collection.id)}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default CollectionGrid;