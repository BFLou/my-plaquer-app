// CollectionDetailPage.jsx - Collection detail view
import React, { useState, useEffect } from 'react';
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
import { SearchableFilterBar } from '@/components/common/SearchableFilterBar';
import { ActionBar } from '@/components/common/ActionBar';

// Sample collection and plaques for demo purposes
const sampleCollection = {
  id: 1,
  name: "Travel Destinations",
  description: "Places I want to visit in 2025",
  icon: "🌴",
  color: "bg-green-500",
  is_favorite: true,
  plaques: 12,
  updated_at: "2024-05-01T14:30:00Z",
  is_public: true
};

const samplePlaques = [
  {
    id: 1,
    title: "Tokyo, Japan",
    location: "Shibuya, Tokyo",
    address: "1-1-1 Shibuya, Tokyo",
    color: "blue",
    profession: "Tourist Destination",
    inscription: "Tokyo, the capital of Japan, is known for its modern and traditional aspects.",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "2022",
    latitude: 35.6762,
    longitude: 139.6503
  },
  {
    id: 2,
    title: "Santorini, Greece",
    location: "Thira, Greece",
    address: "Santorini Island, Greece",
    color: "blue",
    profession: "Tourist Destination",
    inscription: "Famous for its stunning sunsets, white-washed buildings, and blue domes.",
    visited: false,
    image: "/api/placeholder/400/300",
    erected: "2021",
    latitude: 36.3932,
    longitude: 25.4615
  },
  {
    id: 3,
    title: "New Zealand",
    location: "Wellington, New Zealand",
    address: "Wellington, New Zealand",
    color: "green",
    profession: "Tourist Destination",
    inscription: "Known for its stunning landscapes, adventure tourism, and being the filming location for Lord of the Rings.",
    visited: false,
    image: "/api/placeholder/400/300",
    erected: "2023",
    latitude: -41.2924,
    longitude: 174.7787
  },
  {
    id: 4,
    title: "Iceland",
    location: "Reykjavik, Iceland",
    address: "Reykjavik, Iceland",
    color: "blue",
    profession: "Tourist Destination",
    inscription: "Iceland is known for its stunning landscapes including volcanoes, geysers, hot springs, lava fields, and massive glaciers.",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "2021",
    latitude: 64.1466,
    longitude: -21.9426
  },
  {
    id: 5,
    title: "Bali, Indonesia",
    location: "Denpasar, Bali",
    address: "Denpasar, Bali, Indonesia",
    color: "green",
    profession: "Tourist Destination",
    inscription: "Known for its forested volcanic mountains, iconic rice paddies, beaches, and coral reefs.",
    visited: false,
    image: "/api/placeholder/400/300",
    erected: "2022",
    latitude: -8.4095,
    longitude: 115.1889
  }
];

