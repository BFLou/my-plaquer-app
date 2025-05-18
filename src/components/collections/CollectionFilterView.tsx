// src/components/collections/CollectionFilterView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Plus } from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ViewToggle } from "@/components/common/ViewToggle";
import AddPlaquesButton from './AddPlaquesButton';

type ViewMode = 'grid' | 'list' | 'map';

type ProfessionCount = {
  profession: string;
  count: number;
};

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
}) => {
  // Filter state
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [professionDropdownOpen, setProfessionDropdownOpen] = useState(false);
  const [mobileProfessionFilterOpen, setMobileProfessionFilterOpen] = useState(false);

  // Generate profession statistics
  const professionStats = useMemo(() => {
    const professionCounts: Record<string, number> = {};
    
    plaques.forEach(plaque => {
      const profession = plaque.profession || 'Unknown';
      professionCounts[profession] = (professionCounts[profession] || 0) + 1;
    });
    
    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);
  }, [plaques]);

  // Filter plaques based on search query and selected professions
  const filteredPlaques = useMemo(() => {
    return plaques.filter(plaque => {
      // Filter by search query
      const matchesSearch = !searchQuery.trim() || 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.location?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by selected professions
      const matchesProfession = selectedProfessions.length === 0 || 
        selectedProfessions.includes(plaque.profession || 'Unknown');
      
      return matchesSearch && matchesProfession;
    });
  }, [plaques, searchQuery, selectedProfessions]);

  // Update parent component when filtered plaques change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredPlaques);
    }
  }, [filteredPlaques, onFilterChange]);

  // Toggle a profession filter
  const toggleProfessionFilter = (profession: string) => {
    setSelectedProfessions(prev =>
      prev.includes(profession) 
        ? prev.filter(p => p !== profession) 
        : [...prev, profession]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProfessions([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || selectedProfessions.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative w-full">
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

        {/* Mobile Filter Button & View Toggle */}
        <div className="flex justify-between items-center">
          <Collapsible 
            open={mobileProfessionFilterOpen} 
            onOpenChange={setMobileProfessionFilterOpen}
            className="w-full mr-2"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant={selectedProfessions.length > 0 ? "default" : "outline"} 
                size="sm" 
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <Filter size={16} className="mr-2" />
                  Profession Filters
                </span>
                {selectedProfessions.length > 0 && (
                  <Badge>{selectedProfessions.length}</Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2 bg-white p-3 rounded-md border shadow-sm">
              <h4 className="text-sm font-medium mb-2">Filter by Profession</h4>
              <ScrollArea className="h-48 pr-3">
                {professionStats.map(({ profession, count }) => (
                  <div 
                    key={profession} 
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer mb-1 ${
                      selectedProfessions.includes(profession) 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleProfessionFilter(profession)}
                  >
                    <span className="truncate">{profession}</span>
                    <Badge variant="outline" className="text-xs bg-white">
                      {count}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
              
              {selectedProfessions.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-full mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex">
            <ViewToggle
              viewMode={viewMode}
              onChange={setViewMode}
              showMap={false}
            />
          </div>
        </div>

        {/* Display active filters */}
        {selectedProfessions.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-1 overflow-x-auto">
            {selectedProfessions.map(profession => (
              <Badge 
                key={profession} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {profession}
                <button
                  onClick={() => toggleProfessionFilter(profession)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Plaques Button (mobile) */}
        <AddPlaquesButton 
          onAddPlaques={onAddPlaquesClick} 
          isLoading={isLoading}
          className="w-full mt-2"
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex md:flex-col gap-4">
        <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap gap-3 justify-between">
          {/* Search and Filter Section */}
          <div className="flex flex-grow items-center gap-3">
            <div className="relative flex-grow max-w-md">
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
            
            {/* Profession filter dropdown */}
            <Popover open={professionDropdownOpen} onOpenChange={setProfessionDropdownOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={selectedProfessions.length > 0 ? "default" : "outline"} 
                  className="flex items-center gap-2"
                >
                  <Filter size={16} />
                  Professions
                  {selectedProfessions.length > 0 && <Badge>{selectedProfessions.length}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filter by Profession</h4>
                    {selectedProfessions.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="h-8 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Profession List with Scrolling */}
                  <ScrollArea className="h-56">
                    <div className="space-y-1 pr-3">
                      {professionStats.map(({ profession, count }) => (
                        <div 
                          key={profession} 
                          className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer ${
                            selectedProfessions.includes(profession) 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleProfessionFilter(profession)}
                        >
                          <span className="truncate">{profession}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* View Toggle and Add Button */}
          <div className="flex items-center gap-3">
            <ViewToggle
              viewMode={viewMode}
              onChange={setViewMode}
              showMap={false}
            />
            
            <AddPlaquesButton 
              onAddPlaques={onAddPlaquesClick} 
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {selectedProfessions.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium px-2">Active filters:</span>
            {selectedProfessions.map(profession => (
              <Badge 
                key={profession} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {profession}
                <button
                  onClick={() => toggleProfessionFilter(profession)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="ml-auto text-xs"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Filter status message */}
      {hasActiveFilters && (
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