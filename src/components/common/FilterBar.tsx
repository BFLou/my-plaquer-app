import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FilterBarProps = {
  onFilterClick: () => void;
  activeFilters: string[];
  children?: React.ReactNode;
  className?: string;
};

export const FilterBar = ({ 
  onFilterClick, 
  activeFilters = [], 
  children,
  className = '' 
}: FilterBarProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={onFilterClick}
      >
        <Filter size={16} /> 
        Filters
        {activeFilters.length > 0 && (
          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
            {activeFilters.length}
          </Badge>
        )}
      </Button>
      
      {children}
      
      {activeFilters.length > 0 && (
        <div className="hidden md:flex gap-1 items-center ml-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;