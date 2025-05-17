// src/pages/CollectionsPage.tsx
import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MapPin, 
  X, Star, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from "@/components";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Collection Components
import ImprovedCollectionCard from '@/components/collections/ImprovedCollectionCard';
import ImprovedCollectionListItem from '@/components/collections/ImprovedCollectionListItem';
import { CollectionForm } from '@/components/collections/CollectionForm';
import { EmptyState } from '@/components/common/EmptyState';
import { ViewToggle } from '@/components/common/ViewToggle';
import { SearchableFilterBar } from '@/components/common/SearchableFilterBar';
import { ActionBar } from '@/components/common/ActionBar';

// Firebase Hooks
import { useCollections } from '../hooks/useCollection';
import { toast } from 'sonner';

const CollectionsPage = () => {
  const navigate = useNavigate();
  
  // Firebase collections hook
  const { 
    collections, 
    loading, 
    error, 
    createCollection, 
    updateCollection, 
    deleteCollection, 
    batchDeleteCollections,
    toggleFavorite,
    batchToggleFavorite,
    duplicateCollection
  } = useCollections();
  
  // UI State
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_updated');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editCollectionData, setEditCollectionData] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [collectionsToDelete, setCollectionsToDelete] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter collections based on search query and favorites
  const filteredCollections = collections.filter(collection => {
    // Filter by favorites if toggled
    if (showOnlyFavorites && !collection.is_favorite) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        collection.name.toLowerCase().includes(query) || 
        (collection.description && collection.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Sort collections
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    switch(sortOption) {
      case 'recently_updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'oldest_updated':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'a_to_z':
        return a.name.localeCompare(b.name);
      case 'z_to_a':
        return b.name.localeCompare(a.name);
      case 'most_plaques':
        const bCount = Array.isArray(b.plaques) ? b.plaques.length : b.plaques.length;
        const aCount = Array.isArray(a.plaques) ? a.plaques.length : a.plaques.length;
        return bCount - aCount;
      case 'least_plaques':
        const aCount2 = Array.isArray(a.plaques) ? a.plaques.length : a.plaques.length;
        const bCount2 = Array.isArray(b.plaques) ? b.plaques.length : b.plaques.length;
        return aCount2 - bCount2;
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });
  
  // Toggle selection of collection
  const toggleSelect = (id: string) => {
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Handle creating a new collection
  const handleCreateCollection = async (data: any) => {
    try {
      setIsLoading(true);
      await createCollection(
        data.name,
        data.icon,
        data.color,
        data.description || '',
        [], // Initial plaques
        data.tags || []
      );
      setCreateCollectionOpen(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle editing a collection
  const handleEditCollection = async (data: any) => {
    if (!editCollectionData) return;
    
    try {
      setIsLoading(true);
      await updateCollection(editCollectionData.id, {
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        tags: data.tags || []
      });
      
      setEditCollectionOpen(false);
      setEditCollectionData(null);
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open edit dialog
  const openEditDialog = (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };
  
  // Duplicate a collection
  const handleDuplicateCollection = async (id: string) => {
    try {
      setIsLoading(true);
      await duplicateCollection(id);
    } catch (error) {
      console.error("Error duplicating collection:", error);
      toast.error("Failed to duplicate collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete collections
  const handleDeleteCollections = async () => {
    try {
      setIsLoading(true);
      
      if (collectionsToDelete.length === 1) {
        await deleteCollection(collectionsToDelete[0]);
      } else {
        await batchDeleteCollections(collectionsToDelete);
      }
      
      setSelectedCollections(prev => 
        prev.filter(id => !collectionsToDelete.includes(id))
      );
      
      setCollectionsToDelete([]);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error deleting collections:", error);
      toast.error("Failed to delete collections");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle batch actions
  const handleBatchDelete = () => {
    setCollectionsToDelete(selectedCollections);
    setConfirmDeleteOpen(true);
  };
  
  const handleBatchFavorite = async () => {
    try {
      setIsLoading(true);
      await batchToggleFavorite(selectedCollections, true);
      setSelectedCollections([]);
    } catch (error) {
      console.error("Error batch favoriting:", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to collection details
  const navigateToCollection = (id: string) => {
    navigate(`/collections/${id}`);
  };
  
  // Active filters for display
  const activeFilters = [];
  if (showOnlyFavorites) activeFilters.push('Favorites');
  if (searchQuery) activeFilters.push('Search');
  
  // Check if we're in selection mode
  const isSelectionMode = selectedCollections.length > 0;
  
  // Show loading state
  if (loading && collections.length === 0) {
    return (
      <PageContainer activePage="collections" containerClass="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Collections</h1>
            <Button disabled>
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
              <p className="text-gray-500">Loading collections...</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <PageContainer activePage="collections" containerClass="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Collections</h1>
            <Button onClick={() => setCreateCollectionOpen(true)}>
              <Plus size={16} className="mr-2" /> New Collection
            </Button>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 font-medium mb-2">Error Loading Collections</h3>
            <p className="text-red-500 mb-4">There was a problem loading your collections.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer activePage="collections" containerClass="flex-grow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Collections</h1>
          <Button onClick={() => setCreateCollectionOpen(true)} disabled={isLoading}>
            <Plus size={16} className="mr-2" /> New Collection
          </Button>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <SearchableFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={() => {}} // Immediate filtering, no explicit search button needed
              onFilterClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              activeFilters={activeFilters}
              searchPlaceholder="Search collections..."
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3 items-center">
            <ViewToggle
              viewMode={viewMode}
              onChange={setViewMode}
              showMap={false}
            />
            
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recently_updated">Recently Updated</SelectItem>
                <SelectItem value="oldest_updated">Oldest Updated</SelectItem>
                <SelectItem value="a_to_z">A to Z</SelectItem>
                <SelectItem value="z_to_a">Z to A</SelectItem>
                <SelectItem value="most_plaques">Most Plaques</SelectItem>
                <SelectItem value="least_plaques">Least Plaques</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Collection List */}
        {collections.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Collections Yet"
            description="Start by creating your first collection to organize your plaques"
            actionLabel="Create Your First Collection"
            onAction={() => setCreateCollectionOpen(true)}
          />
        ) : sortedCollections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Search className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Results Found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setShowOnlyFavorites(false);
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCollections.map(collection => (
                  <ImprovedCollectionCard
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedCollections.includes(collection.id)}
                    onToggleSelect={toggleSelect}
                    onEdit={openEditDialog}
                    onDuplicate={handleDuplicateCollection}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={(id) => {
                      setCollectionsToDelete([id]);
                      setConfirmDeleteOpen(true);
                    }}
                    onClick={navigateToCollection}
                  />
                ))}
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="space-y-3">
                {sortedCollections.map(collection => (
                  <ImprovedCollectionListItem
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedCollections.includes(collection.id)}
                    onToggleSelect={toggleSelect}
                    onEdit={openEditDialog}
                    onDuplicate={handleDuplicateCollection}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={(id) => {
                      setCollectionsToDelete([id]);
                      setConfirmDeleteOpen(true);
                    }}
                    onClick={navigateToCollection}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Action bar for multiple selection */}
        {isSelectionMode && (
          <ActionBar
            title={selectedCollections.length === 1 ? "collection selected" : "collections selected"}
            count={selectedCollections.length}
            buttons={[
              {
                label: "Add to Favorites",
                icon: <Star size={16} />,
                onClick: handleBatchFavorite,
                disabled: isLoading
              },
              {
                label: "Delete",
                variant: "destructive",
                icon: <Trash2 size={16} />,
                onClick: handleBatchDelete,
                disabled: isLoading
              }
            ]}
            onClearSelection={() => setSelectedCollections([])}
          />
        )}
        
        {/* Create Collection Sheet */}
        <Sheet open={createCollectionOpen} onOpenChange={setCreateCollectionOpen}>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Create New Collection</SheetTitle>
            </SheetHeader>
            
            <CollectionForm
              onSubmit={handleCreateCollection}
              onCancel={() => setCreateCollectionOpen(false)}
              submitLabel="Create Collection"
              className="pt-4"
              isLoading={isLoading}
            />
          </SheetContent>
        </Sheet>
        
        {/* Edit Collection Sheet */}
        <Sheet open={editCollectionOpen} onOpenChange={setEditCollectionOpen}>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Edit Collection</SheetTitle>
            </SheetHeader>
            
            {editCollectionData && (
              <CollectionForm
                initialValues={{
                  name: editCollectionData.name,
                  description: editCollectionData.description,
                  icon: editCollectionData.icon,
                  color: editCollectionData.color,
                  tags: editCollectionData.tags || []
                }}
                onSubmit={handleEditCollection}
                onCancel={() => {
                  setEditCollectionOpen(false);
                  setEditCollectionData(null);
                }}
                submitLabel="Save Changes"
                className="pt-4"
                isLoading={isLoading}
              />
            )}
          </SheetContent>
        </Sheet>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Collection{collectionsToDelete.length > 1 ? 's' : ''}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {collectionsToDelete.length === 1 ? 'this collection' : `these ${collectionsToDelete.length} collections`}? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCollections} disabled={isLoading}>
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
      </div>
    </PageContainer>
  );
};

export default CollectionsPage;