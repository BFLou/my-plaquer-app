// src/components/maps/controls/LocationSearchPanel.tsx
import React, { useState } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LocationSearchPanelProps = {
  onSearch: (address: string) => void;
  onClose: () => void;
  isLoading: boolean;
};

const LocationSearchPanel: React.FC<LocationSearchPanelProps> = ({
  onSearch,
  onClose,
  isLoading
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Sample suggestions - in a real implementation, these would come from an API
  const sampleSuggestions = [
    'London, UK',
    'Oxford, UK',
    'Cambridge, UK',
    'Edinburgh, UK',
    'Manchester, UK'
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Simple suggestion filtering logic - in a real implementation, this would be an API call
    if (value.length > 1) {
      const filtered = sampleSuggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
    }
  };
  
  const selectSuggestion = (suggestion: string) => {
    setSearchValue(suggestion);
    setSuggestions([]);
    onSearch(suggestion);
  };

  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-20 w-72 sm:w-96">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MapPin size={16} className="text-gray-500" />
          Location Search
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter address or location..."
            value={searchValue}
            onChange={handleInputChange}
            className="pl-9 pr-4 py-2 w-full"
            disabled={isLoading}
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        {suggestions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            type="button" 
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isLoading || !searchValue.trim()}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                Searching...
              </>
            ) : (
              <>Search</>
            )}
          </Button>
        </div>
      </form>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Try searching for a city, address, or landmark to find plaques in that area.</p>
      </div>
    </div>
  );
};

export default LocationSearchPanel;