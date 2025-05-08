// src/pages/CollectionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Star, 
  Pencil, 
  Share2, 
  MoreHorizontal, 
  Plus, 
  Search,
  LayoutGrid,
  List,
  MapIcon,
  Check,
  CheckCircle,
  MapPin,
  Filter,
  Clock,
  Eye,
  Trash,
  Copy,
  X,
  User,
  ArrowUpDown
} from 'lucide-react';

// Components
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Plaque related components
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { PlaqueListItem } from '@/components/plaques/PlaqueListItem';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { EmptyState } from '@/components/collections/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';

// Data (in a real app, this would come from a context or API)
import userData from '../data/user_data.json';

// Mock plaque data just for demo purposes
// This would be fetched from API in a real app
const MOCK_PLAQUES = [
  {
    id: 485,
    title: "Sam Selvon",
    location: "Camden, London",
    address: "Newlands Court, Dolphin Road, London",
    postcode: "SE16 5TS",
    color: "blue",
    profession: "Writer",
    inscription: "Sam Selvon 1923-1994 Writer lived here",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "1997",
    latitude: 51.4953,
    longitude: -0.0559
  },
  {
    id: 1115,
    title: "Voltaire",
    location: "Westminster, London",
    address: "10 Maiden Lane, Covent Garden, London",
    postcode: "WC2E 7NA",
    color: "blue",
    profession: "Philosopher",
    inscription: "Voltaire 1694-1778 Writer and philosopher lived here",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "1990",
    latitude: 51.5109,
    longitude: -0.1234
  },
  {
    id: 1120,
    title: "P.G. Wodehouse",
    location: "Mayfair, London",
    address: "17 Norfolk Street, London",
    postcode: "W1Y 8JX",
    color: "blue",
    profession: "Author",
    inscription: "P.G. Wodehouse 1881-1975 Author lived here",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "1988",
    latitude: 51.5092,
    longitude: -0.1531
  },
  {
    id: 10011,
    title: "James Joyce",
    location: "Kensington, London",
    address: "28 Campden Grove, London",
    postcode: "W8 4JQ",
    color: "blue",
    profession: "Writer",
    inscription: "James Joyce 1882-1941 Writer lived here",
    visited: false,
    image: "/api/placeholder/400/300",
    erected: "1969",
    latitude: 51.5061,
    longitude: -0.1970
  },
  {
    id: 10014,
    title: "A.A. Milne",
    location: "Chelsea, London",
    address: "13 Mallord Street, London",
    postcode: "SW3 6AP",
    color: "blue",
    profession: "Author",
    inscription: "A.A. Milne 1882-1956 Author lived here",
    visited: true,
    image: "/api/placeholder/400/300",
    erected: "1979",
    latitude: 51.4897,
    longitude: -0.1646
  }
];

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState(null);
  const [plaques, setPlaques] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_added');
  const [selectedPlaques, setSelectedPlaques] = useState([]);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [removePlaquesOpen, setRemovePlaquesOpen] = useState(false);
  const [availablePlaques, setAvailablePlaques] = useState([]);
  const [selectedAvailablePlaques, setSelectedAvailablePlaques] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  // Fetch collection data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, this would be an API call
        const collectionId = parseInt(id);
        const foundCollection = userData.collections.find(c => c.id === collectionId);
        
        if (foundCollection) {
          setCollection(foundCollection);
          setEditNameValue(foundCollection.name);
          
          // Get initial favorites from user data
          const favoritedPlaques = userData.collections
            .find(c => c.id === 6)?.plaques || [];
          setFavorites(favoritedPlaques);
          
          // Get plaques for this collection
          // In a real app, this would be an API call filtered by collection ID
          const collectionPlaques = MOCK_PLAQUES.filter(p => 
            foundCollection.plaques.includes(p.id)
          );
          setPlaques(collectionPlaques);
          
          // Get available plaques not in this collection
          const otherPlaques = MOCK_PLAQUES.filter(p => 
            !foundCollection.plaques.includes(p.id)
          );
          setAvailablePlaques(otherPlaques);
        } else {
          toast.error("Collection not found");
          navigate('/collections');
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
        toast.error("Error loading collection");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);
  
  // Filter plaques based on search query
  const filteredPlaques = plaques
    .filter(plaque => 
      searchQuery === '' || 
      plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (plaque.inscription && plaque.inscription.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort based on selected option
      if (sortOption === 'recently_added') return -1; // Assuming the array is already in recently added order
      if (sortOption === 'oldest_first') return 1;
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
      setCollection({ ...collection, name: editNameValue });
      setEditNameMode(false);
      toast.success("Collection name updated");
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
    toast.success(collection.is_favorite ? "Removed from favorites" : "Added to favorites");
  };
  
  // Toggle public/private
  const handleTogglePublic = () => {
    setCollection({ ...collection, is_public: !collection.is_public });
    toast.success(collection.is_public ? "Collection is now private" : "Collection is now public");
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
    
    toast.success(favorites.includes(plaqueId) 
      ? "Removed from favorites" 
      : "Added to favorites"
    );
  };
  
  // Mark plaque as visited
  const handleMarkVisited = (plaqueId) => {
    setPlaques(prev => prev.map(plaque => 
      plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
    ));
    
    toast.success("Plaque marked as visited");
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
      
      toast.success(`${plaquesToAdd.length} plaques added to collection`);
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
      
      toast.success(`${plaquesToRemove.length} plaques removed from collection`);
    }
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
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque) => {
    return plaques.filter(p => 
      p.id !== currentPlaque.id && 
      ((p.postcode && currentPlaque.postcode && p.postcode === currentPlaque.postcode) || 
       (p.profession && currentPlaque.profession && p.profession === currentPlaque.profession))
    ).slice(0, 3);
  };
  
  // Show loading UI while fetching data
  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collection...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Show 404 UI if collection not found
  if (!collection) {
    return (
      <PageContainer>
        <EmptyState 
          icon={MapPin}
          title="Collection Not Found"
          description="This collection doesn't exist or has been deleted."
          actionLabel="Back to Collections"
          onAction={handleBackToCollections}
        />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-6">
        {/* Navigation and header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={handleBackToCollections} className="h-8 w-8">
              <ArrowLeft size={18} />
            </Button>
            <a href="/collections" className="text-gray-500 hover:text-blue-600 text-sm">
              Collections
            </a>
            <span className="text-gray-400">/</span>
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl ${collection.color}`}>
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
                    size="icon" 
                    onClick={handleSaveName} 
                    className="h-8 w-8 text-green-600"
                  >
                    <Check size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCancelEdit} 
                    className="h-8 w-8 text-red-600"
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{collection.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleEditName} 
                    className="h-8 w-8"
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditName}>
                    <Pencil size={16} className="mr-2" /> Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Star 
                      size={16} 
                      className={`mr-2 ${collection.is_favorite ? "text-amber-500 fill-amber-500" : ""}`} 
                    /> 
                    {collection.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash size={16} className="mr-2" /> Delete Collection
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
        
        {/* Collection Stats */}
        <CollectionStats 
          collection={{
            ...collection,
            // Convert for component compatibility
            plaques: collection.plaques.length,
            updated: formatUpdatedText(collection.updated_at)
          }} 
          plaques={plaques} 
          className="mb-6" 
        />
        
        {/* Plaque controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full md:w-auto">
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
                  className="pl-9 pr-9 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <div className="flex gap-1 border rounded-md h-9 p-1">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </Button>
                <Button 
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode('map')}
                >
                  <MapIcon size={16} />
                </Button>
              </div>
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently_added">Recently Added</SelectItem>
                  <SelectItem value="oldest_first">Oldest First</SelectItem>
                  <SelectItem value="a_to_z">A to Z</SelectItem>
                  <SelectItem value="z_to_a">Z to A</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setAddPlaquesOpen(true)} className="h-9">
                <Plus size={16} className="mr-2" /> Add Plaques
              </Button>
            </div>
          </div>
        </div>
        
        {/* Collection content */}
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
            <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
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
            
            {viewMode === 'map' && (
              <div className="bg-gray-50 rounded-xl p-8 h-[500px] flex flex-col items-center justify-center text-center">
                <MapIcon size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
                <p className="text-gray-500 mb-4">Visualize your collection's plaques geographically</p>
                <Button variant="outline">Get Notified When Ready</Button>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Action bar (visible when plaques are selected) */}
      {selectedPlaques.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-20">
          <div className="font-medium">
            {selectedPlaques.length} {selectedPlaques.length === 1 ? 'plaque' : 'plaques'}
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          
          <Button variant="ghost" size="sm" onClick={() => setSelectedPlaques([])}>
            Clear
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => {
            // Mark all selected as visited
            setPlaques(prev => prev.map(plaque => 
              selectedPlaques.includes(plaque.id) ? { ...plaque, visited: true } : plaque
            ));
            setSelectedPlaques([]);
            toast.success("Plaques marked as visited");
          }}>
            <CheckCircle size={16} className="mr-2" />
            Mark Visited
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setRemovePlaquesOpen(true)}
          >
            <Trash size={16} className="mr-2" />
            Remove
          </Button>
        </div>
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
                <Checkbox
                  id="select-all"
                  checked={selectedAvailablePlaques.length === availablePlaques.length && availablePlaques.length > 0}
                  onCheckedChange={selectAllAvailablePlaques}
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
                    <Checkbox 
                      checked={selectedAvailablePlaques.includes(plaque.id)}
                      onCheckedChange={() => toggleSelectAvailablePlaque(plaque.id)}
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
    </PageContainer>
  );
};

export default CollectionDetail;