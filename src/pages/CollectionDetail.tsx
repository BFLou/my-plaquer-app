// src/pages/CollectionDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Pencil, MoreHorizontal, 
  Plus, Search, X, Check, Trash2, Copy, 
  Clock, MapPin, Filter
} from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Collection Components
import { CollectionForm } from '@/components/collections/CollectionForm';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { PlaqueListItem } from '@/components/plaques/PlaqueListItem';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { EmptyState } from '@/components/common/EmptyState';
import { ViewToggle } from '@/components/common/ViewToggle';
import { ActionBar } from '@/components/common/ActionBar';
import { Plaque } from '@/types/plaque';
import { formatTimeAgo } from '@/utils/collectionStatsUtils';

// Firebase Hooks
import { useCollections } from '../hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { toast } from 'sonner';
import AddPlaquesModal from '@/components/collections/AddPlaquesModal';

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Firebase hooks
  const { 
    getCollection, 
    updateCollection, 
    deleteCollection, 
    toggleFavorite,
    duplicateCollection,
    addPlaquesToCollection,
    removePlaquesFromCollection 
  } = useCollections();
  
  const { visits: userVisits, isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  
  // State
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionPlaques, setCollectionPlaques] = useState<Plaque[]>([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_added');
  const [selectedPlaques, setSelectedPlaques] = useState<number[]>([]);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [removePlaquesOpen, setRemovePlaquesOpen] = useState(false);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedAvailablePlaques, setSelectedAvailablePlaques] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addPlaquesModalOpen, setAddPlaquesModalOpen] = useState(false);
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]);
  const [availablePlaques, setAvailablePlaques] = useState<Plaque[]>([]);
  const [loadingPlaques, setLoadingPlaques] = useState(false);

  // Define fetchCollection function
  const fetchCollection = async () => {
    if (!id) {
      navigate('/collections');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCollection = await getCollection(id);
      if (!fetchedCollection) {
        throw new Error('Collection not found');
      }
      
      setCollection(fetchedCollection);
      setEditNameValue(fetchedCollection.name);
      
      // Get plaques for this collection
      const plaqueIds = fetchedCollection.plaques || [];
      
      // This is a placeholder - in a real app, you'd fetch the plaques data
      // For demo purposes, we're creating empty arrays
      // In your real implementation, you would fetch plaques from Firebase
      const plaques: Plaque[] = [];
      const allPlaquesData: Plaque[] = [];
      
      setCollectionPlaques(plaques);
      setAllPlaques(allPlaquesData);
      
      // Get available plaques (ones not in this collection)
      const available = allPlaquesData.filter(plaque => !plaqueIds.includes(plaque.id));
      setAvailablePlaques(available);
      
      // Set initial favorites based on visited plaques
      const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
      setFavorites(visitedPlaqueIds);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message || 'Failed to load collection');
      setLoading(false);
      toast.error('Failed to load collection');
    }
  };

  // Load collection data from Firebase - SINGLE useEffect
  useEffect(() => {
    fetchCollection();
  }, [id, getCollection, navigate, userVisits]);
  
  // Get all unique tags from plaques
  const getAllTags = () => {
    const tags = ['all', ...new Set(collectionPlaques
      .filter(plaque => plaque.profession)
      .map(plaque => plaque.profession as string)
    )];
    return tags;
  };
  
  const allTags = getAllTags();
  
  // Filter plaques based on search query and active tag
  const getFilteredPlaques = () => {
    return collectionPlaques
      .filter(plaque => {
        // Match search query
        const matchesSearch = searchQuery === '' || 
          plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (plaque.inscription && plaque.inscription.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Match active tag
        const matchesTag = activeTag === 'all' || 
          (plaque.profession && plaque.profession === activeTag);
        
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        // Sort based on selected option
        if (sortOption === 'recently_added') return b.id - a.id; // Using ID as proxy for order added
        if (sortOption === 'oldest_first') return a.id - b.id;
        if (sortOption === 'a_to_z') return a.title.localeCompare(b.title);
        if (sortOption === 'z_to_a') return b.title.localeCompare(a.title);
        return 0;
      });
  };
  
  const filteredPlaques = getFilteredPlaques();
  
  // Toggle select plaque
  const toggleSelectPlaque = (id: number) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Toggle selection of available plaques
  const toggleSelectAvailablePlaque = (id: number) => {
    setSelectedAvailablePlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Select all available plaques
  const selectAllAvailablePlaques = () => {
    if (selectedAvailablePlaques.length === availablePlaques.length) {
      setSelectedAvailablePlaques([]);
    } else {
      setSelectedAvailablePlaques(availablePlaques.map(p => p.id));
    }
  };
  
  // Back to collections
  const handleBackToCollections = () => {
    navigate('/collections');
  };
  
  // Edit collection name
  const handleEditName = () => {
    setEditNameMode(true);
  };
  
  // Save edited name
  const handleSaveName = async () => {
    if (!collection || !editNameValue.trim() || editNameValue === collection.name) {
      setEditNameMode(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      await updateCollection(collection.id, {
        name: editNameValue
      });
      
      setCollection(prev => ({
        ...prev,
        name: editNameValue
      }));
      
      setEditNameMode(false);
      toast.success('Collection name updated');
    } catch (err) {
      console.error('Error updating collection name:', err);
      toast.error('Failed to update collection name');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditNameValue(collection?.name || '');
    setEditNameMode(false);
  };
  
  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      await toggleFavorite(collection.id);
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        is_favorite: !prev.is_favorite
      }));
      
      toast.success(collection.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Failed to update favorite status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // View plaque details
  const handleViewPlaque = (plaque: Plaque) => {
    setSelectedPlaque(plaque);
  };
  
  // Toggle favorite for a plaque
  const handleTogglePlaqueFavorite = (plaqueId: number) => {
    setFavorites(prev => 
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
  };
  
  // Mark plaque as visited
  const handleMarkVisited = async (plaqueId: number) => {
    try {
      await markAsVisited(plaqueId, {});
      
      // Update local state
      setCollectionPlaques(prev => prev.map(plaque => 
        plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
      ));
      
      toast.success('Plaque marked as visited');
    } catch (err) {
      console.error('Error marking as visited:', err);
      toast.error('Failed to mark as visited');
    }
  };
  
  // Handle edit with form
  const handleEditCollection = async (data: any) => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      await updateCollection(collection.id, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        tags: data.tags
      });
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        tags: data.tags
      }));
      
      setEditFormOpen(false);
      toast.success('Collection updated successfully');
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch available plaques
  const fetchAvailablePlaques = async () => {
    setLoadingPlaques(true);
    
    try {
      // In a real app, you would fetch from Firebase or your API
      // For now, we'll simulate with a timeout and use plaques from allPlaques
      // that aren't already in the collection
      
      // You would replace this with your actual API call:
      // const response = await fetch('/api/plaques');
      // const data = await response.json();
      
      // For demo, we'll simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get current collection plaques to filter out
      const collectionPlaqueIds = collection.plaques || [];
      
      // Filter all plaques to get available ones
      const available = allPlaques.filter(
        plaque => !collectionPlaqueIds.includes(plaque.id)
      );
      
      setAvailablePlaques(available);
    } catch (error) {
      console.error('Error fetching available plaques:', error);
      toast.error('Failed to load available plaques');
    } finally {
      setLoadingPlaques(false);
    }
  };
  
  // Modify the add plaques handler
  const handleAddPlaquesToCollection = async (plaqueIds: number[]) => {
    if (!collection) return;
    
    try {
      await addPlaquesToCollection(collection.id, plaqueIds);
      
      // Get plaques to add from available plaques
      const plaquesToAdd = availablePlaques.filter(p => plaqueIds.includes(p.id));
      
      // Update collection plaques in local state
      setCollectionPlaques(prev => [...prev, ...plaquesToAdd]);
      
      // Remove added plaques from available plaques
      setAvailablePlaques(prev => prev.filter(p => !plaqueIds.includes(p.id)));
      
      toast.success(`Added ${plaqueIds.length} plaques to collection`);
    } catch (error) {
      console.error('Error adding plaques:', error);
      toast.error('Failed to add plaques to collection');
    }
  };
  
  // Add an effect to fetch available plaques when the modal opens
  useEffect(() => {
    if (addPlaquesModalOpen) {
      fetchAvailablePlaques();
    }
  }, [addPlaquesModalOpen]);
  
  // Update the existing "Add Plaques" button click handler
  const openAddPlaquesModal = () => {
    setAddPlaquesModalOpen(true);
  };
  
  // Add plaques to collection (for the sheet UI)
  const handleAddPlaques = async () => {
    if (!collection || selectedAvailablePlaques.length === 0) return;
    
    try {
      setIsLoading(true);
      
      await addPlaquesToCollection(collection.id, selectedAvailablePlaques);
      
      // Filter plaques to add
      const plaquesToAdd = availablePlaques.filter(p => selectedAvailablePlaques.includes(p.id));
      
      // Update collection plaques
      setCollectionPlaques(prev => [...prev, ...plaquesToAdd]);
      
      // Update available plaques
      setAvailablePlaques(prev => prev.filter(p => !selectedAvailablePlaques.includes(p.id)));
      
      // Reset selection
      setSelectedAvailablePlaques([]);
      setAddPlaquesOpen(false);
      
      toast.success(`${selectedAvailablePlaques.length} plaques added to collection`);
    } catch (err) {
      console.error('Error adding plaques:', err);
      toast.error('Failed to add plaques to collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove plaques from collection
  const handleRemovePlaques = async () => {
    if (!collection || selectedPlaques.length === 0) return;
    
    try {
      setIsLoading(true);
      
      await removePlaquesFromCollection(collection.id, selectedPlaques);
      
      // Get plaques being removed
      const plaquesToRemove = collectionPlaques.filter(p => selectedPlaques.includes(p.id));
      
      // Update collection plaques
      setCollectionPlaques(prev => prev.filter(p => !selectedPlaques.includes(p.id)));
      
      // Update available plaques
      setAvailablePlaques(prev => [...prev, ...plaquesToRemove]);
      
      // Reset selection
      setSelectedPlaques([]);
      setRemovePlaquesOpen(false);
      
      toast.success(`${selectedPlaques.length} plaques removed from collection`);
    } catch (err) {
      console.error('Error removing plaques:', err);
      toast.error('Failed to remove plaques from collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Duplicate this collection
  const handleDuplicateCollection = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      const duplicated = await duplicateCollection(collection.id);
      
      toast.success('Collection duplicated successfully');
      
      // Navigate to the new collection
      navigate(`/collections/${duplicated.id}`);
    } catch (err) {
      console.error('Error duplicating collection:', err);
      toast.error('Failed to duplicate collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete this collection
  const handleDeleteCollection = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      await deleteCollection(collection.id);
      
      toast.success('Collection deleted successfully');
      setConfirmDeleteOpen(false);
      navigate('/collections');
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return collectionPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      ((p.profession && currentPlaque.profession && p.profession === currentPlaque.profession) || 
       (p.color && currentPlaque.color && p.color === currentPlaque.color))
    ).slice(0, 3);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-500">Loading collection...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBackToCollections} className="h-8 w-8 p-0">
              <ArrowLeft size={18} />
            </Button>
            <a className="text-gray-500 hover:text-blue-600 text-sm cursor-pointer" onClick={handleBackToCollections}>
              Collections
            </a>
            <span className="text-gray-400">/</span>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 font-medium mb-2">Error Loading Collection</h3>
            <p className="text-red-500 mb-4">{error || 'Collection not found'}</p>
            <Button variant="outline" onClick={handleBackToCollections}>
              Back to Collections
            </Button>
          </div>
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
            <Button variant="ghost" size="sm" onClick={handleBackToCollections} className="h-8 w-8 p-0">
              <ArrowLeft size={18} />
            </Button>
            <a className="text-gray-500 hover:text-blue-600 text-sm cursor-pointer" onClick={handleBackToCollections}>
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
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 p-0 text-green-600"
                    disabled={isLoading}
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 p-0 text-red-600"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "fill-amber-500" : ""}`} 
                />
                {collection.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={isLoading}>
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditFormOpen(true)}>
                    <Pencil size={16} className="mr-2" /> Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicateCollection}>
                    <Copy size={16} className="mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDeleteOpen(true)}>
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
              {collectionPlaques.length} plaques
            </Badge>
            {collection.is_favorite && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star size={12} className="mr-1 fill-amber-500" /> Favorite
              </Badge>
            )}
            {collection.tags && collection.tags.map((tag: string) => (
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
          plaques={collectionPlaques} 
          userVisits={userVisits}
          className="mb-6" 
        />
        
        {/* Search and controls bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <div className="relative w-full md:w-auto md:min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
                <Input
                  placeholder="Search in this collection..."
                  className="pl-9 pr-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {allTags.length > 1 && (
                <Tabs defaultValue={activeTag} onValueChange={setActiveTag} className="w-full md:w-auto">
                  <TabsList className="overflow-auto">
                    {allTags.map(tag => (
                      <TabsTrigger 
                        key={tag} 
                        value={tag}
                        className="capitalize"
                      >
                        {tag}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
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
                  <SelectItem value="recently_added">Recently Added</SelectItem>
                  <SelectItem value="oldest_first">Oldest First</SelectItem>
                  <SelectItem value="a_to_z">A to Z</SelectItem>
                  <SelectItem value="z_to_a">Z to A</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={openAddPlaquesModal} disabled={isLoading}>
                <Plus size={16} className="mr-2" /> Add Plaques
              </Button>
            </div>
          </div>
        </div>
        
        {/* Collection Content */}
        {collectionPlaques.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Plaques Yet"
            description="Start building your collection by adding plaques"
            actionLabel="Add Your First Plaque"
            onAction={openAddPlaquesModal}
          />
        ) : filteredPlaques.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Search className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Results Found</h3>
            <p className="text-gray-500 mb-4">No plaques match your search criteria</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setActiveTag('all');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPlaques.map((plaque) => (
                  <PlaqueCard 
                    key={plaque.id}
                    plaque={plaque}
                    isFavorite={favorites.includes(plaque.id)}
                    isSelected={selectedPlaques.includes(plaque.id)}
                    onSelect={toggleSelectPlaque}
                    onFavoriteToggle={() => handleTogglePlaqueFavorite(plaque.id)}
                    onClick={handleViewPlaque}
                  />
                ))}
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredPlaques.map((plaque) => (
                  <PlaqueListItem
                  key={plaque.id}
                    plaque={plaque}
                    isFavorite={favorites.includes(plaque.id)}
                    isSelected={selectedPlaques.includes(plaque.id)}
                    onSelect={toggleSelectPlaque}
                    onFavoriteToggle={() => handleTogglePlaqueFavorite(plaque.id)}
                    onClick={handleViewPlaque}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Action bar (visible when plaques are selected) */}
      {selectedPlaques.length > 0 && (
        <ActionBar
          title={selectedPlaques.length === 1 ? "plaque selected" : "plaques selected"}
          count={selectedPlaques.length}
          buttons={[
            {
              label: "Mark Visited",
              icon: <Check size={16} />,
              onClick: () => {
                // Mark all selected as visited
                for (const id of selectedPlaques) {
                  handleMarkVisited(id);
                }
                setSelectedPlaques([]);
              },
              disabled: isLoading
            },
            {
              label: "Remove",
              variant: "destructive",
              icon: <Trash2 size={16} />,
              onClick: () => setRemovePlaquesOpen(true),
              disabled: isLoading
            }
          ]}
          onClearSelection={() => setSelectedPlaques([])}
        />
      )}
      
      {/* Plaque detail sheet */}
      <PlaqueDetail
        plaque={selectedPlaque}
        isOpen={!!selectedPlaque}
        onClose={() => setSelectedPlaque(null)}
        onFavoriteToggle={() => selectedPlaque && handleTogglePlaqueFavorite(selectedPlaque.id)}
        isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
        onMarkVisited={() => selectedPlaque && handleMarkVisited(selectedPlaque.id)}
        nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
      />
      
      {/* Edit collection form */}
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
              tags: collection.tags || []
            }}
            onSubmit={handleEditCollection}
            submitLabel="Save Changes"
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add plaques modal */}
      <AddPlaquesModal
        isOpen={addPlaquesModalOpen}
        onClose={() => setAddPlaquesModalOpen(false)}
        onAddPlaques={handleAddPlaquesToCollection}
        availablePlaques={availablePlaques}
        isLoading={loadingPlaques}
      />
      
      {/* Old Add plaques sheet - you can keep this or remove it */}
      <Sheet open={addPlaquesOpen} onOpenChange={setAddPlaquesOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Plaques</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={selectAllAvailablePlaques}
                disabled={availablePlaques.length === 0 || isLoading}
              >
                {selectedAvailablePlaques.length === availablePlaques.length && availablePlaques.length > 0
                  ? "Unselect All"
                  : "Select All"}
              </Button>
              
              {selectedAvailablePlaques.length > 0 && (
                <Badge variant="secondary">
                  {selectedAvailablePlaques.length} selected
                </Badge>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Search available plaques..." 
                className="pl-9" 
              />
            </div>
            
            <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto">
              {availablePlaques.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No more plaques available to add</p>
                </div>
              ) : (
                availablePlaques.map(plaque => (
                  <div 
                    key={plaque.id}
                    className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                      selectedAvailablePlaques.includes(plaque.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => toggleSelectAvailablePlaque(plaque.id)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100">
                      {plaque.image ? (
                        <img src={plaque.image} alt={plaque.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                          <MapPin size={16} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <h4 className="font-medium">{plaque.title}</h4>
                      <p className="text-sm text-gray-500">{plaque.location}</p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedAvailablePlaques.includes(plaque.id)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAvailablePlaques.includes(plaque.id) && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <SheetFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAvailablePlaques([]);
                setAddPlaquesOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              disabled={selectedAvailablePlaques.length === 0 || isLoading}
              onClick={handleAddPlaques}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Adding...
                </>
              ) : `Add ${selectedAvailablePlaques.length} Plaques`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Remove plaques confirmation */}
      <Dialog open={removePlaquesOpen} onOpenChange={setRemovePlaquesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Plaques</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedPlaques.length} {selectedPlaques.length === 1 ? 'plaque' : 'plaques'} from this collection?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setRemovePlaquesOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemovePlaques}
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
      
      {/* Delete collection confirmation */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{collection.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCollection}
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
    </div>
  );
};

export default CollectionDetailPage;