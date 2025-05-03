import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewToggle, ViewMode } from '@/components';

type CollectionActionsProps = {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddPlaques: () => void;
};

export const CollectionActions: React.FC<CollectionActionsProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onAddPlaques,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search in this collection..."
              className="pl-9 max-w-xs"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <ViewToggle 
            viewMode={viewMode} 
            onChange={onViewModeChange}
            variant="buttons"
          />
          
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recently_added">Recently Added</SelectItem>
              <SelectItem value="oldest_first">Oldest First</SelectItem>
              <SelectItem value="a_to_z">A to Z</SelectItem>
              <SelectItem value="z_to_a">Z to A</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={onAddPlaques} className="flex items-center gap-1">
            <Plus size={16} /> Add Plaques
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectionActions;