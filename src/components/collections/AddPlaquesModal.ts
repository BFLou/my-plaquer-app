// src/components/collections/AddPlaquesModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input,
} from '@/components/ui';
import { Search, Check, X, Plus, MapPin, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import PlaqueImage from '../plaques/PlaqueImage';

interface AddPlaquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaques: (plaqueIds: number[]) => Promise<void>;
  availablePlaques: Plaque[];
  isLoading?: boolean;
}

const AddPlaquesModal: React.FC<AddPlaquesModalProps> = ({
  isOpen,
  onClose,
  onAddPlaques,
  availablePlaques,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaqueIds, setSelectedPlaqueIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaqueIds([]);
      setSearchQuery('');
    }
  }, [isOpen]);
  
  // Filter plaques based on search query
  const filteredPlaques = availablePlaques.filter(plaque => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      plaque.title.toLowerCase().includes(query) ||
      (plaque.location && plaque.location.toLowerCase().includes(query)) ||
      (plaque.profession && plaque.profession.toLowerCase().includes(query)) ||
      (plaque.postcode && plaque.postcode.toLowerCase().includes(query))
    );
  });
  
  // Toggle selection of a plaque
  const togglePlaque = (plaqueId: number) => {
    setSelectedPlaqueIds(prev =>
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
  };
  
  // Handle adding plaques
  const handleAddPlaques = async () => {
    if (selectedPlaqueIds.length === 0) {
      toast.error('Please select at least one plaque to add');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onAddPlaques(selectedPlaqueIds);
      onClose();
    } catch (error) {
      console.error('Error adding plaques:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Plaques to Collection</DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 text-sm text-gray-500 bg-blue-50 p-4 rounded-md border border-blue-100">
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <span>You can also add plaques directly from the <strong>Discover</strong> page when browsing the map or list view.</span>
          </p>
        </div>
        
        <div className="flex justify-between items-center mt-4 mb-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search plaques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {selectedPlaqueIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedPlaqueIds.length} selected
            </Badge>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader className="animate-spin text-blue-500" size={24} />
              <p className="text-gray-500 text-sm">Loading plaques...</p>
            </div>
          </div>
        ) : filteredPlaques.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <>
                <p className="mb-2">No plaques match your search.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <p>No plaques available to add to this collection.</p>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] mt-2 pr-2">
            <div className="space-y-2">
              {filteredPlaques.map(plaque => (
                <div
                  key={plaque.id}
                  className={`border rounded-lg overflow-hidden ${
                    selectedPlaqueIds.includes(plaque.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors cursor-pointer`}
                  onClick={() => togglePlaque(plaque.id)}
                >
                  <div className="flex items-center p-3">
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      <PlaqueImage
                        src={plaque.image || plaque.main_photo}
                        alt={plaque.title}
                        className="w-full h-full object-cover"
                        plaqueColor={plaque.color}
                      />
                    </div>
                    
                    <div className="ml-3 flex-grow">
                      <h4 className="font-medium text-sm">{plaque.title}</h4>
                      <p className="text-xs text-gray-500">{plaque.location || plaque.address}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plaque.color && (
                          <Badge variant="outline" className="text-xs py-0">
                            {plaque.color}
                          </Badge>
                        )}
                        {plaque.profession && (
                          <Badge variant="outline" className="text-xs py-0">
                            {plaque.profession}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                      selectedPlaqueIds.includes(plaque.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlaqueIds.includes(plaque.id) && <Check size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddPlaques} 
            disabled={selectedPlaqueIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Add {selectedPlaqueIds.length > 0 ? selectedPlaqueIds.length : ''} Plaques
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaquesModal;