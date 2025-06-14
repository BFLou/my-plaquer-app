// src/features/collections/components/forms/CollectionEditForm.tsx
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CollectionForm } from '@/components/collections/CollectionForm';
import { Collection } from './CollectionCard';

type CollectionEditFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  collection: Collection | null;
};

const CollectionEditForm: React.FC<CollectionEditFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  collection,
}) => {
  if (!collection) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Collection</SheetTitle>
        </SheetHeader>

        <CollectionForm
          initialValues={{
            name: collection.name,
            description: collection.description || '',
            icon: collection.icon,
            color: collection.color,
            tags: collection.tags || [],
          }}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel="Save Changes"
          className="pt-4"
          isLoading={isLoading}
        />
      </SheetContent>
    </Sheet>
  );
};

export default CollectionEditForm;
