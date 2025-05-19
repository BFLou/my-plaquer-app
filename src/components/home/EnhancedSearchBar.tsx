// src/components/home/EnhancedSearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, MapPin, Users, Tag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plaque } from '@/types/plaque';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

type SearchSuggestion = {
  id: number;
  type: 'person' | 'location' | 'profession';
  text: string;
  count: number;
  profession?: string;
};

type EnhancedSearchBarProps = {
  onSearch?: (query: string) => void;
  className?: string;
};

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ 
  onSearch,
  className
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [plaqueData, setPlaqueData] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Load plaque data from JSON
  useEffect(() => {
    const fetchPlaqueData = async () => {
      try {
        setLoading(true);
        // Import plaque data
        const { default: rawData } = await import('@/data/plaque_data.json');
        const adaptedData = adaptPlaquesData(rawData);
        setPlaqueData(adaptedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading plaque data:', error);
        setLoading(false);
      }
    };
    
    fetchPlaqueData();
  }, []);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generate search suggestions based on input query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !plaqueData.length) {
      setSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];
    
    // Track unique items to avoid duplicates
    const addedItems = new Set<string>();
    
    // First, look for person matches (lead subject name)
    plaqueData.forEach(plaque => {
      const name = (plaque.lead_subject_name || '').toLowerCase();
      if (name && name.includes(query)) {
        const key = `person-${name}`;
        if (!addedItems.has(key) && newSuggestions.length < 8) {
          addedItems.add(key);
          newSuggestions.push({
            id: plaque.id,
            type: 'person',
            text: plaque.lead_subject_name || '',
            profession: plaque.profession || 'Historical Figure',
            count: 1
          });
        }
      }
    });
    
    // Next, look for location matches
    plaqueData.forEach(plaque => {
      const location = [
        (plaque.location || '').toLowerCase(),
        (plaque.address || '').toLowerCase(),
        (plaque.area || '').toLowerCase(),
        (plaque.postcode || '').toLowerCase()
      ].join(' ');
      
      if (location && location.includes(query)) {
        // Extract the best location part that matches
        let matchText = '';
        if (plaque.area && plaque.area.toLowerCase().includes(query)) {
          matchText = plaque.area;
        } else if (plaque.location && plaque.location.toLowerCase().includes(query)) {
          matchText = plaque.location;
        } else if (plaque.address && plaque.address.toLowerCase().includes(query)) {
          matchText = plaque.address;
        }
        
        if (matchText) {
          const key = `location-${matchText}`;
          if (!addedItems.has(key) && newSuggestions.length < 8) {
            addedItems.add(key);
            newSuggestions.push({
              id: plaque.id,
              type: 'location',
              text: matchText,
              count: 1
            });
          }
        }
      }
    });
    
    // Finally, look for profession matches
    plaqueData.forEach(plaque => {
      const profession = (plaque.profession || '').toLowerCase();
      if (profession && profession.includes(query)) {
        const key = `profession-${profession}`;
        if (!addedItems.has(key) && newSuggestions.length < 8) {
          addedItems.add(key);
          newSuggestions.push({
            id: plaque.id,
            type: 'profession',
            text: plaque.profession || '',
            count: 1
          });
        }
      }
    });
    
    // Consolidate counts for duplicate types + text
    const consolidatedSuggestions: Record<string, SearchSuggestion> = {};
    
    newSuggestions.forEach(suggestion => {
      const key = `${suggestion.type}-${suggestion.text}`;
      if (consolidatedSuggestions[key]) {
        consolidatedSuggestions[key].count += suggestion.count;
      } else {
        consolidatedSuggestions[key] = { ...suggestion };
      }
    });
    
    // Convert back to array and sort by count
    const finalSuggestions = Object.values(consolidatedSuggestions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    
    setSuggestions(finalSuggestions);
  }, [searchQuery, plaqueData]);
  
  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      }
      setIsSearchFocused(false);
    }
  };
  
  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    
    const params = new URLSearchParams();
    
    if (suggestion.type === 'person') {
      params.append('search', suggestion.text);
    } else if (suggestion.type === 'location') {
      params.append('search', suggestion.text);
    } else if (suggestion.type === 'profession') {
      params.append('professions', suggestion.text);
    }
    
    navigate(`/discover?${params.toString()}`);
    setIsSearchFocused(false);
  };
  
  // Get popular suggestions when no search query
  const getPopularSuggestions = (): SearchSuggestion[] => {
    const popularNames = [
      { text: 'Charles Dickens', type: 'person', profession: 'Author' },
      { text: 'Winston Churchill', type: 'person', profession: 'Statesman' },
      { text: 'Ada Lovelace', type: 'person', profession: 'Mathematician' },
      { text: 'Kensington', type: 'location' },
      { text: 'Bloomsbury', type: 'location' },
      { text: 'Westminster', type: 'location' },
      { text: 'Scientist', type: 'profession' },
      { text: 'Author', type: 'profession' },
    ];
    
    return popularNames.map((item, index) => ({
      id: -1 * (index + 1), // Negative IDs for popular suggestions
      text: item.text,
      type: item.type as 'person' | 'location' | 'profession',
      profession: (item as any).profession,
      count: 0
    }));
  };
  
  // Determine which suggestions to show
  const displaySuggestions = searchQuery.length >= 2 
    ? suggestions 
    : getPopularSuggestions();
  
  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, location, or profession..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsSearchFocused(true)}
          ref={searchInputRef}
          className="w-full px-12 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={loading}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <Button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </div>
      
      {/* Search suggestions dropdown */}
      {isSearchFocused && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-100 divide-y overflow-hidden"
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading suggestions...</p>
            </div>
          ) : displaySuggestions.length > 0 ? (
            displaySuggestions.map((suggestion, index) => (
              <div 
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                className="p-3 flex items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                  suggestion.type === 'person' ? 'bg-amber-100 text-amber-600' :
                  suggestion.type === 'location' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                )}>
                  {suggestion.type === 'person' ? <Users size={16} /> : 
                   suggestion.type === 'location' ? <MapPin size={16} /> : 
                   <Tag size={16} />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{suggestion.text}</div>
                  <div className="text-xs text-gray-500">
                    {suggestion.type === 'person' ? (
                      <span>{suggestion.profession}</span>
                    ) : suggestion.type === 'location' ? (
                      <span>Location</span>
                    ) : (
                      <span>Profession</span>
                    )}
                    {suggestion.count > 0 && (
                      <span className="ml-1">• {suggestion.count} {suggestion.count === 1 ? 'plaque' : 'plaques'}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No suggestions found</p>
              <p className="text-xs text-gray-400">Try a different search term</p>
            </div>
          ) : (
            <div className="p-3 text-center">
              <p className="text-sm text-gray-500">Type to search for plaques</p>
              <p className="text-xs text-gray-400">Popular: author, scientist, Westminster</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;