const CollectionDetailPage = () => {
  // State
  const [collection, setCollection] = useState(sampleCollection);
  const [plaques, setPlaques] = useState(samplePlaques);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_added');
  const [selectedPlaques, setSelectedPlaques] = useState([]);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState(sampleCollection.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [removePlaquesOpen, setRemovePlaquesOpen] = useState(false);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('all');
  const [favorites, setFavorites] = useState([1, 4]); // IDs of favorited plaques
  
  // For add plaques sheet
  const [availablePlaques, setAvailablePlaques] = useState([
    {
      id: 6,
      title: "Barcelona, Spain",
      location: "Barcelona, Spain",
      color: "blue",
      image: "/api/placeholder/400/300"
    },
    {
      id: 7,
      title: "Buenos Aires, Argentina",
      location: "Buenos Aires, Argentina",
      color: "green",
      image: "/api/placeholder/400/300"
    }
  ]);
  const [selectedAvailablePlaques, setSelectedAvailablePlaques] = useState([]);
  
  // Get all unique tags from plaques
  const allTags = ['all', ...new Set(plaques.flatMap(plaque => 
    plaque.profession ? [plaque.profession] : []
  ))];
  
  // Filter plaques based on search query and active tag
  const filteredPlaques = plaques
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
  
  // Format updated text
  const formatUpdatedText = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  };
  
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
    console.log("Navigate back to collections");
    // In a real app, use router
    // router.push('/collections');
  };
  
  // Edit collection name
  const handleEditName = () => {
    setEditNameMode(true);
  };
  
  // Save edited name
  const handleSaveName = () => {
    if (editNameValue.trim()) {
      setCollection({ ...collection, name: editNameValue });
      setEditNameMode(false);
      console.log(`Updated collection name to: ${editNameValue}`);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditNameValue(collection.name);
    setEditNameMode(false);
  };
  
  // Toggle favorite
  const handleToggleFavorite = () => {
    setCollection({ ...collection, is_favorite: !collection.is_favorite });
    console.log(`${collection.is_favorite ? 'Removed from' : 'Added to'} favorites`);
  };
  
  // Toggle public/private
  const handleTogglePublic = () => {
    setCollection({ ...collection, is_public: !collection.is_public });
    console.log(`Collection is now ${collection.is_public ? 'private' : 'public'}`);
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
    
    console.log(`${favorites.includes(plaqueId) ? 'Removed from' : 'Added to'} favorites: Plaque ${plaqueId}`);
  };
  
  // Mark plaque as visited
  const handleMarkVisited = (plaqueId) => {
    setPlaques(prev => prev.map(plaque => 
      plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
    ));
    
    console.log(`Marked plaque ${plaqueId} as visited`);
  };
  
  // Add plaques to collection
  const handleAddPlaques = () => {
    // Add selected available plaques to this collection
    if (selectedAvailablePlaques.length > 0) {
      const plaquesToAdd = availablePlaques.filter(p => selectedAvailablePlaques.includes(p.id));
      setPlaques([...plaques, ...plaquesToAdd]);
      setAvailablePlaques(prev => prev.filter(p => !selectedAvailablePlaques.includes(p.id)));
      setSelectedAvailablePlaques([]);
      setAddPlaquesOpen(false);
      
      console.log(`Added ${plaquesToAdd.length} plaques to collection`);
    }
  };
  
  // Remove plaques from collection
  const handleRemovePlaques = () => {
    if (selectedPlaques.length > 0) {
      const plaquesToRemove = plaques.filter(p => selectedPlaques.includes(p.id));
      setPlaques(prev => prev.filter(p => !selectedPlaques.includes(p.id)));
      setAvailablePlaques([...availablePlaques, ...plaquesToRemove]);
      setSelectedPlaques([]);
      setRemovePlaquesOpen(false);
      
      console.log(`Removed ${plaquesToRemove.length} plaques from collection`);
    }
  };
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque) => {
    return plaques.filter(p => 
      p.id !== currentPlaque.id && 
      ((p.profession && currentPlaque.profession && p.profession === currentPlaque.profession) || 
       (p.color && currentPlaque.color && p.color === currentPlaque.color))
    ).slice(0, 3);
  };
  
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
            <a className="text-gray-500 hover:text-blue-600 text-sm cursor-pointer">
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
                  <DropdownMenuItem onClick={handleEditName}>
                    <Pencil size={16} className="mr-2" /> Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
              <Clock size={12} /> Updated {formatUpdatedText(collection.updated_at)}
            </Badge>
            <Badge variant="outline">
              {collection.plaques} plaques
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
        
        {/* Collection Stats */}
        <CollectionStats 
          collection={{
            ...collection,
            plaques: plaques.length,
            updated: formatUpdatedText(collection.updated_at)
          }} 
          plaques={plaques} 
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
        {plaques.length === 0 ? (
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
                setPlaques(prev => prev.map(plaque => 
                  selectedPlaques.includes(plaque.id) ? { ...plaque, visited: true } : plaque
                ));
                setSelectedPlaques([]);
                console.log("Plaques marked as visited");
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
        onMarkVisited={(id) => handleMarkVisited(id)}
        isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
        onFavoriteToggle={(id) => handleTogglePlaqueFavorite(id)}
        nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
        onSelectNearbyPlaque={handleViewPlaque}
      />
      
      {/* Add plaques sheet */}
      <Sheet open={addPlaquesOpen} onOpenChange={setAddPlaquesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Plaques to Collection</SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search plaques..."
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center ml-4">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedAvailablePlaques.length === availablePlaques.length && availablePlaques.length > 0}
                  onChange={selectAllAvailablePlaques}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm">Select All</label>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {availablePlaques.length > 0 ? (
                availablePlaques.map(plaque => (
                  <div 
                    key={plaque.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  >
                    <input 
                      type="checkbox"
                      checked={selectedAvailablePlaques.includes(plaque.id)}
                      onChange={() => toggleSelectAvailablePlaque(plaque.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                      {plaque.image ? (
                        <img src={plaque.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                          <MapPin size={20} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium truncate">{plaque.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
                    </div>
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
                {selectedAvailablePlaques.length} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSelectedAvailablePlaques([]);
                  setAddPlaquesOpen(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPlaques}
                  disabled={selectedAvailablePlaques.length === 0}
                >
                  Add to Collection
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Remove plaques dialog */}
      <Dialog open={removePlaquesOpen} onOpenChange={setRemovePlaquesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Plaques</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedPlaques.length} plaque{selectedPlaques.length !== 1 ? 's' : ''} from this collection?
              This won't delete the plaques from the system.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovePlaquesOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemovePlaques}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete collection dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setConfirmDeleteOpen(false);
              console.log("Collection deleted");
              handleBackToCollections();
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionDetailPage;