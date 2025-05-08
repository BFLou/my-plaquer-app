// src/components/maps/controls/LocationSearchPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Loader } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationSuggestion {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  address?: {
    country?: string;
    city?: string;
    state?: string;
    [key: string]: string | undefined;
  };
  importance?: number;
  boundingbox?: string[];
}

interface LocationSearchPanelProps {
  onSearch: (address: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * LocationSearchPanel Component with Autocomplete
 * Provides location search functionality for the map with autocomplete suggestions
 */
const LocationSearchPanel: React.FC<LocationSearchPanelProps> = ({
  onSearch,
  onClose,
  isLoading
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteCache = useRef<Map<string, LocationSuggestion[]>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Don't fetch suggestions for very short queries
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Check cache first
    if (autocompleteCache.current.has(value)) {
      setSuggestions(autocompleteCache.current.get(value) || []);
      return;
    }
    
    // Debounce API calls to avoid excessive requests
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };
  
  // Fetch location suggestions from API
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) return;
    
    setIsFetching(true);
    
    try {
      // Using Nominatim API for location suggestions (free and reliable)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      // Format suggestions for display
      const formattedSuggestions = data.map((item: any) => ({
        id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        address: item.address,
        importance: item.importance,
        boundingbox: item.boundingbox
      }));
      
      // Store in cache
      autocompleteCache.current.set(query, formattedSuggestions);
      
      // Update state
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  };
  
  // Clean up effect
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
      setSuggestions([]); // Clear suggestions after search
    }
  };
  
  // Handle suggestion selection
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    setSearchValue(suggestion.display_name);
    setSuggestions([]);
    // Pass the full display name to the search function
    onSearch(suggestion.display_name);
  };

  // Function to render address with highlighted matching text
  const renderHighlightedAddress = (suggestion: LocationSuggestion) => {
    const fullAddress = suggestion.display_name;
    const searchTerms = searchValue.toLowerCase().split(' ').filter(term => term.length > 1);
    
    if (searchTerms.length === 0) return fullAddress;
    
    // Create parts to highlight
    let result = fullAddress;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<strong>$1</strong>');
    });
    
    return (
      <div dangerouslySetInnerHTML={{ __html: result }}></div>
    );
  };
  
  // Render location type icon based on suggestion type
  const renderLocationIcon = (type: string) => {
    switch(type) {
      case 'city':
      case 'town':
      case 'village':
        return <MapPin size={14} className="text-blue-500" />;
      case 'street':
      case 'road':
      case 'path':
        return <MapPin size={14} className="text-green-500" />;
      case 'building':
      case 'house':
      case 'apartment':
        return <MapPin size={14} className="text-red-500" />;
      default:
        return <MapPin size={14} className="text-gray-400" />;
    }
  };

  // Handle keyboard navigation of suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    
    if (e.key === 'Escape') {
      setSuggestions([]);
    }
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
            ref={inputRef}
            type="text"
            placeholder="Enter address or location..."
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-4 py-2 w-full"
            disabled={isLoading}
            autoComplete="off"
          />
          {isFetching ? (
            <Loader className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
          ) : (
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          )}
          
          {searchValue && !isFetching && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              onClick={() => {
                setSearchValue('');
                setSuggestions([]);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              <X size={12} />
            </Button>
          )}
        </div>
        
        {suggestions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-64 overflow-auto divide-y divide-gray-100">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="flex items-start gap-2">
                  {renderLocationIcon(suggestion.type)}
                  <div className="flex-1 overflow-hidden">
                    <div className="text-gray-800 font-medium truncate">
                      {renderHighlightedAddress(suggestion)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {suggestion.type} {suggestion.address?.country ? `• ${suggestion.address.country}` : ''}
                    </div>
                  </div>
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