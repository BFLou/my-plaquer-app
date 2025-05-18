
// src/features/collections/components/CollectionHeader.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

type CollectionHeaderProps = {
  title: string;
  onCreateCollection: () => void;
  isLoading?: boolean;
  className?: string;
};

const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  title,
  onCreateCollection,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button onClick={onCreateCollection} disabled={isLoading}>
        <Plus size={16} className="mr-2" /> New Collection
      </Button>
    </div>
  );
};

export default CollectionHeader;