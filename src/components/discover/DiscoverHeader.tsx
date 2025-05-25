// src/components/discover/DiscoverHeader.tsx
import React from 'react';
import { Search, Filter, X, Map, Grid, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export type ViewMode = 'grid' | 'list' | 'map';

interface DiscoverHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFiltersCount: number;
  onOpenFilters: () => void;
}

const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  activeFiltersCount,
  onOpenFilters
}) => {
  const handleSearch = () => {
    // Search is handled in real-time via onSearchChange
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* View Mode Tabs */}
          <Tabs 
            value={viewMode} 
            onValueChange={onViewModeChange}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="map" className="flex-1 sm:flex-initial">
                <Map size={16} className="mr-2" /> Map
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex-1 sm:flex-initial">
                <Grid size={16} className="mr-2" /> Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1 sm:flex-initial">
                <List size={16} className="mr-2" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search and Filter Controls */}
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search plaques..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-9 w-full"
              />
              {searchValue && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => onSearchChange('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <Button 
              variant={activeFiltersCount > 0 ? "default" : "outline"}
              size="sm" 
              className="shrink-0 gap-1"
              onClick={onOpenFilters}
            >
              <Filter size={16} /> 
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 h-5 min-w-5 rounded-full bg-white text-blue-600 text-xs flex items-center justify-center px-1">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverHeader;