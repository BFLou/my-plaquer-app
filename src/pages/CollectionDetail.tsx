// src/pages/CollectionDetail.tsx (Updated)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash, Share2, Star, CheckCircle, 
  MapPin, Plus, Clock, User, Eye, EyeOff, PenLine,
  X, MoreHorizontal, Search, Download, MapIcon
} from 'lucide-react';
import {
  PageContainer,
  PlaqueCard,
  PlaqueListItem,
  PlaqueDetail,
  CollectionStats,
  ViewToggle,
  EmptyState,
  ActionBar,
  type Plaque,
  type ViewMode
} from '@/components';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { toast } from 'sonner';
import { useUser } from '../contexts/UserContext';

// Sample data for plaques - will be replaced with real data from API
const PLAQUES: Plaque[] = [
  { 
    id: 1, 
    title: "Charles Dickens", 
    location: "48 Doughty Street, Camden", 
    postcode: "WC1N",
    color: "blue",
    profession: "Author",
    description: "The famous author lived here from 1837 to 1839, where he wrote Oliver Twist and Nicholas Nickleby.",
    visited: true,
    image: "/api/placeholder/400/300",
    added: "3 months ago"
  },
  { 
    id: 2, 
    title: "Florence Nightingale", 
    location: "10 South Street, Westminster", 
    postcode: "W1K",
    color: "blue",
    profession: "Nurse",
    description: "The pioneering nurse lived here from 1865 until her death in 1910.",
    visited: false,
    image: "/api/placeholder/400/300",
    added: "2 months ago"
  },
  { 
    id: 3, 
    title: "Jimi Hendrix", 
    location: "23 Brook Street, Mayfair", 
    postcode: "W1K",
    color: "blue",
    profession: "Musician",
    description: "The legendary guitarist lived here in 1968-69, next door to Handel's former home.",
    visited: false,
    image: "/api/placeholder/400/300",
    added: "1 month ago"
  }
];

