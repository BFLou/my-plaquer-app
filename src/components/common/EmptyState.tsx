// src/components/common/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
  showSearchIcon?: boolean;
  hasSearch?: boolean;
  hasFilters?: boolean;
  searchTerm?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionButton,
  className = '',
  showSearchIcon = false,
  hasSearch = false,
  hasFilters = false,
  searchTerm = ''
}) => {
  // Auto-generate enhanced visuals if no custom icon provided
  const renderVisual = () => {
    if (icon) {
      return (
        <div className="mb-4 text-6xl opacity-50">
          {icon}
        </div>
      );
    }

    // Enhanced default visual
    return (
      <div className="mb-8">
        <div className="relative w-40 h-40 mx-auto">
          {/* Background gradient circle */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-full"></div>
          
          {/* Main icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
              {showSearchIcon || hasSearch ? (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-2 right-4 w-6 h-6 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-4 left-2 w-4 h-4 bg-purple-500 rounded-full opacity-30 animate-pulse delay-75"></div>
          <div className="absolute top-1/2 right-0 w-3 h-3 bg-pink-500 rounded-full opacity-25 animate-pulse delay-150"></div>
        </div>
      </div>
    );
  };

  // Enhanced description with context
  const renderDescription = () => {
    if (description) {
      return (
        <p className="text-gray-600 mb-8 max-w-lg text-lg leading-relaxed">
          {description}
        </p>
      );
    }

    // Auto-generate contextual description
    if (hasSearch && hasFilters) {
      return (
        <p className="text-gray-600 mb-8 max-w-lg text-lg leading-relaxed">
          {searchTerm 
            ? `No results for "${searchTerm}" with your current filters. Try adjusting your search or filters.`
            : "No results match your search and current filters. Try adjusting them to see more results."
          }
        </p>
      );
    }
    
    if (hasSearch) {
      return (
        <p className="text-gray-600 mb-8 max-w-lg text-lg leading-relaxed">
          {searchTerm 
            ? `No results found for "${searchTerm}". Try different search terms or browse all plaques.`
            : "No results found for your search. Try different search terms or browse all plaques."
          }
        </p>
      );
    }
    
    if (hasFilters) {
      return (
        <p className="text-gray-600 mb-8 max-w-lg text-lg leading-relaxed">
          No plaques match your current filters. Try adjusting your filters to see more results.
        </p>
      );
    }

    return (
      <p className="text-gray-600 mb-8 max-w-lg text-lg leading-relaxed">
        No items are available at the moment.
      </p>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center ${className}`}>
      {/* Visual */}
      {renderVisual()}
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h3>
      
      {/* Description */}
      {renderDescription()}
      
      {/* Action Button */}
      {actionButton && (
        <div className="flex flex-col sm:flex-row gap-4">
          {actionButton}
        </div>
      )}
      
      {/* Search Tips */}
      {hasSearch && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-md">
          <p className="text-sm text-blue-800 font-medium mb-2">💡 Search Tips:</p>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• Try searching for names, professions, or locations</li>
            <li>• Use broader terms like "writer" instead of "novelist"</li>
            <li>• Check your spelling and try different variations</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Make sure to export as default as well
export default EmptyState;