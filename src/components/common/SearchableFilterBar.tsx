import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SearchableFilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onFilterClick: () => void;
  activeFilters: string[];
  searchPlaceholder?: string;
  clearable?: boolean;
  onClearSearch?: () => void;
  className?: string;
};

export const SearchableFilterBar: React.FC<SearchableFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onFilterClick,
  activeFilters = [],
  searchPlaceholder = "Search...",
  clearable = true,
  onClearSearch,
  className = ''
}) => {
  const [focused, setFocused] = useState(false);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch();
    } else {
      onSearchChange('');
    }
  };
  
  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-center ${className}`}>
      <form 
        className="relative w-full sm:max-w-md flex-grow"
        onSubmit={handleSearchSubmit}
      >
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-10 pr-${clearable && searchQuery ? '10' : '4'} py-2 w-full`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={16} 
        />
        
        {clearable && searchQuery && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <X size={16} />
          </button>
        )}
      </form>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 shrink-0"
          onClick={onFilterClick}
        >
          <Filter size={16} /> 
          Filters
          {activeFilters.length > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {activeFilters.length}
            </Badge>
          )}
        </Button>
        
        <Button 
          type="submit" 
          size="sm" 
          className="sm:hidden"
          onClick={onSearch}
        >
          Search
        </Button>
      </div>
      
      {/* Active filters display - shown only on wider screens */}
      {activeFilters.length > 0 && (
        <div className="hidden md:flex gap-1 flex-wrap items-center">
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
        </div>
      )}
    </div>
  );
};

export default SearchableFilterBar;