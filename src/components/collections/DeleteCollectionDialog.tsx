// src/components/collections/DeleteCollectionDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DeleteCollectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isLoading: boolean;
  collectionNames?: string[];
  itemType?: 'collection' | 'plaque';
  plaqueTitle?: string;
};

const DeleteCollectionDialog: React.FC<DeleteCollectionDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  isLoading,
  collectionNames = [],
  itemType = 'collection',
  plaqueTitle,
}) => {
  // Determine what we're deleting and how to display it
  const getDialogContent = () => {
    if (itemType === 'plaque' && plaqueTitle) {
      return {
        title: 'Remove Plaque',
        description: (
          <span>
            Are you sure you want to remove <strong>{plaqueTitle}</strong> from
            this collection? This action cannot be undone.
          </span>
        ),
        buttonText: 'Remove Plaque',
      };
    }

    // Default to collection deletion logic with null checks
    const safeCollectionNames = collectionNames || [];
    const isSingleCollection = safeCollectionNames.length === 1;
    const collectionName = isSingleCollection
      ? safeCollectionNames[0]
      : `${safeCollectionNames.length} collections`;

    return {
      title: isSingleCollection
        ? 'Delete Collection'
        : `Delete ${safeCollectionNames.length} Collections`,
      description: isSingleCollection ? (
        <span>
          Are you sure you want to delete <strong>{collectionName}</strong>?
          This action cannot be undone.
        </span>
      ) : (
        <span>
          Are you sure you want to delete these{' '}
          <strong>{safeCollectionNames.length} collections</strong>? This action
          cannot be undone.
        </span>
      ),
      buttonText: 'Delete',
    };
  };

  const { title, description, buttonText } = getDialogContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                {itemType === 'plaque' ? 'Removing...' : 'Deleting...'}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollectionDialog;
