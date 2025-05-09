// src/pages/CollectionsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MapPin, 
  X, Star, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

// Data
import userData from '../data/user_data.json';

const CollectionsPage = () => {
  const navigate = useNavigate();
  
  // State
  const [collections, setCollections] = useState(userData.collections || []);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_updated');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editCollectionData, setEditCollectionData] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [collectionsToDelete, setCollectionsToDelete] = useState([]);
  
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
        return new Date(b.updated_at) - new Date(a.updated_at);
      case 'oldest_updated':
        return new Date(a.updated_at) - new Date(b.updated_at);
      case 'a_to_z':
        return a.name.localeCompare(b.name);
      case 'z_to_a':
        return b.name.localeCompare(a.name);
      case 'most_plaques':
        const bCount = Array.isArray(b.plaques) ? b.plaques.length : b.plaques;
        const aCount = Array.isArray(a.plaques) ? a.plaques.length : a.plaques;
        return bCount - aCount;
      case 'least_plaques':
        const aCount2 = Array.isArray(a.plaques) ? a.plaques.length : a.plaques;
        const bCount2 = Array.isArray(b.plaques) ? b.plaques.length : b.plaques;
        return aCount2 - bCount2;
      default:
        return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });
  
  // Toggle selection of collection
  const toggleSelect = (id) => {
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Handle creating a new collection
  const handleCreateCollection = (data) => {
    const newCollection = {
      id: Date.now(),
      name: data.name,
      description: data.description || '',
      icon: data.icon,
      color: data.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
      plaques: []
    };
    
    setCollections(prev => [newCollection, ...prev]);
    setCreateCollectionOpen(false);
  };
  
  // Handle editing a collection
  const handleEditCollection = (data) => {
    if (!editCollectionData) return;
    
    setCollections(prev => prev.map(collection => 
      collection.id === editCollectionData.id ? {
        ...collection,
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        updated_at: new Date().toISOString()
      } : collection
    ));
    
    setEditCollectionOpen(false);
    setEditCollectionData(null);
  };
  
  // Open edit dialog
  const openEditDialog = (id) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = (id) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id ? {
        ...collection,
        is_favorite: !collection.is_favorite
      } : collection
    ));
  };
  
  // Duplicate a collection
  const duplicateCollection = (id) => {
    const collection = collections.find(c => c.id === id);
    
    if (collection) {
      const duplicate = {
        ...collection,
        id: Date.now(),
        name: `${collection.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false
      };
      
      setCollections(prev => [duplicate, ...prev]);
    }
  };
  
  // Delete collections
  const deleteCollections = () => {
    setCollections(prev => prev.filter(collection => 
      !collectionsToDelete.includes(collection.id)
    ));
    
    setSelectedCollections(prev => 
      prev.filter(id => !collectionsToDelete.includes(id))
    );
    
    setCollectionsToDelete([]);
    setConfirmDeleteOpen(false);
  };
  
  // Handle batch actions
  const handleBatchDelete = () => {
    setCollectionsToDelete(selectedCollections);
    setConfirmDeleteOpen(true);
  };
  
  const handleBatchFavorite = () => {
    setCollections(prev => prev.map(collection => 
      selectedCollections.includes(collection.id) ? {
        ...collection,
        is_favorite: true
      } : collection
    ));
    
    setSelectedCollections([]);
  };
  
  // Navigate to collection details
  const navigateToCollection = (id) => {
    navigate(`/collections/${id}`);
  };
  
  // Active filters for display
  const activeFilters = [];
  if (showOnlyFavorites) activeFilters.push('Favorites');
  if (searchQuery) activeFilters.push('Search');
  
  // Check if we're in selection mode
  const isSelectionMode = selectedCollections.length > 0;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collections</h1>
        <Button onClick={() => setCreateCollectionOpen(true)}>
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
                  onDuplicate={duplicateCollection}
                  onToggleFavorite={toggleFavorite}
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
                  onDuplicate={duplicateCollection}
                  onToggleFavorite={toggleFavorite}
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
              onClick: handleBatchFavorite
            },
            {
              label: "Delete",
              variant: "destructive",
              icon: <Trash2 size={16} />,
              onClick: handleBatchDelete
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
                color: editCollectionData.color
              }}
              onSubmit={handleEditCollection}
              onCancel={() => {
                setEditCollectionOpen(false);
                setEditCollectionData(null);
              }}
              submitLabel="Save Changes"
              className="pt-4"
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
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCollections}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsPage;