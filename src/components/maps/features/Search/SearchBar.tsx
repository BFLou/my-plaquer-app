// src/components/maps/features/Search/SearchBar.tsx - Updated with enhanced functionality
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building, Mail, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSearch } from './useSearch';
import { Plaque } from '@/types/plaque';

interface SearchBarProps {
  plaques: Plaque[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: any) => void;
  onLocationSelect?: (result: any) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  value,
  onChange,
  onSelect,
  onLocationSelect
}) => {
  const [showResults, setShowResults] = useState(false);
  const { results, search, isSearching } = useSearch(plaques);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (value) {
      search(value);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [value, search]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (result: any) => {
    if (result.type === 'plaque') {
      onSelect(result);
      onChange(result.title);
    } else if (result.type === 'postcode' || result.type === 'area' || result.type === 'location') {
      // For location-based searches, trigger location selection
      if (onLocationSelect) {
        onLocationSelect(result);
      } else {
        onSelect(result);
      }
      onChange(result.title);
    }
    setShowResults(false);
  };
  
  const getResultIcon = (result: any) => {
    switch (result.type) {
      case 'plaque':
        return React.createElement(Building, { className: "text-blue-500", size: 16 });
      case 'postcode':
        return React.createElement(Mail, { className: "text-purple-500", size: 16 });
      case 'area':
        return React.createElement(Target, { className: "text-green-500", size: 16 });
      default:
        return React.createElement(MapPin, { className: "text-orange-500", size: 16 });
    }
  };
  
  const getResultBadge = (result: any) => {
    switch (result.type) {
      case 'postcode':
        return React.createElement(Badge, { variant: "secondary", className: "text-xs" }, "Postcode");
      case 'area':
        return React.createElement(Badge, { variant: "outline", className: "text-xs" }, "Area");
      case 'plaque':
        return React.createElement(Badge, { variant: "default", className: "text-xs" }, "Plaque");
      default:
        return null;
    }
  };
  
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && setShowResults(true)}
          placeholder="Search plaques, postcodes, or London areas..." 
          className="pl-10 pr-10 h-12 text-base bg-white text-black border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border max-h-80 overflow-y-auto z-50">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left border-b border-gray-100 last:border-b-0"
            >
              {getResultIcon(result)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-sm truncate">{result.title}</div>
                  {getResultBadge(result)}
                </div>
                <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                {result.type !== 'plaque' && (
                  <div className="text-xs text-blue-600 mt-1">
                    Click to search plaques in this area
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};