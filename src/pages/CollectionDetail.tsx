import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Pencil, Share2, MoreHorizontal, 
  Plus, Search, LayoutGrid, List, MapPin, Filter,
  Clock, Eye, Trash2, Copy, X, Check, User, Heart
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
import { CollectionForm } from '@/components/collections/CollectionForm';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { PlaqueListItem } from '@/components/plaques/PlaqueListItem';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { EmptyState } from '@/components/common/EmptyState';
import { ViewToggle } from '@/components/common/ViewToggle';
import { ActionBar } from '@/components/common/ActionBar';
import { formatTimeAgo } from '../utils/collectionStatsUtils';

// Data
import userData from '../data/user_data.json';

// Sample plaques data - this would typically come from an API
// In a real app, we'd fetch all plaques and filter to show only the ones not in the collection
const allPlaques = [
  {
    id: 485,
    title: "Sam Selvon",
    location: "Brixton, London",
    color: "blue",
    profession: "Writer",
    inscription: "Sam Selvon (1923-1994), novelist, lived here 1950-1968.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 1115,
    title: "Voltaire",
    location: "Covent Garden, London",
    color: "blue",
    profession: "Writer",
    inscription: "Voltaire (1694-1778) stayed here during his visits to London.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 1120,
    title: "P.G. Wodehouse",
    location: "Mayfair, London",
    color: "blue",
    profession: "Writer",
    inscription: "P.G. Wodehouse (1881-1975), humorist and creator of Jeeves, lived here.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10011,
    title: "Ealing Studios",
    location: "Ealing, London",
    color: "blue",
    profession: "Film Studio",
    inscription: "The oldest continuously working film studio in the world.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10014,
    title: "A.A. Milne",
    location: "Chelsea, London",
    color: "blue",
    profession: "Writer",
    inscription: "A.A. Milne (1882-1956), creator of Winnie-the-Pooh, lived here.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10007,
    title: "Arthur Haynes",
    location: "Ealing, London",
    color: "blue",
    profession: "Comedian",
    inscription: "Arthur Haynes (1914-1966), comedian, lived here.",
    visited: true,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10090,
    title: "Ada Lovelace",
    location: "Marylebone, London",
    color: "blue",
    profession: "Mathematician",
    inscription: "Ada Lovelace (1815-1852), mathematician and computing pioneer, lived here.",
    visited: false,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10027,
    title: "Literary London",
    location: "Southwark, London",
    color: "blue",
    profession: "Historic Site",
    inscription: "A historic literary landmark in London.",
    visited: false,
    image: "/api/placeholder/400/300"
  },
  {
    id: 10019,
    title: "Literary Icon",
    location: "Westminster, London",
    color: "blue",
    profession: "Writer",
    inscription: "A notable literary figure who made significant contributions.",
    visited: false,
    image: "/api/placeholder/400/300"
  }
];

