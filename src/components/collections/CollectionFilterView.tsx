// src/components/collections/CollectionFilterView.tsx
import React, { useState } from 'react';
import { Search, Filter, X, Plus, Grid, List, Map } from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { capitalizeWords } from '@/utils/stringUtils';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AddPlaquesButton from './AddPlaquesButton';

type ViewMode = 'grid' | 'list' | 'map';

type CollectionFilterViewProps = {
  plaques: Plaque[];
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddPlaquesClick: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  onFilterChange?: (filtered: Plaque[]) => void;
  className?: string;
  showMapView?: boolean; 
};

const CollectionFilterView: React.FC<CollectionFilterViewProps> = ({
  plaques,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  onAddPlaquesClick,
  isLoading = false,
  children,
  onFilterChange,
  className = '',
  showMapView = true,
}) => {
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Generate profession statistics
  const professionStats = React.useMemo(() => {
    const professionCounts: Record<string, number> = {};
    
    plaques.forEach(plaque => {
      // Get profession or use 'Unknown' default - with capitalization
      const profession = plaque.profession ? capitalizeWords(plaque.profession) : 'Unknown';
      professionCounts[profession] = (professionCounts[profession] || 0) + 1;
    });
    
    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);
  }, [plaques]);

  // Filter plaques based on search query
  const filteredPlaques = React.useMemo(() => {
    return plaques.filter(plaque => {
      // Filter by search query
      const matchesSearch = !searchQuery.trim() || 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.location?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [plaques, searchQuery]);

  // Update parent component when filtered plaques change
  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredPlaques);
    }
  }, [filteredPlaques, onFilterChange]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedProfessions([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile/Desktop View */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        {/* Search Input */}
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search plaques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 w-full"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* View Toggle and Add Button */}
        <div className="flex justify-between items-center">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} defaultValue="grid">
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-1.5">
                <Grid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1.5">
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              {showMapView && (
                <TabsTrigger value="map" className="flex items-center gap-1.5">
                  <Map size={14} />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          
          <AddPlaquesButton 
            onAddPlaques={onAddPlaquesClick} 
            isLoading={isLoading}
            className="hidden sm:flex"
          />
        </div>
        
        {/* Mobile Add Plaques Button */}
        <div className="sm:hidden mt-3">
          <AddPlaquesButton 
            onAddPlaques={onAddPlaquesClick} 
            isLoading={isLoading}
            className="w-full"
          />
        </div>
      </div>

      {/* Active filters */}
      {searchQuery && (
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
          <div className="flex items-center">
            <Badge className="bg-blue-100 text-blue-700 border-none">
              Search: {searchQuery}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSearch}
            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Display filter status if active */}
      {searchQuery && filteredPlaques.length !== plaques.length && (
        <div className="text-sm text-gray-500 px-1">
          Showing {filteredPlaques.length} of {plaques.length} plaques
        </div>
      )}

      {/* Children (actual content) */}
      {children}
    </div>
  );
};

export default CollectionFilterView;