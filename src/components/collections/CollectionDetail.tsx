import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash, Share2, Star, CheckCircle, 
  MapPin, Plus, Clock, User, Eye, EyeOff, PenLine,
  X, MoreHorizontal, Search, Download, MapIcon,
  Grid, List, Filter, SlidersHorizontal, ClipboardEdit
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
  type Collection,
  type ViewMode
} from '@/components';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import MultiSelectFilter  from '../common/MultiSelectFilter';

// Sample data for plaques
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
  },
  { 
    id: 4, 
    title: "Sir Isaac Newton", 
    location: "87 Jermyn Street, St. James's", 
    postcode: "SW1Y",
    color: "blue",
    profession: "Scientist",
    description: "The mathematician and physicist lived here from 1696 to 1700.",
    visited: true,
    image: "/api/placeholder/400/300",
    added: "2 weeks ago"
  },
  { 
    id: 5, 
    title: "George Orwell", 
    location: "27b Canonbury Square, Islington", 
    postcode: "N1",
    color: "green",
    profession: "Author",
    description: "The author of '1984' and 'Animal Farm' lived here from 1944 to 1947.",
    visited: false,
    image: "/api/placeholder/400/300",
    added: "1 week ago"
  }
];

// Additional available plaques
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

// Sample collections data
const SAMPLE_COLLECTIONS = [
  { id: 1, icon: '🎭', name: 'Theatre Legends', plaques: 5, updated: '2 days ago', color: 'bg-blue-500', isPublic: true, description: "A collection of plaques dedicated to the most influential figures in London's theatre history." },
  { id: 2, icon: '🎶', name: 'Musical Icons', plaques: 3, updated: 'yesterday', color: 'bg-green-500', isPublic: false },
  { id: 3, icon: '📚', name: 'Literary Giants', plaques: 4, updated: 'last week', color: 'bg-red-500', isPublic: true },
];

// Helper function to get Tailwind color class based on plaque color
const getColorClass = (color) => {
  switch (color?.toLowerCase()) {
    case 'blue': return 'bg-blue-500';
    case 'green': return 'bg-green-500';
    case 'red': return 'bg-red-500';
    case 'yellow': return 'bg-yellow-500';
    case 'purple': return 'bg-purple-500';
    case 'brown': return 'bg-amber-700';
    default: return 'bg-gray-500';
  }
};

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Convert id to number
  const collectionId = parseInt(id || '1');
  
  // State
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArrangementMode, setIsArrangementMode] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Filter states
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  
  // Simulating fetching data from an API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find collection
        const foundCollection = SAMPLE_COLLECTIONS.find(c => c.id === collectionId);
        
        if (foundCollection) {
          setCollection(foundCollection);
          setEditNameValue(foundCollection.name);
          
          // For demo purposes, we'll use the first 5 plaques for collection 1,
          // next 3 for collection 2, etc.
          if (collectionId === 1) {
            setCollectionPlaques(PLAQUES.slice(0, 5));
          } else if (collectionId === 2) {
            setCollectionPlaques(PLAQUES.slice(0, 3));
          } else if (collectionId === 3) {
            setCollectionPlaques(PLAQUES.slice(0, 4));
          } else {
            setCollectionPlaques([]);
          }
        } else {
          // Collection not found
          toast.error("The collection you are looking for does not exist.", {
            description: "Collection not found"
          });
          navigate('/collections');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching collection:', error);
        setLoading(false);
        toast.error("Failed to load collection data.", {
          description: "Error"
        });
      }
    };
    
    fetchData();
  }, [collectionId, navigate]);
  
  // Prepare filter options from plaques
  const colorOptions = useMemo(() => {
    const uniqueColors = [...new Set(collectionPlaques
      .filter(p => p.color)
      .map(p => p.color?.toLowerCase()))]
      .sort();
    
    return uniqueColors.map(color => ({ 
      label: color.charAt(0).toUpperCase() + color.slice(1), 
      value: color,
      color: getColorClass(color)
    }));
  }, [collectionPlaques]);
  
  const professionOptions = useMemo(() => {
    const uniqueProfessions = [...new Set(collectionPlaques
      .filter(p => p.profession)
      .map(p => p.profession))]
      .sort();
    
    return uniqueProfessions.map(profession => ({ 
      label: profession, 
      value: profession 
    }));
  }, [collectionPlaques]);
  
  const postcodeOptions = useMemo(() => {
    const uniquePostcodes = [...new Set(collectionPlaques
      .filter(p => p.postcode)
      .map(p => p.postcode))]
      .sort();
    
    return uniquePostcodes.map(postcode => ({ 
      label: postcode, 
      value: postcode 
    }));
  }, [collectionPlaques]);
  
  // Filter plaques based on selected filters
  const filteredPlaques = useMemo(() => {
    return collectionPlaques.filter(plaque => {
      // Search query filter
      if (searchQuery && !plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !plaque.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !plaque.location?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Color filter
      if (selectedColors.length > 0 && (!plaque.color || !selectedColors.includes(plaque.color.toLowerCase()))) {
        return false;
      }
      
      // Profession filter
      if (selectedProfessions.length > 0 && (!plaque.profession || !selectedProfessions.includes(plaque.profession))) {
        return false;
      }
      
      // Postcode filter
      if (selectedPostcodes.length > 0 && (!plaque.postcode || !selectedPostcodes.includes(plaque.postcode))) {
        return false;
      }
      
      // Visited filter
      if (onlyVisited && !plaque.visited) {
        return false;
      }
      
      // For demo purposes, we'll pretend plaques with IDs 1 and 4 are favorited
      const isFavorite = [1, 4].includes(plaque.id);
      if (onlyFavorites && !isFavorite) {
        return false;
      }
      
      return true;
    });
  }, [
    collectionPlaques, 
    searchQuery, 
    selectedColors, 
    selectedProfessions, 
    selectedPostcodes, 
    onlyVisited, 
    onlyFavorites
  ]);
  
  // Sort plaques based on selected sort option
  const sortedPlaques = useMemo(() => {
    return [...filteredPlaques].sort((a, b) => {
      switch (sortOption) {
        case 'recently_added':
          // For demo purposes, simulating using the "added" field
          return a.added < b.added ? 1 : -1;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });
  }, [filteredPlaques, sortOption]);
  
  // Handle clicking on a plaque
  const handlePlaqueClick = (plaque: Plaque) => {
    if (isArrangementMode) {
      // In arrangement mode, toggle selection
      if (selectedPlaques.includes(plaque.id)) {
        setSelectedPlaques(selectedPlaques.filter(id => id !== plaque.id));
      } else {
        setSelectedPlaques([...selectedPlaques, plaque.id]);
      }
    } else {
      // Regular mode, show plaque details
      setSelectedPlaque(plaque);
    }
  };
  
  // Handle save collection name
  const handleSaveCollectionName = () => {
    if (editNameValue.trim()) {
      if (collection) {
        setCollection({
          ...collection,
          name: editNameValue.trim()
        });
        toast.success("Collection name updated");
      }
      setIsEditingName(false);
    } else {
      toast.error("Collection name cannot be empty");
    }
  };

  // Handle cancel edit name
  const handleCancelEditName = () => {
    if (collection) {
      setEditNameValue(collection.name);
    }
    setIsEditingName(false);
  };
  
  // Handle toggle public/private
  const handleTogglePublic = (value: boolean) => {
    if (collection) {
      setCollection({
        ...collection,
        isPublic: value
      });
      toast.success(`Collection is now ${value ? 'public' : 'private'}`);
    }
  };
  
  // Handle remove plaques from collection
  const handleRemovePlaques = () => {
    setCollectionPlaques(collectionPlaques.filter(p => !selectedPlaques.includes(p.id)));
    toast.success(`${selectedPlaques.length} plaque(s) removed from collection`);
    setSelectedPlaques([]);
    setRemoveConfirmOpen(false);
    setIsArrangementMode(false);
  };
  
  // Handle add plaques to collection
  const handleAddPlaques = (plaquesToAdd: Plaque[]) => {
    // Filter out plaques that are already in the collection
    const newPlaques = plaquesToAdd.filter(
      p => !collectionPlaques.some(cp => cp.id === p.id)
    );
    
    setCollectionPlaques([...collectionPlaques, ...newPlaques]);
    setAddPlaquesOpen(false);
    
    if (newPlaques.length > 0) {
      toast.success(`${newPlaques.length} plaque(s) added to collection`);
    } else {
      toast.info("No new plaques were added");
    }
  };

  // Filtered count
  const filteredCount = filteredPlaques.length;
  const totalCount = collectionPlaques.length;
  const hasFilters = selectedColors.length > 0 || 
                    selectedProfessions.length > 0 || 
                    selectedPostcodes.length > 0 || 
                    onlyVisited || 
                    onlyFavorites ||
                    searchQuery;
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setSelectedColors([]);
    setSelectedProfessions([]);
    setSelectedPostcodes([]);
    setOnlyVisited(false);
    setOnlyFavorites(false);
    setSearchQuery('');
    setFilterModalOpen(false);
  };
  
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading collection...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  if (!collection) {
    return (
      <PageContainer>
        <EmptyState
          icon={<X className="w-12 h-12" />}
          title="Collection Not Found"
          description="The collection you are looking for doesn't exist or has been removed."
          action={
            <Button onClick={() => navigate('/collections')}>
              Go to Collections
            </Button>
          }
        />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      {/* Header with back button and collection name */}
      <div className="mb-6 flex flex-col space-y-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate('/collections')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center">
                <Input
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="text-xl font-bold mr-2"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveCollectionName}
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEditName}
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center">
                <h1 className="text-xl font-bold mr-2 flex items-center">
                  <span className="mr-2">{collection.icon}</span>
                  {collection.name}
                </h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Collection Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsArrangementMode(!isArrangementMode)}>
                <ClipboardEdit className="w-4 h-4 mr-2" />
                {isArrangementMode ? 'Exit Arrangement Mode' : 'Arrange Plaques'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddPlaquesOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plaques
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share Collection
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                <Trash className="w-4 h-4 mr-2" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {collection.description && (
          <p className="text-gray-600 max-w-2xl">{collection.description}</p>
        )}
      </div>
      
      {/* Collection stats */}
      <div className="mb-6">
        <CollectionStats
          plaqueCount={collectionPlaques.length}
          visitedCount={collectionPlaques.filter(p => p.visited).length}
          lastUpdated={collection.updated}
          isPublic={collection.isPublic}
          onTogglePublic={handleTogglePublic}
        />
      </div>
      
      {/* Toolbar with search, sort, view toggle, and filter */}
      <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search plaques..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recently_added">Recently Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterModalOpen(true)}
            className={hasFilters ? "border-blue-500 text-blue-500" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            {hasFilters ? `Filters (${filterCount()})` : "Filter"}
          </Button>
        </div>
      </div>
      
      {/* Selected plaques actions bar (visible in arrangement mode) */}
      {isArrangementMode && (
        <ActionBar 
          selectedCount={selectedPlaques.length}
          onClear={() => setSelectedPlaques([])}
          onRemove={() => setRemoveConfirmOpen(true)}
          onMarkVisited={() => {
            setCollectionPlaques(
              collectionPlaques.map(p => 
                selectedPlaques.includes(p.id) ? {...p, visited: true} : p
              )
            );
            toast.success(`${selectedPlaques.length} plaque(s) marked as visited`);
            setSelectedPlaques([]);
          }}
        />
      )}
      
      {/* Filter status/summary */}
      {hasFilters && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 p-2 rounded-md">
          <div className="text-sm text-blue-700">
            Showing {filteredCount} of {totalCount} plaques
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-700 text-sm" 
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
      
      {/* Plaques grid/list */}
      {sortedPlaques.length > 0 ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
          {sortedPlaques.map(plaque => (
            viewMode === 'grid' ? (
              <PlaqueCard 
                key={plaque.id}
                plaque={plaque}
                isSelected={selectedPlaques.includes(plaque.id)}
                selectable={isArrangementMode}
                onClick={() => handlePlaqueClick(plaque)}
              />
            ) : (
              <PlaqueListItem 
                key={plaque.id}
                plaque={plaque}
                isSelected={selectedPlaques.includes(plaque.id)}
                selectable={isArrangementMode}
                onClick={() => handlePlaqueClick(plaque)}
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          icon={collectionPlaques.length === 0 ? <Plus className="w-12 h-12" /> : <Filter className="w-12 h-12" />}
          title={collectionPlaques.length === 0 ? "No Plaques in Collection" : "No Plaques Match Your Filters"}
          description={
            collectionPlaques.length === 0 
              ? "Start adding blue plaques to your collection." 
              : "Try adjusting your search or filters to find plaques."
          }
          action={
            collectionPlaques.length === 0 ? (
              <Button onClick={() => setAddPlaquesOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plaques
              </Button>
            ) : (
              <Button onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )
          }
        />
      )}
      
      {/* Add Plaques Sheet */}
      <Sheet open={addPlaquesOpen} onOpenChange={setAddPlaquesOpen}>
        <SheetContent className="sm:max-w-lg w-full">
          <SheetHeader>
            <SheetTitle>Add Plaques to Collection</SheetTitle>
          </SheetHeader>
          
          <div className="my-6">
            <Input
              placeholder="Search available plaques..."
              className="mb-4"
            />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {ADDITIONAL_PLAQUES.map(plaque => (
                <div key={plaque.id} className="flex items-center p-2 border rounded-md">
                  <Checkbox id={`add-plaque-${plaque.id}`} className="mr-3" />
                  <div>
                    <label htmlFor={`add-plaque-${plaque.id}`} className="font-medium">
                      {plaque.title}
                    </label>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {plaque.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setAddPlaquesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddPlaques(ADDITIONAL_PLAQUES)}>
              Add Selected Plaques
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Filter Sheet */}
      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter Plaques</SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Plaque Color</h3>
              <MultiSelectFilter
                options={colorOptions}
                selected={selectedColors}
                onChange={setSelectedColors}
                showColorIndicator={true}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Profession</h3>
              <MultiSelectFilter
                options={professionOptions}
                selected={selectedProfessions}
                onChange={setSelectedProfessions}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Postcode</h3>
              <MultiSelectFilter
                options={postcodeOptions}
                selected={selectedPostcodes}
                onChange={setSelectedPostcodes}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Only show visited plaques</span>
                </div>
                <Switch 
                  checked={onlyVisited} 
                  onCheckedChange={setOnlyVisited}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Only show favorites</span>
                </div>
                <Switch 
                  checked={onlyFavorites} 
                  onCheckedChange={setOnlyFavorites}
                />
              </div>
            </div>
          </div>
          
          <SheetFooter className="mt-6 flex justify-between">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setFilterModalOpen(false)}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Plaque Detail Modal */}
      {selectedPlaque && (
        <Sheet open={!!selectedPlaque} onOpenChange={(open) => !open && setSelectedPlaque(null)}>
          <SheetContent className="sm:max-w-lg">
            <PlaqueDetail
              plaque={selectedPlaque}
              onClose={() => setSelectedPlaque(null)}
              onToggleVisited={(visited) => {
                setCollectionPlaques(
                  collectionPlaques.map(p => 
                    p.id === selectedPlaque.id ? {...p, visited} : p
                  )
                );
                setSelectedPlaque({...selectedPlaque, visited});
              }}
              onRemove={() => {
                setCollectionPlaques(collectionPlaques.filter(p => p.id !== selectedPlaque.id));
                setSelectedPlaque(null);
                toast.success("Plaque removed from collection");
              }}
            />
          </SheetContent>
        </Sheet>
      )}
      
      {/* Remove Confirmation Dialog */}
      <Sheet open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Remove Plaques</SheetTitle>
          </SheetHeader>
          
          <div className="py-6">
            <p className="mb-4">
              Are you sure you want to remove {selectedPlaques.length} plaque(s) from this collection?
              This action cannot be undone.
            </p>
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemovePlaques}>
              Remove
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Edit Collection Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Collection</SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-4">
            <div>
              <label htmlFor="collection-name" className="text-sm font-medium">
                Collection Name
              </label>
              <Input
                id="collection-name"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Collection Icon</label>
              <div className="grid grid-cols-8 gap-2 mt-1">
                {['🎭', '🎨', '📚', '🎵', '🏛️', '🎬', '🏠', '🌇', '👑', '⚔️', '🚂', '🧪'].map(emoji => (
                  <Button
                    key={emoji}
                    variant={collection.icon === emoji ? "default" : "outline"}
                    className="h-10 w-10 p-0"
                    onClick={() => {
                      if (collection) {
                        setCollection({
                          ...collection,
                          icon: emoji
                        });
                      }
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="collection-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="collection-description"
                value={collection.description || ""}
                onChange={(e) => {
                  if (collection) {
                    setCollection({
                      ...collection,
                      description: e.target.value
                    });
                  }
                }}
                rows={3}
                className="w-full mt-1 rounded-md border border-gray-300 p-2"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm">Public Collection</span>
                <span className="text-xs text-gray-500 ml-2">
                  (Anyone with the link can view)
                </span>
              </div>
              <Switch 
                checked={collection.isPublic} 
                onCheckedChange={handleTogglePublic}
              />
            </div>
          </div>
          
          <SheetFooter>
            <Button onClick={() => setIsEditModalOpen(false)}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

// Helper function to count active filters
function filterCount() {
  let count = 0;
  if (selectedColors.length > 0) count++;
  if (selectedProfessions.length > 0) count++;
  if (selectedPostcodes.length > 0) count++;
  if (onlyVisited) count++;
  if (onlyFavorites) count++;
  if (searchQuery) count++;
  return count;
}

export default CollectionDetail;