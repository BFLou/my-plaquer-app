import { BadgeCheck, FilterX, Search, Check, X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type FilterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  
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

// Enhanced MultiSelect component with improved UX
const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder
}: {
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 pl-8 h-9 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      
      {filteredOptions.length > 0 ? (
        <div className="max-h-60 overflow-auto p-1">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer",
                selected.includes(option.value) 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted"
              )}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {selected.includes(option.value) && (
                <Check className="h-4 w-4" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 text-sm text-muted-foreground text-center">
          No results found
        </div>
      )}
    </div>
  );
};

export const ImprovedFilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = "Add Plaques to Collection",
  
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
}: FilterDialogProps) => {
  // Count selected items
  const selectedCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length;

  // Active tabs state
  const [activeTab, setActiveTab] = useState<'search' | 'selected'>('search');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 sm:max-w-md">
        <div className="flex flex-col max-h-[85vh]">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>{title}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Info banner - similar to the one in the image */}
            <div className="bg-blue-50 rounded-md p-4 my-4 flex gap-2 items-start">
              <div className="text-blue-500 mt-1">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                You can also add plaques directly from the <span className="font-medium">Discover</span> page when browsing the map or list view.
              </div>
            </div>
            
            {/* Tabs navigation */}
            <div className="flex border-b mt-2">
              <Button 
                variant="ghost" 
                className={`flex gap-2 rounded-none border-b-2 pb-2 pt-1 px-4 ${activeTab === 'search' ? 'border-primary text-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('search')}
              >
                <Search size={18} />
                Search
              </Button>
              <Button 
                variant="ghost" 
                className={`flex gap-2 rounded-none border-b-2 pb-2 pt-1 px-4 ${activeTab === 'selected' ? 'border-primary text-primary' : 'border-transparent'}`}
                onClick={() => setActiveTab('selected')}
              >
                <Check size={18} />
                Selected ({selectedCount})
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4" style={{maxHeight: '400px'}}>
            {activeTab === 'search' ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">Search for plaques to add to your collection</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  You can search by title, location, profession, or any other text related to the plaques
                </p>
                
                {/* Global search input */}
                <div className="relative w-full mt-6">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search plaques by any text..."
                    className="pl-9 h-10"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCount > 0 ? (
                  <div className="space-y-2">
                    {[...selectedPostcodes, ...selectedColors, ...selectedProfessions].map((value) => (
                      <div key={value} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{value}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            // Remove from appropriate array
                            if (selectedPostcodes.includes(value)) {
                              onPostcodesChange(selectedPostcodes.filter(v => v !== value));
                            } else if (selectedColors.includes(value)) {
                              onColorsChange(selectedColors.filter(v => v !== value));
                            } else if (selectedProfessions.includes(value)) {
                              onProfessionsChange(selectedProfessions.filter(v => v !== value));
                            }
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No plaques selected yet
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 border-t mt-auto flex">
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={onReset}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={onApply}
                className="flex-1"
                disabled={selectedCount === 0}
              >
                Add Plaques
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImprovedFilterSheet;