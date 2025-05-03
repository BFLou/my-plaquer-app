import React from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plaque } from '@/types/plaque';

type AddPlaquesSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availablePlaques: Plaque[];
  onAddPlaque: (id: number) => void;
  onAddAllPlaques: () => void;
};

export const AddPlaquesSheet: React.FC<AddPlaquesSheetProps> = ({
  isOpen,
  onOpenChange,
  availablePlaques,
  onAddPlaque,
  onAddAllPlaques,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Plaques to Collection</SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search plaques..."
              className="pl-9"
            />
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            {availablePlaques.length > 0 ? (
              availablePlaques.map(plaque => (
                <div 
                  key={plaque.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => onAddPlaque(plaque.id)}
                >
                  <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                    <img src={plaque.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium truncate">{plaque.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
                  </div>
                  <Checkbox />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin size={32} className="mx-auto mb-3 text-gray-400" />
                <p>No more plaques available to add</p>
              </div>
            )}
          </div>
        </div>
        
        <SheetFooter>
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-600">
              {availablePlaques.length} plaque{availablePlaques.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {availablePlaques.length > 0 && (
                <Button onClick={onAddAllPlaques}>
                  Add All
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

type RemovePlaquesSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmRemove: () => void;
};

export const RemovePlaquesSheet: React.FC<RemovePlaquesSheetProps> = ({
  isOpen,
  onOpenChange,
  selectedCount,
  onConfirmRemove,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Remove Plaques</SheetTitle>
        </SheetHeader>
        
        <div className="py-6">
          <p className="mb-4">
            Are you sure you want to remove {selectedCount} plaque{selectedCount !== 1 ? 's' : ''} from this collection? 
            This action won't delete the plaques from the system, only from this collection.
          </p>
        </div>
        
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmRemove}>
            Remove
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export { AddPlaquesSheet, RemovePlaquesSheet };