const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const collectionId = parseInt(id);
  
  // State
  const [allCollections, setAllCollections] = useState(userData.collections || []);
  const [collection, setCollection] = useState(null);
  const [collectionPlaques, setCollectionPlaques] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_added');
  const [selectedPlaques, setSelectedPlaques] = useState([]);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [removePlaquesOpen, setRemovePlaquesOpen] = useState(false);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('all');
  const [favorites, setFavorites] = useState([]); // IDs of favorited plaques
  const [availablePlaques, setAvailablePlaques] = useState([]);
  const [selectedAvailablePlaques, setSelectedAvailablePlaques] = useState([]);
  
  // Load collection data
  useEffect(() => {
    const foundCollection = allCollections.find(c => c.id === collectionId);
    
    if (foundCollection) {
      setCollection(foundCollection);
      setEditNameValue(foundCollection.name);
      
      // Get plaques for this collection
      const plaqueIds = foundCollection.plaques || [];
      const plaques = allPlaques.filter(plaque => plaqueIds.includes(plaque.id));
      setCollectionPlaques(plaques);
      
      // Get available plaques (ones not in this collection)
      const available = allPlaques.filter(plaque => !plaqueIds.includes(plaque.id));
      setAvailablePlaques(available);
      
      // Set initial favorites based on user data - using visits as a proxy for favorites
      const visitedPlaqueIds = userData.visited_plaques.map(visit => visit.plaque_id);
      setFavorites(visitedPlaqueIds);
    } else {
      // Handle collection not found
      navigate('/collections');
    }
  }, [collectionId, allCollections, navigate]);
  
  // Get all unique tags from plaques
  const allTags = ['all', ...new Set(collectionPlaques.flatMap(plaque => 
    plaque.profession ? [plaque.profession] : []
  ))];
  
  // Filter plaques based on search query and active tag
  const filteredPlaques = collectionPlaques
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
  
  // Toggle select plaque
  const toggleSelectPlaque = (id) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Toggle selection of available plaques
  const toggleSelectAvailablePlaque = (id) => {
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
  const handleSaveName = () => {
    if (editNameValue.trim()) {
      const updatedCollection = { ...collection, name: editNameValue };
      setCollection(updatedCollection);
      
      // Update collections list
      setAllCollections(prev => prev.map(c => 
        c.id === collectionId ? updatedCollection : c
      ));
      
      setEditNameMode(false);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditNameValue(collection.name);
    setEditNameMode(false);
  };
  
  // Toggle favorite
  const handleToggleFavorite = () => {
    const updatedCollection = { ...collection, is_favorite: !collection.is_favorite };
    setCollection(updatedCollection);
    
    // Update collections list
    setAllCollections(prev => prev.map(c => 
      c.id === collectionId ? updatedCollection : c
    ));
  };
  
  // Toggle public/private
  const handleTogglePublic = () => {
    const updatedCollection = { ...collection, is_public: !collection.is_public };
    setCollection(updatedCollection);
    
    // Update collections list
    setAllCollections(prev => prev.map(c => 
      c.id === collectionId ? updatedCollection : c
    ));
  };
  
  // View plaque details
  const handleViewPlaque = (plaque) => {
    setSelectedPlaque(plaque);
  };
  
  // Toggle favorite for a plaque
  const handleTogglePlaqueFavorite = (plaqueId) => {
    setFavorites(prev => 
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
  };
  
  // Mark plaque as visited
  const handleMarkVisited = (plaqueId) => {
    setCollectionPlaques(prev => prev.map(plaque => 
      plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
    ));
  };
  
  // Handle edit with form
  const handleEditCollection = (data) => {
    const updatedCollection = {
      ...collection,
      name: data.name,
      description: data.description || '',
      icon: data.icon,
      color: data.color,
      is_public: !!data.isPublic,
      updated_at: new Date().toISOString()
    };
    
    setCollection(updatedCollection);
    
    // Update collections list
    setAllCollections(prev => prev.map(c => 
      c.id === collectionId ? updatedCollection : c
    ));
    
    setEditFormOpen(false);
  };
  
  // Add plaques to collection
  const handleAddPlaques = () => {
    // Add selected available plaques to this collection
    if (selectedAvailablePlaques.length > 0) {
      // Filter plaques to add
      const plaquesToAdd = availablePlaques.filter(p => selectedAvailablePlaques.includes(p.id));
      
      // Update collection plaques
      setCollectionPlaques(prev => [...prev, ...plaquesToAdd]);
      
      // Update available plaques
      setAvailablePlaques(prev => prev.filter(p => !selectedAvailablePlaques.includes(p.id)));
      
      // Update collection in state
      const updatedPlaqueIds = [...collection.plaques, ...selectedAvailablePlaques];
      const updatedCollection = {
        ...collection,
        plaques: updatedPlaqueIds,
        updated_at: new Date().toISOString()
      };
      
      setCollection(updatedCollection);
      
      // Update all collections
      setAllCollections(prev => prev.map(c => 
        c.id === collectionId ? updatedCollection : c
      ));
      
      // Reset selection
      setSelectedAvailablePlaques([]);
      setAddPlaquesOpen(false);
    }
  };
  
  // Remove plaques from collection
  const handleRemovePlaques = () => {
    if (selectedPlaques.length > 0) {
      // Get plaques being removed
      const plaquesToRemove = collectionPlaques.filter(p => selectedPlaques.includes(p.id));
      
      // Update collection plaques
      setCollectionPlaques(prev => prev.filter(p => !selectedPlaques.includes(p.id)));
      
      // Update available plaques
      setAvailablePlaques(prev => [...prev, ...plaquesToRemove]);
      
      // Update collection in state
      const updatedPlaqueIds = collection.plaques.filter(id => !selectedPlaques.includes(id));
      const updatedCollection = {
        ...collection,
        plaques: updatedPlaqueIds,
        updated_at: new Date().toISOString()
      };
      
      setCollection(updatedCollection);
      
      // Update all collections
      setAllCollections(prev => prev.map(c => 
        c.id === collectionId ? updatedCollection : c
      ));
      
      // Reset selection
      setSelectedPlaques([]);
      setRemovePlaquesOpen(false);
    }
  };
  
  // Duplicate this collection
  const handleDuplicateCollection = () => {
    const duplicate = {
      ...collection,
      id: Date.now(),
      name: `${collection.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false
    };
    
    // Add to all collections
    setAllCollections(prev => [duplicate, ...prev]);
    
    // Navigate to the new collection
    navigate(`/collections/${duplicate.id}`);
  };
  
  // Delete this collection
  const handleDeleteCollection = () => {
    setAllCollections(prev => prev.filter(c => c.id !== collectionId));
    setConfirmDeleteOpen(false);
    navigate('/collections');
  };
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque) => {
    return collectionPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      ((p.profession && currentPlaque.profession && p.profession === currentPlaque.profession) || 
       (p.color && currentPlaque.color && p.color === currentPlaque.color))
    ).slice(0, 3);
  };
  
  if (!collection) return <div className="container mx-auto px-4 py-6">Loading collection...</div>;
  
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
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 p-0 text-green-600"
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 p-0 text-red-600"
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 size={16} className="mr-2" /> Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User size={16} className="mr-2" /> Share with friends
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy size={16} className="mr-2" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleTogglePublic}>
                    {collection.is_public ? (
                      <>
                        <Eye size={16} className="mr-2" /> Make Private
                      </>
                    ) : (
                      <>
                        <Eye size={16} className="mr-2" /> Make Public
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant={collection.is_favorite ? "outline" : "ghost"}
                size="sm"
                onClick={handleToggleFavorite}
                className={collection.is_favorite ? "text-amber-500" : ""}
              >
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "fill-amber-500" : ""}`} 
                />
                {collection.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
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
              {collection.plaques.length} plaques
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
          </div>
          
          {collection.description && (
            <p className="text-gray-600 mt-3">{collection.description}</p>
          )}
        </div>
        
        {/* Collection Stats - Now using user_data to calculate statistics */}
        <CollectionStats 
          collection={collection}
          plaques={collectionPlaques} 
          userVisits={userData.visited_plaques}
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
              
              <Button onClick={() => setAddPlaquesOpen(true)}>
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
            onAction={() => setAddPlaquesOpen(true)}
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
                setCollectionPlaques(prev => prev.map(plaque => 
                  selectedPlaques.includes(plaque.id) ? { ...plaque, visited: true } : plaque
                ));
                setSelectedPlaques([]);
              }
            },
            {
              label: "Remove",
              variant: "destructive",
              icon: <Trash2 size={16} />,
              onClick: () => setRemovePlaquesOpen(true)
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
            <DialogDescription>
              Update the details of your collection
            </DialogDescription>
          </DialogHeader>
          
          <CollectionForm
            initialValues={{
              name: collection.name,
              description: collection.description,
              icon: collection.icon,
              color: collection.color,
              isPublic: collection.is_public
            }}
            onSubmit={handleEditCollection}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add plaques sheet */}
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
              >
                {selectedAvailablePlaques.length === availablePlaques.length
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
            >
              Cancel
            </Button>
            <Button 
              disabled={selectedAvailablePlaques.length === 0}
              onClick={handleAddPlaques}
            >
              Add {selectedAvailablePlaques.length} Plaques
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
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemovePlaques}
            >
              Remove
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
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCollection}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionDetailPage;