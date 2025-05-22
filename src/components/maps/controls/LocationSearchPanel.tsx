// src/components/maps/controls/LocationSearchPanel.tsx - Fixed autocomplete and improved UX
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
  onSearch: (address: string, coordinates?: [number, number]) => void;
  onClose: () => void;
  isLoading: boolean;
}

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
    
    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };
  
  // Fetch London-focused location suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) return;
    
    setIsFetching(true);
    
    try {
      // London bounding box: roughly -0.489,51.28,0.236,51.686
      const londonBounds = 'viewbox=-0.489,51.28,0.236,51.686&bounded=1';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', London')}&limit=8&addressdetails=1&${londonBounds}&countrycodes=gb`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      // Format and prioritize suggestions
      const formattedSuggestions = data
        .map((item: any) => ({
          id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          address: item.address,
          importance: item.importance || 0,
          boundingbox: item.boundingbox
        }))
        .sort((a: LocationSuggestion, b: LocationSuggestion) => {
          // Prioritize by type and importance
          const typeOrder = { 
            'street': 5, 
            'road': 5, 
            'suburb': 4, 
            'neighbourhood': 4,
            'postcode': 3,
            'city_district': 2,
            'borough': 2,
            'city': 1 
          };
          
          const aScore = (typeOrder[a.type as keyof typeof typeOrder] || 0) + (a.importance || 0);
          const bScore = (typeOrder[b.type as keyof typeof typeOrder] || 0) + (b.importance || 0);
          
          return bScore - aScore;
        });
      
      // Store in cache
      autocompleteCache.current.set(query, formattedSuggestions);
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
      setSuggestions([]);
    }
  };
  
  // Handle suggestion selection - FIXED
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setSearchValue(suggestion.display_name);
    setSuggestions([]);
    // Pass coordinates along with the search - this was missing!
    onSearch(suggestion.display_name, [suggestion.lat, suggestion.lon]);
  };

  // Render location type icon
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
      case 'suburb':
      case 'neighbourhood':
        return <MapPin size={14} className="text-purple-500" />;
      case 'postcode':
        return <MapPin size={14} className="text-orange-500" />;
      default:
        return <MapPin size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-[1000] w-80 sm:w-96">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MapPin size={16} className="text-gray-500" />
          Search Location
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
            placeholder="Search for address or area in London..."
            value={searchValue}
            onChange={handleInputChange}
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
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-2">
                  {renderLocationIcon(suggestion.type)}
                  <div className="flex-1 overflow-hidden">
                    <div className="text-gray-800 font-medium truncate">
                      {suggestion.display_name.split(',').slice(0, 2).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{suggestion.type}</span>
                      {suggestion.address?.postcode && (
                        <>
                          <span>•</span>
                          <span>{suggestion.address.postcode}</span>
                        </>
                      )}
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
        <p>Search for London locations. Distance filter will be applied automatically.</p>
      </div>
    </div>
  );
};

export default LocationSearchPanel;