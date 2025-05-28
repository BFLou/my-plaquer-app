// src/components/maps/features/Search/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from './useSearch';
import { Plaque } from '@/types/plaque';

interface SearchBarProps {
  plaques: Plaque[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: any) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  value,
  onChange,
  onSelect
}) => {
  const [showResults, setShowResults] = useState(false);
  const { results, search } = useSearch(plaques);
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
    onSelect(result);
    setShowResults(false);
    onChange(result.title);
  };
  
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && setShowResults(true)}
          placeholder="Search plaques or location" 
          className="pl-10 pr-10 h-12 text-base bg-white text-black border border-gray-300 focus:ring-2 focus:ring-blue-500" // MODIFIED LINE
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border max-h-80 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left"
            >
              {result.type === 'plaque' ? (
                <Building className="text-blue-500 mt-0.5" size={16} />
              ) : (
                <MapPin className="text-green-500 mt-0.5" size={16} />
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">{result.title}</div>
                <div className="text-xs text-gray-500">{result.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};