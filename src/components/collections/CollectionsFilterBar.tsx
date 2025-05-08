import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggle, ViewMode } from '@/components';

type CollectionsFilterBarProps = {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilters: string[];
  onFilterClick: () => void;
  resetFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const CollectionsFilterBar = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterClick,
  resetFilters,
  viewMode,
  onViewModeChange
}: CollectionsFilterBarProps) => {
  return (
    <div className="sticky top-[61px] bg-white z-10 border-y border-gray-100 py-3 mb-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onFilterClick}
          >
            <Filter size={16} /> 
            Filters
            {activeFilters.length > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
          
          {activeFilters.length > 0 && (
            <div className="hidden md:flex gap-1 items-center overflow-x-auto">
              {activeFilters.slice(0, 3).map((filter, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {filter}
                </Badge>
              ))}
              {activeFilters.length > 3 && (
                <Badge variant="outline">
                  +{activeFilters.length - 3} more
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={resetFilters}
              >
                Clear All
              </Button>
            </div>
          )}
          
          <ViewToggle
            viewMode={viewMode}
            onChange={onViewModeChange}
            variant="buttons"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search collections..."
              className="pl-8 py-2 w-full text-gray-800 min-w-[200px]"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsFilterBar;