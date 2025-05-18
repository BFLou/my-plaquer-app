// src/components/collections/CollectionDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Pencil, Share2, 
  Plus, MapPin, Trash2, Edit,
  Clock, Eye, User, X, Check, 
  Copy
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { PlaqueListItem } from '@/components/plaques/PlaqueListItem';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTimeAgo } from '@/utils/collectionStatsUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollectionForm } from '@/components/collections/CollectionForm';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';


// Import existing components and hooks for plaques as needed

const CollectionDetailContent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getCollection, 
    updateCollection, 
    deleteCollection, 
    toggleFavorite,
    duplicateCollection,
    addPlaquesToCollection,
    removePlaquesFromCollection,
  } = useCollections();
  
  // State
  const [collection, setCollection] = useState(null);
  const [plaques, setPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [selectedPlaques, setSelectedPlaques] = useState([]);
  const [removePlaquesOpen, setRemovePlaquesOpen] = useState(false);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [availablePlaques, setAvailablePlaques] = useState([]);
  const [selectedAvailablePlaques, setSelectedAvailablePlaques] = useState([]);
  
const [confirmRemovePlaqueOpen, setConfirmRemovePlaqueOpen] = useState(false);
const [plaqueToRemove, setPlaqueToRemove] = useState<number | null>(null);

  
  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) {
        setError('Collection ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const collectionData = await getCollection(id);
        
        if (!collectionData) {
          throw new Error('Collection not found');
        }
        
        setCollection(collectionData);
        setEditNameValue(collectionData.name);
        
        // Fetch plaques data
        // This would normally use a separate hook or service
        // For demo, you'd fetch plaques based on collection.plaques array
        // setPlaques(plaquesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to load collection');
        setLoading(false);
        toast.error('Failed to load collection');
      }
    };
    
    fetchCollection();
  }, [id, getCollection]);
  
  // Filter plaques based on search query
  const filteredPlaques = plaques.filter(plaque => 
    !searchQuery || 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Edit collection name
  const handleEditName = () => {
    setEditNameMode(true);
  };
  
  const handleSaveName = async () => {
    if (!editNameValue.trim() || editNameValue === collection.name) {
      setEditNameMode(false);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await updateCollection(id, {
        name: editNameValue.trim()
      });
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        name: editNameValue.trim()
      }));
      
      setEditNameMode(false);
    } catch (err) {
      console.error('Error updating collection name:', err);
      toast.error('Failed to update collection name');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditNameValue(collection?.name || '');
    setEditNameMode(false);
  };
  
  // Open edit collection form
  const handleOpenEditForm = () => {
    setEditFormOpen(true);
  };
  
  // Save edited collection
  const handleUpdateCollection = async (data) => {
    try {
      setIsSubmitting(true);
      
      await updateCollection(id, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        isPublic: data.isPublic,
        tags: data.tags
      });
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        is_public: data.isPublic,
        tags: data.tags
      }));
      
      setEditFormOpen(false);
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePlaqueFromCollection = (plaqueId: number) => {
  setPlaqueToRemove(plaqueId);
  setConfirmRemovePlaqueOpen(true);
};

const confirmRemovePlaque = async () => {
  if (!collection || plaqueToRemove === null) return;
  
  try {
    setIsLoading(true);
    
    // Call Firebase function to remove the plaque
    await removePlaquesFromCollection(collection.id, [plaqueToRemove]);
    
    // Update local state by removing the plaque
    setCollectionPlaques(prev => prev.filter(p => p.id !== plaqueToRemove));
    
    toast.success("Plaque removed from collection");
  } catch (err) {
    console.error('Error removing plaque from collection:', err);
    toast.error('Failed to remove plaque from collection');
  } finally {
    setConfirmRemovePlaqueOpen(false);
    setPlaqueToRemove(null);
    setIsLoading(false);
  }
};

  
  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(id);
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        is_favorite: !prev.is_favorite
      }));
    } catch (err) {
      console.error('Error toggling favorite status:', err);
      toast.error('Failed to update favorite status');
    }
  };
  
  // Delete collection
  const handleDeleteCollection = async () => {
    try {
      setIsSubmitting(true);
      
      await deleteCollection(id);
      
      toast.success('Collection deleted successfully');
      navigate('/collections');
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteOpen(false);
    }
  };
  
  // Duplicate collection
  const handleDuplicateCollection = async () => {
    try {
      setIsSubmitting(true);
      
      const newCollection = await duplicateCollection(id);
      
      toast.success('Collection duplicated successfully');
      
      // Navigate to the new collection
      navigate(`/collections/${newCollection.id}`);
    } catch (err) {
      console.error('Error duplicating collection:', err);
      toast.error('Failed to duplicate collection');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle selection of a plaque
  const toggleSelectPlaque = (plaqueId) => {
    setSelectedPlaques(prev =>
      prev.includes(plaqueId) ? prev.filter(id => id !== plaqueId) : [...prev, plaqueId]
    );
  };
  
  // Handle removing plaques
  const handleRemovePlaques = async () => {
    if (selectedPlaques.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      await removePlaquesFromCollection(id, selectedPlaques);
      
      // Update local state
      setPlaques(prev => prev.filter(plaque => !selectedPlaques.includes(plaque.id)));
      
      // Update collection in state to reflect changes
      setCollection(prev => ({
        ...prev,
        plaques: prev.plaques.filter(plaqueId => !selectedPlaques.includes(plaqueId))
      }));
      
      setSelectedPlaques([]);
      setRemovePlaquesOpen(false);
    } catch (err) {
      console.error('Error removing plaques from collection:', err);
      toast.error('Failed to remove plaques');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle selection of available plaque
  const toggleSelectAvailablePlaque = (plaqueId) => {
    setSelectedAvailablePlaques(prev =>
      prev.includes(plaqueId) ? prev.filter(id => id !== plaqueId) : [...prev, plaqueId]
    );
  };
  
  // Handle adding plaques
  const handleAddPlaques = async () => {
    if (selectedAvailablePlaques.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      await addPlaquesToCollection(id, selectedAvailablePlaques);
      
      // Update collection in state to reflect changes
      setCollection(prev => ({
        ...prev,
        plaques: [...prev.plaques, ...selectedAvailablePlaques]
      }));
      
      // Update plaques data
      // This would normally fetch the updated plaques
      // For demo purposes, you'd update the state
      
      setSelectedAvailablePlaques([]);
      setAddPlaquesOpen(false);
    } catch (err) {
      console.error('Error adding plaques to collection:', err);
      toast.error('Failed to add plaques');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Share collection
  const handleShareCollection = async () => {
    if (!collection) return;
    
    // Get shareable URL
    const shareUrl = `${window.location.origin}/collections/${collection.id}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: `Check out my collection "${collection.name}" on Plaquer!`,
          url: shareUrl
        });
        toast.success('Collection shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing collection:', err);
          // Fallback to copying link
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to copying link
      copyToClipboard(shareUrl);
    }
  };
  
  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };
  
  if (loading) {
    return <div className="p-6 text-center">Loading collection...</div>;
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-lg font-medium text-red-700 mb-1">Error loading collection</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }
  
  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-1">Collection not found</h3>
          <p className="text-gray-600 mb-4">The collection you're looking for doesn't exist</p>
          <Button variant="outline" onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Navigation and header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/collections')} 
              className="h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <a 
              className="text-gray-500 hover:text-blue-600 text-sm cursor-pointer" 
              onClick={() => navigate('/collections')}
            >
              Collections
            </a>
            <span className="text-gray-400">/</span>
          </div>
          
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${collection.color}`}>
                {collection.icon}
              </div>
              
              {editNameMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="text-xl font-bold py-1 h-auto"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 p-0 text-green-600"
                    disabled={isSubmitting}
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 p-0 text-red-600"
                    disabled={isSubmitting}
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{collection.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditName} 
                    className="h-8 w-8 p-0"
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={collection.is_favorite ? "outline" : "ghost"}
                size="sm"
                onClick={handleToggleFavorite}
                className={collection.is_favorite ? "text-amber-500" : ""}
                disabled={isSubmitting}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "fill-amber-500" : ""}`} 
                />
                {collection.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleShareCollection}
                disabled={isSubmitting}
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={isSubmitting}>
                    <Edit size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenEditForm}>
                    <Pencil size={16} className="mr-2" /> Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicateCollection}>
                    <Copy size={16} className="mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2 size={16} className="mr-2" /> Delete Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock size={12} /> Updated {formatTimeAgo(collection.updated_at)}
            </Badge>
            <Badge variant="outline">
              {collection.plaques?.length} plaques
            </Badge>
            {collection.is_public && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Eye size={12} className="mr-1" /> Public
              </Badge>
            )}
            {collection.is_favorite && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star size={12} className="mr-1 fill-amber-500" /> Favorite
              </Badge>
            )}
            {collection.tags?.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          {collection.description && (
            <p className="text-gray-600 mt-3">{collection.description}</p>
          )}
        </div>
        
        {/* Collection Stats */}
        <CollectionStats 
          collection={collection}
          plaques={plaques} 
          userVisits={[]} // This would come from a visits hook
          className="mb-6" 
        />
        
        {/* Main content - plaque list, etc. */}
        {/* This would display your filtered plaques */}
        {filteredPlaques.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Plaques Yet"
            description="Start building your collection by adding plaques"
            actionLabel="Add Your First Plaque"
            onAction={() => setAddPlaquesOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Render PlaqueCard components here */}
            {/* This is just a placeholder */}
            <div className="p-4 border rounded-md">Example plaque would go here</div>
          </div>
        )}
      </div>

      
      
      {/* Edit Collection Dialog */}
      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          
          <CollectionForm
            initialValues={{
              name: collection.name,
              description: collection.description || '',
              icon: collection.icon,
              color: collection.color,
              isPublic: collection.is_public,
              tags: collection.tags || []
            }}
            onSubmit={handleUpdateCollection}
            submitLabel="Save Changes"
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Remove single plaque confirmation */}
<Dialog open={confirmRemovePlaqueOpen} onOpenChange={setConfirmRemovePlaqueOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Remove Plaque</DialogTitle>
      <DialogDescription>
        Are you sure you want to remove this plaque from the collection?
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter className="mt-4">
      <Button 
        variant="outline" 
        onClick={() => {
          setConfirmRemovePlaqueOpen(false);
          setPlaqueToRemove(null);
        }}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button 
        variant="destructive"
        onClick={confirmRemovePlaque}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
            Removing...
          </>
        ) : 'Remove'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{collection.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCollection}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add additional dialogs for adding/removing plaques */}
    </div>
  );
};

export default CollectionDetailContent;