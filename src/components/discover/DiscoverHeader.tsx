// src/components/discover/DiscoverHeader.tsx
import React from 'react';
import { Search, Filter, X, Map, Grid, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileInput } from "@/components/ui/mobile-input";

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

  // FIXED: Handle the string to ViewMode conversion
  const handleViewModeChange = (value: string) => {
    // Type guard to ensure the value is a valid ViewMode
    if (value === 'grid' || value === 'list' || value === 'map') {
      onViewModeChange(value as ViewMode);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-4">
          {/* View Mode Tabs - Mobile Optimized */}
          <Tabs 
            value={viewMode} 
            onValueChange={handleViewModeChange}
            className="w-full"
          >
            <TabsList className="w-full h-12">
              <TabsTrigger value="map" className="flex-1 text-xs sm:text-sm min-h-[44px]">
                <Map size={16} className="mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex-1 text-xs sm:text-sm min-h-[44px]">
                <Grid size={16} className="mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1 text-xs sm:text-sm min-h-[44px]">
                <List size={16} className="mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search and Filter Controls - Mobile Optimized */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <MobileInput
                placeholder="Search plaques..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-9 h-12"
              />
              {searchValue && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={() => onSearchChange('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <Button 
              variant={activeFiltersCount > 0 ? "default" : "outline"}
              size="sm" 
              className="shrink-0 gap-1 h-12 min-w-[44px] px-3"
              onClick={onOpenFilters}
            >
              <Filter size={16} /> 
              <span className="hidden sm:inline">Filters</span>
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