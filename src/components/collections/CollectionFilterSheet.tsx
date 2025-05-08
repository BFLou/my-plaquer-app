import React, { useState } from 'react';
import { CheckIcon, BadgeCheck, FilterX } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type FilterOption = {
  id: string;
  label: string;
};

type CollectionFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: string[];
  onApplyFilters: (filters: string[]) => void;
  onResetFilters: () => void;
};

const CollectionFilterSheet = ({
  isOpen,
  onClose,
  activeFilters,
  onApplyFilters,
  onResetFilters
}: CollectionFilterSheetProps) => {
  // Filter options
  const typeFilters: FilterOption[] = [
    { id: 'Literary', label: 'Literary & Authors' },
    { id: 'Music', label: 'Music & Musicians' },
    { id: 'Historical', label: 'Historical Events' },
    { id: 'Scientific', label: 'Science & Discoveries' },
    { id: 'Architecture', label: 'Architecture & Buildings' },
    { id: 'Political', label: 'Political Figures' },
  ];

  const sizeFilters: FilterOption[] = [
    { id: 'Small', label: 'Small (1-3 plaques)' },
    { id: 'Medium', label: 'Medium (4-10 plaques)' },
    { id: 'Large', label: 'Large (10+ plaques)' },
  ];

  // Local state for selected filters
  const [selectedFilters, setSelectedFilters] = useState<string[]>([...activeFilters]);
  const [showFavorites, setShowFavorites] = useState(activeFilters.includes('Favorites'));
  const [showPublic, setShowPublic] = useState(activeFilters.includes('Public'));

  // Reset filters
  const handleResetFilters = () => {
    setSelectedFilters([]);
    setShowFavorites(false);
    setShowPublic(false);
    onResetFilters();
  };

  // Apply filters
  const handleApplyFilters = () => {
    const filters = [...selectedFilters];
    
    if (showFavorites) {
      filters.push('Favorites');
    }
    
    if (showPublic) {
      filters.push('Public');
    }
    
    onApplyFilters(filters);
    onClose();
  };

  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Count active filters
  const totalActiveFilters = selectedFilters.length + (showFavorites ? 1 : 0) + (showPublic ? 1 : 0);

  // Handle sheet close
  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Collections</SheetTitle>
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="font-normal">
                {totalActiveFilters} active
              </Badge>
            )}
          </div>
        </SheetHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Collection Type Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-base">Collection Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {typeFilters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <Checkbox 
                    id={`type-${filter.id}`}
                    checked={selectedFilters.includes(filter.id)}
                    onCheckedChange={() => toggleFilter(filter.id)}
                  />
                  <Label 
                    htmlFor={`type-${filter.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {filter.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Collection Size Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-base">Collection Size</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sizeFilters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <Checkbox 
                    id={`size-${filter.id}`}
                    checked={selectedFilters.includes(filter.id)}
                    onCheckedChange={() => toggleFilter(filter.id)}
                  />
                  <Label 
                    htmlFor={`size-${filter.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {filter.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Additional Filters Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-base">Additional Filters</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="favorites-switch" className="text-sm cursor-pointer">
                Show only favorite collections
              </Label>
              <Switch 
                id="favorites-switch"
                checked={showFavorites}
                onCheckedChange={setShowFavorites}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="public-switch" className="text-sm cursor-pointer">
                Show only public collections
              </Label>
              <Switch 
                id="public-switch"
                checked={showPublic}
                onCheckedChange={setShowPublic}
              />
            </div>
          </div>
        </div>
        
        <SheetFooter className="flex flex-row gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            className="flex-1 gap-2"
          >
            <FilterX size={16} />
            Reset All
          </Button>
          <Button 
            onClick={handleApplyFilters}
            className="flex-1 gap-2"
          >
            <BadgeCheck size={16} />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionFilterSheet;