import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CollectionsHeader,
  CollectionsDashboard,
  CollectionsFilterBar,
  CollectionsList,
  CollectionsGrid,
  CollectionCreator,
  ActionBar,
  EmptyState,
  type ViewMode
} from '@/components';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import userData from '../data/user_data.json';
import type { Collection, NewCollection } from '@/types/collection';

const Collections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // State
  const [collections, setCollections] = useState<Collection[]>(userData.collections);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Load parameters from URL
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'grid' || view === 'list' || view === 'map')) {
      setViewMode(view as ViewMode);
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const sort = searchParams.get('sort');
    if (sort) {
      setSortOption(sort);
    }
  }, []);
  
  // Update URL when filters or view mode change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (sortOption !== 'newest') {
      params.set('sort', sortOption);
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [viewMode, searchQuery, sortOption, activeFilters]);
  
  // Filter collections based on current filters
  const getFilteredCollections = () => {
    let filtered = collections;
    
    // Match search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(collection => 
        collection.name.toLowerCase().includes(query) || 
        (collection.description && collection.description.toLowerCase().includes(query))
      );
    }
    
    // Apply filters from filter sheet
    if (activeFilters.includes('Favorites')) {
      filtered = filtered.filter(collection => collection.is_favorite);
    }
    
    if (activeFilters.includes('Public')) {
      filtered = filtered.filter(collection => collection.is_public);
    }
    
    // Sort collections based on selected option
    filtered.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOption === 'most_plaques') {
        return b.plaques.length - a.plaques.length;
      }
      if (sortOption === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    return filtered;
  };
  
  const filteredCollections = getFilteredCollections();
  
  // Format the "updated X ago" text
  const getUpdatedText = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // Event handlers
  const toggleSelect = (id: number) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleMenuOpen = (id: number) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  
  const handleEdit = (id: number) => {
    toast.success("Edit Collection", {
      description: `Editing collection ${id}`,
    });
  };
  
  const handleDuplicate = (id: number) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      const newCollection = {
        ...collection,
        id: collections.length + 1,
        name: `${collection.name} (Copy)`,
        plaques: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false
      };
      setCollections([...collections, newCollection]);
      
      toast.success("Collection Duplicated", {
        description: `Created a copy of "${collection.name}"`,
      });
    }
  };
  
  const handleShare = (id: number) => {
    toast.info("Share Collection", {
      description: "Sharing functionality would be implemented here",
    });
  };
  
  const handleToggleFavorite = (id: number) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id 
        ? { ...collection, is_favorite: !collection.is_favorite }
        : collection
    ));
    
    const collection = collections.find(c => c.id === id);
    if (collection) {
      toast.success(collection.is_favorite 
        ? "Removed from favorites" 
        : "Added to favorites", {
        description: `Collection "${collection.name}" ${collection.is_favorite ? 'removed from' : 'added to'} favorites`,
      });
    }
  };
  
  const handleDelete = (id: number) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
    
    toast.success("Collection Deleted", {
      description: "The collection has been deleted",
    });
  };
  
  const handleCreateCollection = () => {
    setCreateModalOpen(true);
  };
  
  const handleSaveCollection = (newCollection: NewCollection) => {
    const createdCollection = {
      id: collections.length + 1,
      ...newCollection,
      plaques: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: newCollection.isPublic || false,
      is_favorite: false
    } as Collection;
    
    setCollections([createdCollection, ...collections]);
    setCreateModalOpen(false);
    
    toast.success("Collection Created", {
      description: `"${newCollection.name}" has been created`,
    });
  };
  
  const handleBulkDelete = () => {
    if (selectedCollections.length > 0) {
      setDeleteDialogOpen(true);
    }
  };
  
  const confirmBulkDelete = () => {
    setCollections(prev => prev.filter(collection => !selectedCollections.includes(collection.id)));
    
    toast.success("Collections Deleted", {
      description: `${selectedCollections.length} collection${selectedCollections.length === 1 ? '' : 's'} deleted`,
    });
    
    setSelectedCollections([]);
    setDeleteDialogOpen(false);
  };
  
  const resetFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };
  
  const handleFilterChange = (filters: string[]) => {
    setActiveFilters(filters);
  };
  
  // Calculate statistics
  const totalCollections = collections.length;
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques.length, 0);
  const favoritedCollections = collections.filter(c => c.is_favorite).length;
  
  return (
    <PageContainer activePage="collections">
      {/* Header */}
      <CollectionsHeader 
        totalCollections={totalCollections}
        totalPlaques={totalPlaques}
        favoritedCollections={favoritedCollections}
        onCreateCollection={handleCreateCollection}
      />
      
      {/* Dashboard section */}
      <div className="container mx-auto px-4 mb-6">
        <CollectionsDashboard 
          collections={collections}
          onCreateCollection={handleCreateCollection}
          onViewAllFavorites={() => setActiveFilters([...activeFilters, 'Favorites'])}
          onOpenFilters={() => setFilterModalOpen(true)}
        />
      </div>
      
      {/* Collection Controls */}
      <CollectionsFilterBar
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        activeFilters={activeFilters}
        onFilterClick={() => setFilterModalOpen(true)}
        resetFilters={resetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* Collections List */}
      <div className="container mx-auto px-4 py-6">
        {filteredCollections.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No Collections Found"
            description={activeFilters.length > 0 || searchQuery
              ? "Try adjusting your filters or search criteria" 
              : "Start organizing your plaque discoveries by creating your first collection"
            }
            actionLabel={activeFilters.length > 0 || searchQuery ? "Reset Filters" : "Create Your First Collection"}
            onAction={activeFilters.length > 0 || searchQuery ? resetFilters : handleCreateCollection}
          />
        ) : (
          <>
            {viewMode === 'grid' && (
              <CollectionsGrid
                collections={filteredCollections}
                selectedCollections={selectedCollections}
                menuOpenId={menuOpenId}
                onToggleSelect={toggleSelect}
                onMenuOpen={handleMenuOpen}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onShare={handleShare}
                onDelete={handleDelete}
                getUpdatedText={getUpdatedText}
              />
            )}
            
            {viewMode === 'list' && (
              <CollectionsList
                collections={filteredCollections}
                selectedCollections={selectedCollections}
                menuOpenId={menuOpenId}
                onToggleSelect={toggleSelect}
                onMenuOpen={handleMenuOpen}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onShare={handleShare}
                onDelete={handleDelete}
                getUpdatedText={getUpdatedText}
              />
            )}
          </>
        )}
      </div>
      
      {/* Collection Creator Modal */}
      <CollectionCreator
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleSaveCollection}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collections</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCollections.length} collection{selectedCollections.length === 1 ? '' : 's'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Action Bar (appears when collections are selected) */}
      {selectedCollections.length > 0 && (
        <ActionBar
          title={selectedCollections.length === 1 ? "Collection Selected" : "Collections Selected"}
          count={selectedCollections.length}
          onClearSelection={() => setSelectedCollections([])}
          buttons={[
            {
              label: "Delete",
              variant: "destructive",
              onClick: handleBulkDelete
            }
          ]}
        />
      )}
    </PageContainer>
  );
};

export default Collections;