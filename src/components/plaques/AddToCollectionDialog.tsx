// src/components/plaques/AddToCollectionDialog.tsx - Mobile optimized with FIXED Z-INDEX
import { useState, useEffect } from 'react';
import { useCollections } from '../../hooks/useCollection';
import { useAuth } from '@/hooks/useAuth';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { MobileButton } from '@/components/ui/mobile-button';
import { MobileInput } from '@/components/ui/mobile-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Check, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plaque: Plaque;
  style?: React.CSSProperties;
  className?: string;
}

const AddToCollectionDialog = ({
  isOpen,
  onClose,
  plaque,
  className = '',
}: AddToCollectionDialogProps) => {
  const { user } = useAuth();
  const { collections, loading, addPlaqueToCollection } = useCollections();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCollections([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter collections based on search query
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  });

  // Toggle collection selection with haptic feedback
  const toggleCollection = (collectionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const collection = collections.find((c) => c.id === collectionId);
    const isInCollection = collection?.plaques?.includes(plaque.id) || false;

    // Don't allow selection if plaque is already in collection
    if (isInCollection) {
      return;
    }

    triggerHapticFeedback('selection');

    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  // Check if plaque is already in a collection
  const isPlaqueInCollection = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.plaques?.includes(plaque.id) || false;
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
    triggerHapticFeedback('light');

    try {
      // Add plaque to each selected collection
      const promises = selectedCollections.map((collectionId) =>
        addPlaqueToCollection(collectionId, plaque.id)
      );

      await Promise.all(promises);

      const collectionNames = selectedCollections
        .map((id) => collections.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      triggerHapticFeedback('success');
      toast.success(
        selectedCollections.length === 1
          ? `Added to "${collectionNames}"`
          : `Added to ${selectedCollections.length} collections`
      );

      onClose();
    } catch (err) {
      console.error('Error adding plaque to collections:', err);
      triggerHapticFeedback('error');
      toast.error('Failed to add plaque to collections');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <MobileDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Collection"
      size="md"
      className={`z-[10001] ${className}`}
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <MobileButton
            variant="outline"
            onClick={onClose}
            disabled={isAdding}
            className="flex-1"
          >
            Cancel
          </MobileButton>
          <MobileButton
            onClick={handleAddToCollections}
            disabled={isAdding || selectedCollections.length === 0}
            className="flex-1"
          >
            {isAdding ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Adding...
              </>
            ) : selectedCollections.length > 0 ? (
              `Add to ${selectedCollections.length} Collection${selectedCollections.length !== 1 ? 's' : ''}`
            ) : (
              'Select Collections'
            )}
          </MobileButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Input - Mobile optimized */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <MobileInput
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-base text-gray-500">
              Loading collections...
            </p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-base text-gray-500 mb-2">No collections found</p>
            <p className="text-sm text-gray-400">
              Create a new collection from the Collections page
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64 sm:h-80">
            <div className="space-y-3 pr-2">
              {filteredCollections.map((collection) => {
                const isInCollection = isPlaqueInCollection(collection.id);
                const isSelected = selectedCollections.includes(collection.id);

                return (
                  <div
                    key={collection.id}
                    className={`
                      p-4 border rounded-lg flex items-center gap-4 transition-colors touch-manipulation
                      ${isInCollection ? 'bg-gray-50 border-gray-200 cursor-default' : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'}
                      ${isSelected && !isInCollection ? 'bg-blue-50 border-blue-200' : ''}
                    `}
                    onClick={(e) => {
                      if (!isInCollection) {
                        toggleCollection(collection.id, e);
                      }
                    }}
                  >
                    {/* Collection Icon - Larger for mobile */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${collection.color}`}
                    >
                      {collection.icon}
                    </div>

                    {/* Collection Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base mb-1">
                        {collection.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {Array.isArray(collection.plaques)
                          ? collection.plaques.length
                          : collection.plaques || 0}{' '}
                        plaque
                        {(Array.isArray(collection.plaques)
                          ? collection.plaques.length
                          : collection.plaques || 0) !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>

                    {/* Selection Indicator - Mobile optimized */}
                    {isInCollection ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
                      >
                        <Check size={14} className="mr-1" /> Added
                      </Badge>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center touch-manipulation ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollection(collection.id, e);
                        }}
                      >
                        {isSelected && <Check size={16} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </MobileDialog>
  );
};

export default AddToCollectionDialog;
