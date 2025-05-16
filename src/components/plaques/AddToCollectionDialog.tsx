// src/components/plaques/AddToCollectionDialog.tsx
import { useState, useEffect } from 'react';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button,
  Input,
  Label,
  ScrollArea,
  Badge
} from '@/components/ui';
import { Plaque } from '@/types/plaque';
import { Plus, Search, Check, X, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import CreateCollectionDialog from '../collections/CreateCollectionDialog';

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plaque: Plaque;
}

const AddToCollectionDialog = ({ isOpen, onClose, plaque }: AddToCollectionDialogProps) => {
  const { user } = useAuth();
  const { collections, loading, addPlaqueToCollection } = useCollections();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  
  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCollections([]);
      setSearchQuery('');
    }
  }, [isOpen]);
  
  // Filter collections based on search query
  const filteredCollections = collections.filter(collection => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.description.toLowerCase().includes(query)
    );
  });
  
  // Toggle collection selection
  const toggleCollection = (collectionId: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };
  
  // Check if plaque is already in a collection
  const isPlaqueInCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    return collection?.plaques.includes(plaque.id) || false;
  };
  
  // Handle adding plaque to selected collections
  const handleAddToCollections = async () => {
    if (!user) {
      toast.error('Please sign in to add plaques to collections');
      onClose();
      return;
    }
    
    if (selectedCollections.length === 0) {
      toast.error('Please select at least one collection');
      return;
    }
    
    setIsAdding(true);
    try {
      // Add plaque to each selected collection
      const promises = selectedCollections.map(collectionId => 
        addPlaqueToCollection(collectionId, plaque.id)
      );
      
      await Promise.all(promises);
      
      const collectionCount = selectedCollections.length;
      toast.success(
        collectionCount === 1 
          ? 'Plaque added to collection'
          : `Plaque added to ${collectionCount} collections`
      );
      
      onClose();
    } catch (err) {
      console.error('Error adding plaque to collections:', err);
      toast.error('Failed to add plaque to collections');
    } finally {
      setIsAdding(false);
    }
  };
  
  // Handle creating a new collection with this plaque
  const handleCreateNewCollection = () => {
    setShowNewCollectionDialog(true);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCreateNewCollection}
            >
              <Plus size={16} /> Create New Collection
            </Button>
            
            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading collections...</p>
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="py-8 text-center">
                <FolderPlus className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No collections found</p>
                <p className="text-xs text-gray-400">Create a new collection to get started</p>
              </div>
            ) : (
              <ScrollArea className="h-60 pr-4">
                <div className="space-y-2">
                  {filteredCollections.map(collection => {
                    const isInCollection = isPlaqueInCollection(collection.id);
                    const isSelected = selectedCollections.includes(collection.id);
                    
                    return (
                      <div
                        key={collection.id}
                        className={`
                          p-3 border rounded-md flex items-center gap-3 cursor-pointer transition-colors
                          ${isInCollection ? 'bg-gray-50 border-gray-200' : ''}
                          ${isSelected && !isInCollection ? 'bg-blue-50 border-blue-200' : ''}
                          ${!isInCollection && !isSelected ? 'hover:bg-gray-50' : ''}
                        `}
                        onClick={() => {
                          if (!isInCollection) {
                            toggleCollection(collection.id);
                          }
                        }}
                      >
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white bg-${collection.color.split('-')[0]}-500`}>
                          <span className="text-lg">{collection.icon}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{collection.name}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {collection.plaques.length} plaque{collection.plaques.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        {isInCollection ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check size={12} className="mr-1" /> In Collection
                          </Badge>
                        ) : (
                          <div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToCollections} 
              disabled={isAdding || selectedCollections.length === 0}
            >
              {isAdding ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Adding...
                </>
              ) : `Add to ${selectedCollections.length} Collection${selectedCollections.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create New Collection Dialog */}
      <CreateCollectionDialog 
        isOpen={showNewCollectionDialog}
        onClose={() => setShowNewCollectionDialog(false)}
        initialPlaques={[plaque]}
      />
    </>
  );
};

export default AddToCollectionDialog;