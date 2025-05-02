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
import { MultiSelectFilter } from './MultiSelectFilter';

type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type FilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  description?: string;
  
  // Filter state
  postcodes: FilterOption[];
  selectedPostcodes: string[];
  onPostcodesChange: (values: string[]) => void;
  
  colors: FilterOption[];
  selectedColors: string[];
  onColorsChange: (values: string[]) => void;
  
  professions: FilterOption[];
  selectedProfessions: string[];
  onProfessionsChange: (values: string[]) => void;
  
  onlyVisited: boolean;
  onVisitedChange: (value: boolean) => void;
  
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  
  className?: string;
};

export const ImprovedFilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = "Filters",
  description = "Refine your search",
  
  postcodes,
  selectedPostcodes,
  onPostcodesChange,
  
  colors,
  selectedColors,
  onColorsChange,
  
  professions,
  selectedProfessions,
  onProfessionsChange,
  
  onlyVisited,
  onVisitedChange,
  
  onlyFavorites,
  onFavoritesChange,
  
  className = ''
}: FilterSheetProps) => {
  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Count total active filters
  const activeFiltersCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className={`w-full sm:max-w-md ${className}`}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="font-normal">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          <div className="space-y-4">
            <Label className="text-base">Location</Label>
            <MultiSelectFilter
              options={postcodes}
              selected={selectedPostcodes}
              onChange={onPostcodesChange}
              placeholder="All postcodes"
              searchPlaceholder="Search postcodes..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Plaque Colors</Label>
            <MultiSelectFilter
              options={colors}
              selected={selectedColors}
              onChange={onColorsChange}
              placeholder="All colors"
              searchPlaceholder="Search colors..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base">Professions</Label>
            <MultiSelectFilter
              options={professions}
              selected={selectedProfessions}
              onChange={onProfessionsChange}
              placeholder="All professions"
              searchPlaceholder="Search professions..."
              displayBadges={true}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Additional Filters</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="visited" className="text-sm">Only Visited</Label>
                <p className="text-muted-foreground text-xs">Show plaques you've visited</p>
              </div>
              <Switch 
                id="visited" 
                checked={onlyVisited} 
                onCheckedChange={onVisitedChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="favorites" className="text-sm">Favorites</Label>
                <p className="text-muted-foreground text-xs">Show only favorite plaques</p>
              </div>
              <Switch 
                id="favorites" 
                checked={onlyFavorites} 
                onCheckedChange={onFavoritesChange}
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

export default ImprovedFilterSheet;