// src/components/maps/features/search/OverlaySearch.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock, Navigation, Filter } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
import { Badge } from '@/components/ui/badge';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { Plaque } from '@/types/plaque';

interface SearchSuggestion {
  id: string;
  type: 'plaque' | 'location' | 'area' | 'profession';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  data?: any;
}

interface OverlaySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  suggestions: SearchSuggestion[];
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  isVisible: boolean;
  onClose?: () => void;
  placeholder?: string;
  showFiltersButton?: boolean;
  onOpenFilters?: () => void;
  activeFiltersCount?: number;
  className?: string;
}

export const OverlaySearch: React.FC<OverlaySearchProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  suggestions,
  onSuggestionSelect,
  isVisible,
  onClose,
  placeholder = "Search plaques, areas, people...",
  showFiltersButton = true,
  onOpenFilters,
  activeFiltersCount = 0,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeArea = useSafeArea();
  const mobile = isMobile();

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
      if (mobile) triggerHapticFeedback('success');
    }
  }, [searchQuery, onSearch, mobile]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
    if (mobile) triggerHapticFeedback('light');
  }, [mobile]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    if (mobile) triggerHapticFeedback('selection');
  }, [onSuggestionSelect, mobile]);

  // Handle clear search
  const handleClear = useCallback(() => {
    onSearchChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
    if (mobile) triggerHapticFeedback('light');
  }, [onSearchChange, mobile]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Auto-hide suggestions when query is empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowSuggestions(false);
    } else if (isFocused) {
      setShowSuggestions(true);
    }
  }, [searchQuery, isFocused]);

  if (!isVisible) return null;

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.icon) return suggestion.icon;
    
    switch (suggestion.type) {
      case 'plaque':
        return <MapPin size={14} className="text-blue-500" />;
      case 'location':
        return <Navigation size={14} className="text-green-500" />;
      case 'area':
        return <MapPin size={14} className="text-purple-500" />;
      case 'profession':
        return <Clock size={14} className="text-orange-500" />;
      default:
        return <Search size={14} className="text-gray-400" />;
    }
  };

  return (
    <div 
      className={`absolute z-[1001] ${className}`}
      style={{
        top: mobile ? `${12 + safeArea.top}px` : '16px',
        left: mobile ? '12px' : '50%',
        right: mobile ? '12px' : 'auto',
        transform: mobile ? 'none' : 'translateX(-50%)',
        width: mobile ? 'auto' : '400px',
        maxWidth: mobile ? 'none' : 'calc(100vw - 32px)'
      }}
    >
      {/* Main search container */}
      <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center p-3 gap-3">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            style={{
              fontSize: mobile ? '16px' : '15px', // Prevent iOS zoom
              lineHeight: '1.5'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {searchQuery && (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                touchOptimized
              >
                <X size={14} />
              </MobileButton>
            )}

            {showFiltersButton && onOpenFilters && (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={onOpenFilters}
                className={`h-8 w-8 p-0 rounded-full relative ${activeFiltersCount > 0 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                touchOptimized
              >
                <Filter size={14} />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </MobileButton>
            )}

            {onClose && (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 md:hidden"
                touchOptimized
              >
                <X size={14} />
              </MobileButton>
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                onClick={() => handleSuggestionSelect(suggestion)}
                style={{
                  minHeight: mobile ? '52px' : '44px' // Touch-friendly height
                }}
              >
                <div className="flex-shrink-0">
                  {getSuggestionIcon(suggestion)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {suggestion.title}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                
                {suggestion.type && (
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results state */}
        {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
          <div className="border-t border-gray-100 p-4 text-center">
            <div className="text-gray-500 text-sm">
              No results found for "{searchQuery}"
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Try searching for plaque names, locations, or professions
            </div>
          </div>
        )}

        {/* Quick search tips */}
        {showSuggestions && !searchQuery.trim() && (
          <div className="border-t border-gray-100 p-3">
            <div className="text-xs text-gray-500 mb-2 font-medium">Quick searches:</div>
            <div className="flex flex-wrap gap-1">
              {['Writers', 'Scientists', 'Westminster', 'Blue plaques'].map((tip) => (
                <button
                  key={tip}
                  onClick={() => onSearchChange(tip)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing search state
export const useOverlaySearch = (plaques: Plaque[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Generate suggestions based on query
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim() || query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();

    // Search plaques
    plaques.forEach((plaque) => {
      if (suggestions.length >= 8) return; // Limit suggestions
      
      const title = plaque.title?.toLowerCase() || '';
      
      if (title.includes(queryLower) && !seen.has(plaque.title)) {
        seen.add(plaque.title);
        suggestions.push({
          id: `plaque-${plaque.id}`,
          type: 'plaque',
          title: plaque.title,
          subtitle: plaque.location || plaque.address,
          data: plaque
        });
      }
    });

    // Search professions
    const professions = new Set<string>();
    plaques.forEach((plaque) => {
      if (plaque.profession && plaque.profession !== 'Unknown') {
        professions.add(plaque.profession);
      }
    });

    Array.from(professions).forEach((profession) => {
      if (suggestions.length >= 8) return;
      
      if (profession.toLowerCase().includes(queryLower) && !seen.has(profession)) {
        seen.add(profession);
        const count = plaques.filter(p => p.profession === profession).length;
        suggestions.push({
          id: `profession-${profession}`,
          type: 'profession',
          title: profession,
          subtitle: `${count} plaque${count !== 1 ? 's' : ''}`,
          data: { profession }
        });
      }
    });

    return suggestions;
  }, [plaques]);

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchQuery);
    setSuggestions(newSuggestions);
  }, [searchQuery, generateSuggestions]);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    isVisible,
    setIsVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(!isVisible)
  };
};