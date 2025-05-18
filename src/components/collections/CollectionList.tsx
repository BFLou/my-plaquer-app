// src/features/collections/components/CollectionList.tsx
import React from 'react';
import { Collection } from './CollectionCard';
import CollectionListItem from './CollectionListItem';

type CollectionListProps = {
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

const CollectionList: React.FC<CollectionListProps> = ({
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
    <div className={`space-y-3 ${className}`}>
      {collections.map(collection => (
        <CollectionListItem
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

export default CollectionList;