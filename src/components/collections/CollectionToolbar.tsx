// src/features/collections/components/CollectionToolbar.tsx
import React from 'react';
import { ViewMode } from '../hooks/useCollectionsList';
import { SearchableFilterBar } from '@/components/common/SearchableFilterBar';
import { ViewToggle } from '@/components/common/ViewToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CollectionToolbarProps = {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortOption: string;
  setSortOption: (value: string) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (value: boolean) => void;
  activeFilters: string[];
  className?: string;
};

const CollectionToolbar: React.FC<CollectionToolbarProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  showOnlyFavorites,
  setShowOnlyFavorites,
  activeFilters,
  className = ''
}) => {
  return (
    <div className={`mb-6 flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="flex-grow">
        <SearchableFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={() => {}} // Immediate filtering, no explicit search needed
          onFilterClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          activeFilters={activeFilters}
          searchPlaceholder="Search collections..."
          className="w-full"
        />
      </div>
      
      <div className="flex gap-3 items-center">
        <ViewToggle
          viewMode={viewMode}
          onChange={setViewMode}
          showMap={false}
        />
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recently_updated">Recently Updated</SelectItem>
            <SelectItem value="oldest_updated">Oldest Updated</SelectItem>
            <SelectItem value="a_to_z">A to Z</SelectItem>
            <SelectItem value="z_to_a">Z to A</SelectItem>
            <SelectItem value="most_plaques">Most Plaques</SelectItem>
            <SelectItem value="least_plaques">Least Plaques</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CollectionToolbar;