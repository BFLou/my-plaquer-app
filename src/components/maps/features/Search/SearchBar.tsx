// src/components/maps/features/Search/SearchBar.tsx - COMPLETE MOBILE OPTIMIZED
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
    const iconSize = mobile ? 18 : 16;
    switch (result.type) {
      case 'plaque':
        return React.createElement(Building, { className: "text-blue-500", size: iconSize });
      case 'postcode':
        return React.createElement(Mail, { className: "text-purple-500", size: iconSize });
      case 'area':
        return React.createElement(Target, { className: "text-green-500", size: iconSize });
      default:
        return React.createElement(MapPin, { className: "text-orange-500", size: iconSize });
    }
  };
  
  const getResultBadge = (result: any) => {
    const badgeClass = mobile ? "text-sm px-2 py-1" : "text-xs";
    switch (result.type) {
      case 'postcode':
        return React.createElement(Badge, { variant: "secondary", className: badgeClass }, "Postcode");
      case 'area':
        return React.createElement(Badge, { variant: "outline", className: badgeClass }, "Area");
      case 'plaque':
        return React.createElement(Badge, { variant: "default", className: badgeClass }, "Plaque");
      default:
        return null;
    }
  };
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full"
      style={{
        paddingLeft: mobile ? safeArea.left : undefined,
        paddingRight: mobile ? safeArea.right : undefined
      }}
    >
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={mobile ? 22 : 20} 
        />
        <MobileInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && setShowResults(true)}
          placeholder={mobile ? "Search plaques, areas..." : "Search plaques, postcodes, or London areas..."}
          className={`pl-${mobile ? '12' : '10'} pr-${mobile ? '12' : '10'} ${mobile ? 'h-14 text-lg' : 'h-12 text-base'} bg-white text-black border border-gray-300 focus:ring-2 focus:ring-blue-500`}
          preventZoom={true}
        />
        {value && (
          <button
            onClick={handleClear}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${mobile ? 'p-2' : 'p-1'}`}
            style={{ minHeight: mobile ? '44px' : 'auto', minWidth: mobile ? '44px' : 'auto' }}
          >
            <X size={mobile ? 22 : 20} />
          </button>
        )}
        {isSearching && (
          <div className={`absolute ${mobile ? 'right-14' : 'right-10'} top-1/2 -translate-y-1/2`}>
            <div className={`animate-spin rounded-full ${mobile ? 'h-5 w-5' : 'h-4 w-4'} border-b-2 border-blue-500`}></div>
          </div>
        )}
      </div>
      
      {/* Results Dropdown - Mobile optimized */}
      {showResults && results.length > 0 && (
        <div 
          className={`absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border ${mobile ? 'max-h-80' : 'max-h-80'} overflow-y-auto z-50`}
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full ${mobile ? 'px-5 py-4' : 'px-4 py-3'} hover:bg-gray-50 flex items-start gap-3 text-left border-b border-gray-100 last:border-b-0 ${mobile ? 'active:bg-gray-100' : ''}`}
              style={{
                minHeight: mobile ? '64px' : '48px',
                touchAction: 'manipulation'
              }}
            >
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(result)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`font-medium ${mobile ? 'text-base' : 'text-sm'} truncate`}>
                    {result.title}
                  </div>
                  {getResultBadge(result)}
                </div>
                <div className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 truncate`}>
                  {result.subtitle}
                </div>
                {result.type !== 'plaque' && (
                  <div className={`${mobile ? 'text-sm' : 'text-xs'} text-blue-600 mt-1`}>
                    Click to search plaques in this area
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .search-bar-container {
            padding: 0.5rem;
          }
          
          .search-bar-input {
            font-size: 16px !important; /* Prevent zoom on iOS */
            line-height: 1.5;
          }
          
          .search-results {
            max-height: 60vh;
            border-radius: 0.75rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          
          .search-result-item {
            transition: background-color 0.15s ease;
          }
          
          .search-result-item:active {
            background-color: #f3f4f6;
            transform: scale(0.99);
          }
          
          .search-clear-button {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Touch optimization */
        .search-bar {
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
        }
        
        .search-results {
          -webkit-overflow-scrolling: touch;
        }
        
        .search-result-item {
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
          -webkit-touch-callout: none;
          user-select: none;
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          .search-result-item {
            transition: none;
          }
          
          .search-result-item:active {
            transform: none;
          }
          
          .loading-spinner {
            animation: none;
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .search-bar-input {
            border: 2px solid #000;
          }
          
          .search-results {
            border: 2px solid #000;
          }
          
          .search-result-item {
            border-bottom: 1px solid #000;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .search-results {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .search-result-item {
            border-color: #374151;
          }
          
          .search-result-item:hover {
            background-color: #374151;
          }
          
          .search-result-item:active {
            background-color: #4b5563;
          }
          
          .search-result-title {
            color: #f9fafb;
          }
          
          .search-result-subtitle {
            color: #d1d5db;
          }
        }
        
        /* Loading animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        /* Result type indicators */
        .result-badge-plaque {
          background-color: #3b82f6;
          color: white;
        }
        
        .result-badge-postcode {
          background-color: #a855f7;
          color: white;
        }
        
        .result-badge-area {
          background-color: #10b981;
          color: white;
        }
        
        /* Input focus styles */
        .search-bar-input:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
          outline: none;
        }
        
        /* Smooth scrolling for results */
        .search-results {
          scroll-behavior: smooth;
        }
        
        /* Result highlighting on hover/active */
        .search-result-item:hover .result-icon {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        
        .search-result-item:active .result-icon {
          transform: scale(1.05);
        }
        
        /* Responsive font scaling */
        @media (max-width: 480px) {
          .search-bar-input {
            font-size: 17px !important; /* Slightly larger on very small screens */
          }
          
          .search-result-title {
            font-size: 1rem;
          }
          
          .search-result-subtitle {
            font-size: 0.875rem;
          }
          
          .search-result-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
        }
        
        /* Performance optimizations */
        .search-results {
          will-change: scroll-position;
          transform: translateZ(0);
        }
        
        .search-result-item {
          will-change: background-color, transform;
          transform: translateZ(0);
        }
        
        /* Safe area handling for notched devices */
        @supports (padding: max(0px)) {
          .search-bar-container {
            padding-left: max(0.5rem, env(safe-area-inset-left));
            padding-right: max(0.5rem, env(safe-area-inset-right));
          }
        }
      `}</style>
    </div>
  );
};