// src/components/maps/features/Search/SearchBar.tsx - FIXED: Proper sizing and z-index
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building, Mail, Target } from 'lucide-react';
import { MobileInput } from '@/components/ui/mobile-input';
import { Badge } from '@/components/ui/badge';
import { useSearch } from './useSearch';
import { Plaque } from '@/types/plaque';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';

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
  // Mobile detection and responsive setup
  const mobile = isMobile();
  const safeArea = useSafeArea();
  
  // State management
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
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    
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
  
  const handleClear = () => {
    if (mobile) {
      triggerHapticFeedback('light');
    }
    onChange('');
    setShowResults(false);
  };
  
  const getResultIcon = (result: any) => {
    const iconSize = 16; // Fixed size for consistency
    switch (result.type) {
      case 'plaque':
        return <Building className="text-blue-500" size={iconSize} />;
      case 'postcode':
        return <Mail className="text-purple-500" size={iconSize} />;
      case 'area':
        return <Target className="text-green-500" size={iconSize} />;
      default:
        return <MapPin className="text-orange-500" size={iconSize} />;
    }
  };
  
  const getResultBadge = (result: any) => {
    const badgeClass = "text-xs px-2 py-0.5";
    switch (result.type) {
      case 'postcode':
        return <Badge variant="secondary" className={badgeClass}>Postcode</Badge>;
      case 'area':
        return <Badge variant="outline" className={badgeClass}>Area</Badge>;
      case 'plaque':
        return <Badge variant="default" className={badgeClass}>Plaque</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full max-w-md mx-auto"
    >
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={18}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && setShowResults(true)}
          placeholder={mobile ? "Search plaques..." : "Search plaques, postcodes, areas..."}
          className={`
            w-full pl-10 pr-10 
            ${mobile ? 'h-12 text-base' : 'h-10 text-sm'} 
            bg-white text-black border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            shadow-sm
          `}
          style={{
            fontSize: mobile ? '16px' : '14px' // Prevent zoom on iOS
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={18} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {/* Results Dropdown - FIXED: Higher z-index */}
      {showResults && results.length > 0 && (
        <div 
          className={`
            absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border 
            max-h-80 overflow-y-auto z-[2000]
          `}
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`
                w-full px-4 py-3 hover:bg-gray-50 active:bg-gray-100
                flex items-start gap-3 text-left border-b border-gray-100 
                last:border-b-0 transition-colors
              `}
              style={{
                touchAction: 'manipulation'
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getResultIcon(result)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-sm truncate">
                    {result.title}
                  </div>
                  {getResultBadge(result)}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {result.subtitle}
                </div>
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