// src/features/collections/components/DeleteCollectionDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteCollectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isLoading: boolean;
  collectionNames: string[];
};

const DeleteCollectionDialog: React.FC<DeleteCollectionDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  isLoading,
  collectionNames
}) => {
  const isSingleCollection = collectionNames.length === 1;
  const collectionName = isSingleCollection ? collectionNames[0] : `${collectionNames.length} collections`;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {isSingleCollection ? 'Collection' : `${collectionNames.length} Collections`}
          </DialogTitle>
          <DialogDescription>
            {isSingleCollection 
              ? `Are you sure you want to delete "${collectionName}"?`
              : `Are you sure you want to delete these ${collectionNames.length} collections?`
            } This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Deleting...
              </>
            ) : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollectionDialog;