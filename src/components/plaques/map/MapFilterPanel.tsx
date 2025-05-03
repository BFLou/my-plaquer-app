import React from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MapFilterPanelProps = {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  categories: { label: string; onClick: () => void }[];
  className?: string;
};

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  visible,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
  categories = [],
  className = ''
}) => {
  return (
    <div 
      className={`absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md w-72 transition-all duration-300 transform ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      } ${className}`}
    >
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Map Filters</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search plaques..."
              value={searchQuery}
              onChange={onSearchChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Button 
              type="submit"
              variant="default"
              size="sm"
              className="w-full mt-2"
            >
              Search
            </Button>
          </div>
        </form>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Quick Filters</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  size="sm"
                  className="text-xs justify-start"
                  onClick={category.onClick}
                >
                  <MapPin size={12} className="mr-1" /> 
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapFilterPanel;