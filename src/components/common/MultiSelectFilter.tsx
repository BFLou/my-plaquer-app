import React, { useState } from 'react';
import { X, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
  color?: string;
};

type MultiSelectFilterProps = {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  maxHeight?: string;
  displayBadges?: boolean;
};

export const MultiSelectFilter = ({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className = "",
  searchPlaceholder = "Search...",
  maxHeight = "300px",
  displayBadges = true,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    onChange(newSelected);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  // Get display labels for selected items
  const selectedLabels = selected.map(value => {
    const option = options.find(opt => opt.value === value);
    return option?.label || value;
  });

  // Format for display
  const displayValue = selectedLabels.length > 0 
    ? selectedLabels.join(", ")
    : placeholder;

  // Find badge color for an option
  const getOptionColor = (value: string) => {
    const option = options.find(opt => opt.value === value);
    return option?.color;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10",
            selected.length > 0 ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center truncate">
            {selected.length === 0 && <span>{placeholder}</span>}
            
            {/* Show badges or text depending on displayBadges prop */}
            {displayBadges ? (
              <div className="flex flex-wrap gap-1 max-w-full">
                {selected.map(value => {
                  const label = options.find(opt => opt.value === value)?.label || value;
                  const color = getOptionColor(value);
                  
                  return (
                    <Badge 
                      key={value} 
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 mr-1",
                        color || "bg-primary/10"
                      )}
                    >
                      {label}
                      <button
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRemove(value, e as unknown as React.MouseEvent);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => handleRemove(value, e)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        <span className="sr-only">Remove {label}</span>
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <span className="truncate">{displayValue}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} icon={Search} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <ScrollArea className={`max-h-[${maxHeight}]`}>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleOption(option.value)}
                    >
                      <div 
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="w-full text-xs"
              >
                Clear all selections
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;