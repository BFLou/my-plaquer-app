// src/pages/Collections.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FolderPlus, Star, Trash, Filter, Share2, 
  CheckCircle, Pencil, Copy, Search, X, Plus,
  BookOpen, LayoutGrid, List, MapIcon, ArrowUpDown
} from 'lucide-react';

// Components
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; // Add this import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Collection components
import { CollectionForm } from '@/components/collections/CollectionForm';
import { EmptyState } from '@/components/collections/EmptyState';

// Data (in a real app, this would come from a context or API)
import userData from '../data/user_data.json';

const Collections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [collections, setCollections] = useState(userData.collections);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Filters
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  
  // Get filtered and sorted collections
  const filteredCollections = collections
    .filter(collection => {
      // Match search query
      const matchesSearch = searchQuery === '' || 
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Match favorites filter
      const matchesFavorites = !showFavoritesOnly || collection.is_favorite;
      
      // Match public filter
      const matchesPublic = !showPublicOnly || collection.is_public;
      
      return matchesSearch && matchesFavorites && matchesPublic;
    })
    .sort((a, b) => {
      // Sort based on selected option
      if (sortOption === 'newest') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      if (sortOption === 'a-z') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'z-a') {
        return b.name.localeCompare(a.name);
      }
      if (sortOption === 'most-plaques') {
        return b.plaques.length - a.plaques.length;
      }
      return 0;
    });
  
  // Toggle select collection
  const toggleSelect = (id) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Toggle menu for a collection
  const handleMenuOpen = (id) => {
    setMenuOpenId(prev => prev === id ? null : id);
  };
  
  // Edit collection
  const handleEdit = (id) => {
    // In a real app, this would open an edit form
    toast.success("Edit collection", {
      description: `Editing collection ${id}`
    });
  };
  
  // Duplicate collection
  const handleDuplicate = (id) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      const newCollection = {
        ...collection,
        id: collections.length + 1,
        name: `${collection.name} (Copy)`,
        plaques: [...collection.plaques],
        updated_at: new Date().toISOString(),
        is_favorite: false
      };
      setCollections([...collections, newCollection]);
      
      toast.success("Collection duplicated", {
        description: `Created a copy of "${collection.name}"`
      });
    }
  };
  
  // Share collection
  const handleShare = (id) => {
    toast.info("Share collection", {
      description: "Sharing functionality would be implemented here"
    });
  };
  
  // Toggle favorite
  const handleToggleFavorite = (id) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id 
        ? { ...collection, is_favorite: !collection.is_favorite } 
        : collection
    ));
    
    const collection = collections.find(c => c.id === id);
    toast.success(collection.is_favorite ? "Removed from favorites" : "Added to favorites", {
      description: `"${collection.name}" ${collection.is_favorite ? 'removed from' : 'added to'} favorites`
    });
  };
  
  // Delete collection
  const handleDelete = (id) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
    
    toast.success("Collection deleted", {
      description: "The collection has been deleted"
    });
  };
  
  // Bulk delete selected collections
  const handleBulkDelete = () => {
    if (selectedCollections.length > 0) {
      setDeleteDialogOpen(true);
    }
  };
  
  // Confirm bulk delete
  const confirmBulkDelete = () => {
    const countDeleted = selectedCollections.length;
    setCollections(prev => prev.filter(collection => !selectedCollections.includes(collection.id)));
    setSelectedCollections([]);
    setDeleteDialogOpen(false);
    
    toast.success(`${countDeleted} collection${countDeleted === 1 ? '' : 's'} deleted`);
  };
  
  // Create new collection
  const handleCreateCollection = (formData) => {
    const newCollection = {
      id: collections.length + 1,
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
      plaques: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: formData.isPublic || false,
      is_favorite: false
    };
    
    setCollections([newCollection, ...collections]);
    setCreateModalOpen(false);
    
    toast.success("Collection created", {
      description: `"${formData.name}" has been created`
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setShowFavoritesOnly(false);
    setShowPublicOnly(false);
    setActiveFilters([]);
  };
  
  // Apply filters
  const applyFilters = () => {
    const newFilters = [];
    if (showFavoritesOnly) newFilters.push('Favorites');
    if (showPublicOnly) newFilters.push('Public');
    
    setActiveFilters(newFilters);
    setFilterModalOpen(false);
  };
  
  // Format date for display
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
  
  // Navigate to collection detail
  const navigateToCollection = (id) => {
    navigate(`/collections/${id}`);
  };
  
  // Statistics
  const totalCollections = collections.length;
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques.length, 0);
  const favoritedCollections = collections.filter(c => c.is_favorite).length;
  
  return (
    <PageContainer activePage="collections">
      {/* Header with stats */}
      <div className="bg-blue-600 text-white py-10 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">My Collections</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white/10 border-none shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{totalCollections}</div>
                  <div className="text-sm mt-1 text-blue-100">Collections</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-none shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{totalPlaques}</div>
                  <div className="text-sm mt-1 text-blue-100">Total Plaques</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-none shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{favoritedCollections}</div>
                  <div className="text-sm mt-1 text-blue-100">Favorites</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Controls and filters */}
      <div className="container mx-auto px-4 py-4 bg-white shadow-sm border-b sticky top-16 z-10">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-auto relative">
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
              placeholder="Search collections..."
              className="pl-9 pr-9 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
            {activeFilters.length > 0 && (
              <div className="flex gap-1 items-center">
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary">
                    {filter}
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={resetFilters}
                >
                  <X size={12} className="mr-1" /> Clear
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="h-9"
              onClick={() => setFilterModalOpen(true)}
            >
              <Filter size={16} className="mr-2" /> 
              Filter
              {activeFilters.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
            
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
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A to Z</SelectItem>
                <SelectItem value="z-a">Z to A</SelectItem>
                <SelectItem value="most-plaques">Most Plaques</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setCreateModalOpen(true)} className="h-9">
              <Plus size={16} className="mr-2" />
              New Collection
            </Button>
          </div>
        </div>
      </div>
      
      {/* Collections grid/list */}
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
            onAction={activeFilters.length > 0 || searchQuery ? resetFilters : () => setCreateModalOpen(true)}
          />
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCollections.map((collection) => (
                  <div 
                    key={collection.id}
                    className={`relative bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden cursor-pointer group ${
                      selectedCollections.includes(collection.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        toggleSelect(collection.id);
                      } else if (!e.target.closest('button')) {
                        navigateToCollection(collection.id);
                      }
                    }}
                  >
                    {/* Top menu and selection indicator */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      {selectedCollections.includes(collection.id) && (
                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                          <CheckCircle size={16} />
                        </div>
                      )}
                      <DropdownMenu onOpenChange={() => handleMenuOpen(collection.id)}>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full bg-white bg-opacity-80 backdrop-blur-sm shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM12 1.5C12 1.89782 12.158 2.27936 12.4393 2.56066C12.7206 2.84196 13.1022 3 13.5 3C13.8978 3 14.2794 2.84196 14.5607 2.56066C14.842 2.27936 15 1.89782 15 1.5C15 1.10218 14.842 0.720644 14.5607 0.43934C14.2794 0.158035 13.8978 0 13.5 0C13.1022 0 12.7206 0.158035 12.4393 0.43934C12.158 0.720644 12 1.10218 12 1.5Z" fill="currentColor" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(collection.id); }}>
                            <Pencil size={16} className="mr-2" /> Edit Collection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(collection.id); }}>
                            <Copy size={16} className="mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(collection.id); }}>
                            <Share2 size={16} className="mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleFavorite(collection.id); }}>
                            <Star size={16} className={`mr-2 ${collection.is_favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                            {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); handleDelete(collection.id); }}
                          >
                            <Trash size={16} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Header section with gradient and decorative elements */}
                    <div className="h-40 relative overflow-hidden">
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-${collection.color.replace('bg-', '')}-50 to-white`}></div>
                      
                      {/* Decorative elements */}
                      <div className={`absolute top-4 right-4 w-24 h-24 rounded-full ${collection.color} opacity-10`}></div>
                      <div className={`absolute bottom-8 left-8 w-16 h-16 rounded-full ${collection.color} opacity-5`}></div>
                      
                      {/* Large icon */}
                      <div className="absolute right-6 bottom-6 text-5xl opacity-40">{collection.icon}</div>
                      
                      {/* Collection icon and color indicator */}
                      <div className={`absolute top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-3xl ${collection.color} shadow-md`}>
                        {collection.icon}
                      </div>
                      
                      {/* Collection favorite indicator */}
                      {collection.is_favorite && (
                        <div className="absolute top-4 left-24">
                          <Star size={18} className="fill-amber-500 text-amber-500" />
                        </div>
                      )}
                      
                      {/* Public badge if applicable */}
                      {collection.is_public && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-4 left-[90px] bg-green-100 text-green-800 border-green-200"
                        >
                          Public
                        </Badge>
                      )}
                    </div>
                    
                    {/* Content section */}
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors">
                        {collection.name}
                      </h2>
                      
                      {collection.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-500 flex items-center">
                          <span className="font-medium">{collection.plaques.length}</span>
                          <span className="ml-1">{collection.plaques.length === 1 ? 'plaque' : 'plaques'}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Updated {formatUpdatedText(collection.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredCollections.map((collection) => (
                  <div 
                    key={collection.id}
                    className={`bg-white rounded-lg shadow hover:shadow-md transition border border-gray-50 overflow-hidden cursor-pointer ${
                      selectedCollections.includes(collection.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        toggleSelect(collection.id);
                      } else if (!e.target.closest('button')) {
                        navigateToCollection(collection.id);
                      }
                    }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className={`sm:w-16 h-16 sm:h-auto flex-shrink-0 ${collection.color} p-4 flex items-center justify-center text-white text-3xl`}>
                        {collection.icon}
                      </div>
                      
                      <div className="flex-grow p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{collection.name}</h3>
                            {collection.is_favorite && (
                              <Star size={16} className="fill-amber-500 text-amber-500" />
                            )}
                            {collection.is_public && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                Public
                              </Badge>
                            )}
                            {selectedCollections.includes(collection.id) && (
                              <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                                <CheckCircle size={14} />
                              </div>
                            )}
                          </div>
                          
                          {collection.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{collection.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-gray-50">
                              {collection.plaques.length} {collection.plaques.length === 1 ? 'plaque' : 'plaques'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Updated {formatUpdatedText(collection.updated_at)}
                            </span>
                          </div>
                        </div>
                        
                        <DropdownMenu onOpenChange={() => handleMenuOpen(collection.id)}>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM12 1.5C12 1.89782 12.158 2.27936 12.4393 2.56066C12.7206 2.84196 13.1022 3 13.5 3C13.8978 3 14.2794 2.84196 14.5607 2.56066C14.842 2.27936 15 1.89782 15 1.5C15 1.10218 14.842 0.720644 14.5607 0.43934C14.2794 0.158035 13.8978 0 13.5 0C13.1022 0 12.7206 0.158035 12.4393 0.43934C12.158 0.720644 12 1.10218 12 1.5Z" fill="currentColor" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(collection.id); }}>
                              <Pencil size={16} className="mr-2" /> Edit Collection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(collection.id); }}>
                              <Copy size={16} className="mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(collection.id); }}>
                              <Share2 size={16} className="mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleFavorite(collection.id); }}>
                              <Star size={16} className={`mr-2 ${collection.is_favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                              {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handleDelete(collection.id); }}
                            >
                              <Trash size={16} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'map' && (
              <div className="bg-gray-50 rounded-xl p-8 h-[500px] flex flex-col items-center justify-center text-center">
                <MapIcon size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
                <p className="text-gray-500 mb-4">Visualize your collections geographically</p>
                <Button variant="outline">Get Notified When Ready</Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Action bar for bulk actions (appears when collections are selected) */}
      {selectedCollections.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-20">
          <div className="font-medium">
            {selectedCollections.length} {selectedCollections.length === 1 ? 'collection' : 'collections'}
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          
          <Button variant="ghost" size="sm" onClick={() => setSelectedCollections([])}>
            Clear
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleBulkDelete}
          >
            <Trash size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      )}
      
      {/* Filter sheet */}
      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent side="left" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter Collections</SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Favorites Only</label>
                <Switch 
                  checked={showFavoritesOnly} 
                  onCheckedChange={setShowFavoritesOnly}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Public Only</label>
                <Switch 
                  checked={showPublicOnly} 
                  onCheckedChange={setShowPublicOnly}
                />
              </div>
            </div>
            
            {/* Additional filters could go here */}
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Create collection sheet */}
      <Sheet open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Collection</SheetTitle>
          </SheetHeader>
          
          <div className="py-6">
            <CollectionForm
              onSubmit={handleCreateCollection}
              onCancel={() => setCreateModalOpen(false)}
              submitLabel="Create Collection"
            />
          </div>
        </SheetContent>
      </Sheet>
      
    </PageContainer>
  );
};

export default Collections;