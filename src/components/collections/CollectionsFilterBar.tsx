// src/components/collections/CollectionsFilterBar.tsx
import React from 'react';
import { Search, Filter, X, LayoutGrid, List, Map } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewMode } from '@/types';

type CollectionsFilterBarProps = {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilters: string[];
  onFilterClick: () => void;
  resetFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption?: string;
  onSortChange?: (value: string) => void;
};

export const CollectionsFilterBar: React.FC<CollectionsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterClick,
  resetFilters,
  viewMode,
  onViewModeChange,
  sortOption = 'newest',
  onSortChange = () => {}
}) => {
  return (
    <div className="sticky top-[61px] bg-white z-10 border-y border-gray-100 py-3 mb-6">
      <div className="container mx-auto px-4">
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
            
            {/* View Toggle Buttons */}
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-1 ${viewMode === 'grid' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50'}`}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 ${viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50'}`}
              >
                <List size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('map')}
                className={`px-3 py-1 ${viewMode === 'map' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50'}`}
              >
                <Map size={16} />
              </Button>
            </div>
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
              {searchQuery && (
                <button 
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-500 hover:text-gray-800"
                  onClick={() => {
                    const event = {
                      target: { value: '' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onSearchChange(event);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <Select value={sortOption} onValueChange={onSortChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Recently Updated</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_plaques">Most Plaques</SelectItem>
                <SelectItem value="alphabetical">A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsFilterBar;