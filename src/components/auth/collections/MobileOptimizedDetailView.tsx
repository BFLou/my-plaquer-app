import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Pencil, Share2, 
  Plus, MapPin, X, Check, Info, Filter,
  Grid3X3, ListFilter, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlaqueCard } from '@/components/plaques/PlaqueCard';
import { PlaqueListItem } from '@/components/plaques/PlaqueListItem';
import { CollectionStats } from '@/components/collections/CollectionStats';

type MobileOptimizedDetailViewProps = {
  collection: any; // Replace with proper type
  plaques: any[]; // Replace with proper type
  userVisits: any[]; // Replace with proper type
  onBack: () => void;
  onToggleFavorite: () => void;
  onAddPlaques: () => void;
  onEditName: () => void;
  onSaveName: () => void;
  onOpenSettings: () => void;
  onPlaqueSelected: (plaque: any) => void;
  editMode?: boolean;
  editNameValue?: string;
  onEditNameChange?: (value: string) => void;
  onCancelEdit?: () => void;
};

const MobileOptimizedDetailView: React.FC<MobileOptimizedDetailViewProps> = ({
  collection,
  plaques,
  userVisits,
  onBack,
  onToggleFavorite,
  onAddPlaques,
  onEditName,
  onSaveName,
  onOpenSettings,
  onPlaqueSelected,
  editMode = false,
  editNameValue = '',
  onEditNameChange = () => {},
  onCancelEdit = () => {}
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Track scroll position for collapsing header
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Determine if the header should be compact based on scroll position
  const isCompactHeader = scrollPosition > 80;
  
  // Filter plaques based on search
  const filteredPlaques = plaques.filter(plaque => 
    !searchQuery || 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}m ago`;
  };
  
  // Toggle search expansion
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus search input when expanded
      setTimeout(() => {
        document.getElementById('mobile-search-input')?.focus();
      }, 100);
    } else {
      // Clear search when collapsed
      setSearchQuery('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Fixed header that condenses on scroll */}
      <header className={`fixed top-0 left-0 right-0 z-30 bg-white shadow-sm transition-all duration-300 
        ${isCompactHeader ? 'py-2' : 'py-3'}`}>
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between">
            {/* Back button and collection name */}
            <div className="flex items-center gap-2 overflow-hidden">
              <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0 flex-shrink-0">
                <ArrowLeft size={18} />
              </Button>
              
              {isCompactHeader ? (
                <div className="flex items-center overflow-hidden">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${collection.color} flex-shrink-0 mr-2`}>
                    {collection.icon}
                  </div>
                  <h1 className="font-semibold text-base truncate">{collection.name}</h1>
                </div>
              ) : null}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 md:w-auto md:px-2" 
                onClick={toggleSearch}
              >
                <Search size={18} />
                <span className="ml-2 hidden md:inline">Search</span>
              </Button>
              
              <Button 
                variant={collection.is_favorite ? "ghost" : "ghost"}
                size="sm" 
                className={`h-8 w-8 p-0 ${collection.is_favorite ? "text-amber-500" : ""}`}
                onClick={onToggleFavorite}
              >
                <Star size={18} className={collection.is_favorite ? "fill-amber-500" : ""} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={onOpenSettings}
              >
                <Settings size={18} />
              </Button>
            </div>
          </div>
          
          {/* Search bar - expanded state */}
          {isSearchExpanded && (
            <div className="pt-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Input
                  id="mobile-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plaques..."
                  className="pl-9 pr-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content - scrollable area below fixed header */}
      <main className={`container mx-auto px-4 pt-${isCompactHeader ? '14' : '16'}`}>
        {/* Collection header - only visible when not in compact mode */}
        {!isCompactHeader && (
          <div className="mb-4 pt-2">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${collection.color}`}>
                {collection.icon}
              </div>
              
              {editMode ? (
                <div className="flex items-center gap-2 flex-grow">
                  <Input
                    value={editNameValue}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    className="text-lg font-bold py-1 h-auto"
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onSaveName} 
                    className="h-8 w-8 p-0 text-green-600"
                  >
                    <Check size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onCancelEdit} 
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h1 className="text-xl font-bold line-clamp-1">{collection.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onEditName} 
                    className="h-7 w-7 p-0"
                  >
                    <Pencil size={14} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                {collection.plaques.length} plaques
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                Updated {formatTimeAgo(collection.updated_at)}
              </Badge>
              {collection.is_public && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Public
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Collapsible stats */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center w-full justify-between mb-2 h-auto py-1 px-2"
            onClick={() => setShowStats(!showStats)}
          >
            <span className="font-medium">Collection Stats</span>
            <Info size={16} className={`transition-transform duration-300 ${showStats ? 'rotate-180' : ''}`} />
          </Button>
          
          <div className={`transition-all duration-300 overflow-hidden ${showStats ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <CollectionStats 
              collection={collection}
              plaques={plaques} 
              userVisits={userVisits}
            />
          </div>
        </div>
        
        {/* Action and view controls */}
        <div className="sticky top-14 bg-white rounded-lg shadow-sm p-3 mb-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <ListFilter size={16} />
            </Button>
            <Button 
              variant={isFilterActive ? 'default' : 'outline'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setIsFilterActive(!isFilterActive)}
            >
              <Filter size={16} />
            </Button>
          </div>
          
          <Button onClick={onAddPlaques} size="sm" className="h-8">
            <Plus size={16} className="mr-1" /> Add
          </Button>
        </div>
        
        {/* Collection plaques */}
        {filteredPlaques.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MapPin className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Plaques Found</h3>
            <p className="text-gray-500 mb-4 px-4">
              {searchQuery ? 'No results match your search' : 'Start adding plaques to your collection'}
            </p>
            <Button onClick={onAddPlaques}>
              <Plus size={16} className="mr-2" /> Add Plaques
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 gap-3" 
            : "space-y-3"
          }>
            {filteredPlaques.map((plaque) => (
              viewMode === 'grid' ? (
                <PlaqueCard 
                  key={plaque.id}
                  plaque={plaque}
                  onClick={onPlaqueSelected}
                />
              ) : (
                <PlaqueListItem
                  key={plaque.id}
                  plaque={plaque}
                  onClick={onPlaqueSelected}
                />
              )
            ))}
          </div>
        )}
      </main>
      
      {/* Fixed floating action button for mobile */}
      <div className="fixed bottom-4 right-4 z-20 md:hidden">
        <Button 
          onClick={onAddPlaques}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-transform duration-200 hover:scale-105"
        >
          <Plus size={24} />
        </Button>
      </div>
    </div>
  );
};

export default MobileOptimizedDetailView;