// Additional available plaques for demo
const ADDITIONAL_PLAQUES: Plaque[] = [
  { 
    id: 6, 
    title: "Ada Lovelace", 
    location: "St. James's Square, Westminster", 
    postcode: "W1",
    color: "blue",
    profession: "Mathematician",
    description: "The world's first computer programmer lived here.",
    visited: false,
    image: "/api/placeholder/400/300",
    added: "1 month ago"
  },
  { 
    id: 7, 
    title: "Emmeline Pankhurst", 
    location: "50 Clarendon Road, Holland Park", 
    postcode: "W11",
    color: "blue",
    profession: "Activist",
    description: "The suffragette leader lived here until 1928.",
    visited: false,
    image: "/api/placeholder/400/300",
    added: "2 months ago"
  }
];

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get user data from context
  const { collections, visitedPlaques, isVisited, markVisited, favorites, toggleFavorite } = useUser();
  
  // Convert id to number
  const collectionId = parseInt(id || '1');
  
  // State
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState('recently_added');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaques, setSelectedPlaques] = useState<number[]>([]);
  const [addPlaquesOpen, setAddPlaquesOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [collectionPlaques, setCollectionPlaques] = useState<Plaque[]>([]);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  
  // Simulating fetching data from API - in real app, replace with API call
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find collection from user data
        const foundCollection = collections.find(c => c.id === collectionId);
        
        if (foundCollection) {
          setCollection(foundCollection);
          setEditNameValue(foundCollection.name);
          
          // For demo purposes, we'll use plaques from our constant data
          // In a real app, you would fetch the plaques by IDs from the API
          const collectionPlaquesData = foundCollection.plaques.map(plaqueId => {
            const plaque = PLAQUES.find(p => p.id === plaqueId);
            if (plaque) {
              // Update visited status based on user data
              return {
                ...plaque,
                visited: isVisited(plaqueId),
                isFavorite: favorites.includes(plaqueId)
              };
            }
            return null;
          }).filter(Boolean);
          
          setCollectionPlaques(collectionPlaquesData);
        } else {
          // Collection not found
          toast.error("The collection you are looking for does not exist.");
          navigate('/collections');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching collection:', error);
        setLoading(false);
        toast.error("Failed to load collection data.");
      }
    };
    
    fetchData();
  }, [collectionId, collections, navigate, isVisited, favorites]);
  
  // Methods
  const toggleSelectPlaque = (id: number) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleBackToCollections = () => {
    navigate('/collections');
  };
  
  const handleAddPlaques = () => {
    setAddPlaquesOpen(true);
  };
  
  const handleAddPlaquesToCollection = (plaqueIds: number[]) => {
    // In a real app, this would make an API call to add the plaques
    const plaquesAdded = plaqueIds.map(id => 
      ADDITIONAL_PLAQUES.find(p => p.id === id)
    ).filter(Boolean) as Plaque[];
    
    setCollectionPlaques(prev => [...prev, ...plaquesAdded]);
    
    if (collection) {
      // Update collection to include the new plaque IDs
      const updatedPlaquesArray = [...collection.plaques, ...plaqueIds];
      setCollection({
        ...collection,
        plaques: updatedPlaquesArray
      });
    }
    
    toast.success(`${plaquesAdded.length} plaques added to collection`);
  };
  
  const handleRemovePlaques = () => {
    if (selectedPlaques.length > 0) {
      setRemoveConfirmOpen(true);
    }
  };
  
  const confirmRemovePlaques = () => {
    // Remove selected plaques from the collection
    setCollectionPlaques(prev => prev.filter(plaque => !selectedPlaques.includes(plaque.id)));
    
    if (collection) {
      // Update the collection's plaques array
      const updatedPlaquesArray = collection.plaques.filter(
        (id: number) => !selectedPlaques.includes(id)
      );
      
      setCollection({
        ...collection,
        plaques: updatedPlaquesArray
      });
    }
    
    setSelectedPlaques([]);
    setRemoveConfirmOpen(false);
    
    toast.success("The selected plaques have been removed from this collection");
  };
  
  const handleMarkVisited = () => {
    // Mark selected plaques as visited
    selectedPlaques.forEach(id => {
      markVisited(id);
    });
    
    // Update local state
    setCollectionPlaques(prev => prev.map(plaque => 
      selectedPlaques.includes(plaque.id) ? { ...plaque, visited: true } : plaque
    ));
    
    setSelectedPlaques([]);
    
    toast.success("The selected plaques have been marked as visited");
  };
  
  const handleMovePlaques = () => {
    // In a real app, this would open a dialog to select which collection to move to
    toast.info("This would open a collection selector in a real app");
  };
  
  const handleEditName = () => {
    setIsEditingName(true);
    setEditNameValue(collection?.name || '');
  };
  
  const saveEdit = () => {
    if (editNameValue.trim() && collection) {
      setCollection({ ...collection, name: editNameValue });
      setIsEditingName(false);
      
      toast.success("The collection name has been updated");
    }
  };
  
  const cancelEdit = () => {
    setIsEditingName(false);
    setEditNameValue(collection?.name || '');
  };
  
  const handlePlaqueClick = (plaque: Plaque) => {
    setSelectedPlaque(plaque);
  };
  
  const handleToggleFavorite = (plaqueId: number) => {
    // Toggle favorite status in the context
    toggleFavorite(plaqueId);
    
    // Update local state
    setCollectionPlaques(prev => 
      prev.map(plaque => 
        plaque.id === plaqueId 
          ? { ...plaque, isFavorite: !favorites.includes(plaqueId) } 
          : plaque
      )
    );
    
    toast.success(favorites.includes(plaqueId) 
      ? "Removed from favorites" 
      : "Added to favorites"
    );
  };
  
  const handlePlaqueVisit = (plaqueId: number) => {
    // Mark plaque as visited in context
    markVisited(plaqueId);
    
    // Update local state
    setCollectionPlaques(prev => prev.map(plaque => 
      plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
    ));
    
    toast.success("This plaque has been marked as visited");
  };
  
  // Sort plaques based on the selected option
  const sortedPlaques = [...collectionPlaques].sort((a, b) => {
    if (sortOption === 'recently_added') return -1; // Assuming the array is already in recently added order
    if (sortOption === 'oldest_first') return 1;
    if (sortOption === 'a_to_z') return a.title.localeCompare(b.title);
    if (sortOption === 'z_to_a') return b.title.localeCompare(a.title);
    return 0;
  }).filter(plaque => 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plaque.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (currentPlaque: Plaque) => {
    return collectionPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };
  
  // Format updated text
  const getUpdatedText = (timestamp: string) => {
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
  
  // If still loading, show a loading state
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
  
  if (!collection) {
    return (
      <PageContainer>
        <EmptyState 
          icon={MapPin}
          title="Collection Not Found"
          description="This collection doesn't exist or has been deleted."
          actionLabel="Back to Collections"
          onAction={() => navigate('/collections')}
        />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer activePage="collections">
      <main className="container mx-auto px-4 py-8">
        {/* Collection Header */}
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
              
              {isEditingName ? (
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
                    onClick={saveEdit} 
                    className="h-8 w-8 text-green-600"
                  >
                    <CheckCircle size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={cancelEdit} 
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
                    <PenLine size={16} />
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
                  <DropdownMenuLabel>Share Collection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User size={16} className="mr-2" /> Share with friends
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download size={16} className="mr-2" /> Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Eye size={16} className="mr-2" /> Make Public
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <EyeOff size={16} className="mr-2" /> Make Private
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
                  <DropdownMenuItem>
                    <Edit size={16} className="mr-2" /> Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star size={16} className="mr-2" className={collection.is_favorite ? "text-amber-500 fill-amber-500" : ""} /> 
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
              <Clock size={12} /> Updated {getUpdatedText(collection.updated_at)}
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
            updated: getUpdatedText(collection.updated_at)
          }} 
          plaques={collectionPlaques} 
          className="mb-6" 
        />
        
        {/* Collection Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search in this collection..."
                  className="pl-9 max-w-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <ViewToggle 
                viewMode={viewMode} 
                onChange={setViewMode}
                variant="buttons"
              />
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently_added">Recently Added</SelectItem>
                  <SelectItem value="oldest_first">Oldest First</SelectItem>
                  <SelectItem value="a_to_z">A to Z</SelectItem>
                  <SelectItem value="z_to_a">Z to A</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleAddPlaques} className="flex items-center gap-1">
                <Plus size={16} /> Add Plaques
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
            onAction={handleAddPlaques}
          />
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedPlaques.map((plaque) => (
                  <PlaqueCard 
                    key={plaque.id}
                    plaque={plaque}
                    isSelected={selectedPlaques.includes(plaque.id)}
                    onSelect={toggleSelectPlaque}
                    onClick={handlePlaqueClick}
                    isFavorite={favorites.includes(plaque.id)}
                    onFavoriteToggle={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="space-y-3">
                {sortedPlaques.map((plaque) => (
                  <PlaqueListItem 
                    key={plaque.id}
                    plaque={plaque}
                    isSelected={selectedPlaques.includes(plaque.id)}
                    onSelect={toggleSelectPlaque}
                    onClick={handlePlaqueClick}
                    isFavorite={favorites.includes(plaque.id)}
                    onFavoriteToggle={handleToggleFavorite}
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
      
      {/* Selection Action Bar */}
      <ActionBar
        title={selectedPlaques.length === 1 ? "Plaque Selected" : "Plaques Selected"}
        count={selectedPlaques.length}
        onClearSelection={() => setSelectedPlaques([])}
        buttons={[
          {
            label: "Mark Visited",
            onClick: handleMarkVisited
          },
          {
            label: "Move To",
            onClick: handleMovePlaques
          },
          {
            label: "Remove",
            variant: "destructive",
            icon: <Trash size={16} />,
            onClick: handleRemovePlaques
          }
        ]}
      />
      
      {/* Plaque Detail */}
      <PlaqueDetail
        plaque={selectedPlaque}
        isOpen={!!selectedPlaque}
        onClose={() => setSelectedPlaque(null)}
        onMarkVisited={handlePlaqueVisit}
        isFavorite={selectedPlaque ? favorites.includes(selectedPlaque.id) : false}
        onFavoriteToggle={handleToggleFavorite}
        nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
        onSelectNearbyPlaque={handlePlaqueClick}
      />
      
      {/* Add Plaques Sheet */}
      <Sheet open={addPlaquesOpen} onOpenChange={setAddPlaquesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Plaques to Collection</SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search plaques..."
                className="pl-9"
              />
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {ADDITIONAL_PLAQUES.map(plaque => (
                <div 
                  key={plaque.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    handleAddPlaquesToCollection([plaque.id]);
                    setAddPlaquesOpen(false);
                  }}
                >
                  <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                    <img src={plaque.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium truncate">{plaque.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
                  </div>
                  <Checkbox />
                </div>
              ))}
            </div>
          </div>
          
          <SheetFooter>
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-600">
                {ADDITIONAL_PLAQUES.length} plaque{ADDITIONAL_PLAQUES.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddPlaquesOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleAddPlaquesToCollection(ADDITIONAL_PLAQUES.map(p => p.id));
                  setAddPlaquesOpen(false);
                }}>
                  Add All
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Confirmation Modal for removing plaques */}
      <Sheet open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Remove Plaques</SheetTitle>
          </SheetHeader>
          
          <div className="py-6">
            <p className="mb-4">
              Are you sure you want to remove {selectedPlaques.length} plaque{selectedPlaques.length !== 1 ? 's' : ''} from this collection? 
              This action won't delete the plaques from the system, only from this collection.
            </p>
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemovePlaques}>
              Remove
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

export default CollectionDetail;