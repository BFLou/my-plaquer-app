import { BadgeCheck, FilterX } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MultiSelectFilter } from '../common/MultiSelectFilter';

type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type CollectionsFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  
  // Filter state
  types: FilterOption[];
  selectedTypes: string[];
  onTypesChange: (values: string[]) => void;
  
  timePeriods: FilterOption[];
  selectedTimePeriods: string[];
  onTimePeriodsChange: (values: string[]) => void;
  
  plaqueCounts: FilterOption[];
  selectedPlaqueCounts: string[];
  onPlaqueCountsChange: (values: string[]) => void;
  
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  
  onlyShared: boolean;
  onSharedChange: (value: boolean) => void;
  
  className?: string;
};

export const CollectionsFilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  
  types,
  selectedTypes,
  onTypesChange,
  
  timePeriods,
  selectedTimePeriods,
  onTimePeriodsChange,
  
  plaqueCounts,
  selectedPlaqueCounts,
  onPlaqueCountsChange,
  
  onlyFavorites,
  onFavoritesChange,
  
  onlyShared,
  onSharedChange,
  
  className = ''
}: CollectionsFilterSheetProps) => {
  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Count total active filters
  const activeFiltersCount = 
    selectedTypes.length + 
    selectedTimePeriods.length + 
    selectedPlaqueCounts.length + 
    (onlyFavorites ? 1 : 0) + 
    (onlyShared ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className={`w-full sm:max-w-md ${className}`}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Collections</SheetTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="font-normal">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <SheetDescription>Refine your collections view</SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <Label className="text-base">Collection Type</Label>
            <MultiSelectFilter
              options={types}
              selected={selectedTypes}
              onChange={onTypesChange}
              placeholder="All collection types"
              searchPlaceholder="Search collection types..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Last Updated</Label>
            <MultiSelectFilter
              options={timePeriods}
              selected={selectedTimePeriods}
              onChange={onTimePeriodsChange}
              placeholder="Any time"
              searchPlaceholder="Search time periods..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Number of Plaques</Label>
            <MultiSelectFilter
              options={plaqueCounts}
              selected={selectedPlaqueCounts}
              onChange={onPlaqueCountsChange}
              placeholder="Any amount"
              searchPlaceholder="Search plaque counts..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Additional Filters</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="favorites" className="text-sm">Favorites Only</Label>
                <p className="text-muted-foreground text-xs">Only show collections you've marked as favorites</p>
              </div>
              <Switch 
                id="favorites" 
                checked={onlyFavorites} 
                onCheckedChange={onFavoritesChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shared" className="text-sm">Shared Collections</Label>
                <p className="text-muted-foreground text-xs">Only show collections you've shared with others</p>
              </div>
              <Switch 
                id="shared" 
                checked={onlyShared} 
                onCheckedChange={onSharedChange}
              />
            </div>
          </div>
        </div>
        
        <SheetFooter className="flex flex-row gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex-1 gap-2"
          >
            <FilterX size={16} />
            Reset All
          </Button>
          <Button 
            onClick={onApply}
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

export default CollectionsFilterSheet;