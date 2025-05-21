// src/components/collections/AddPlaquesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X, Plus, MapPin, Loader, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import PlaqueImage from '../plaques/PlaqueImage';
import plaqueData from '../../data/plaque_data.json';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddPlaquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaques: (plaqueIds: number[]) => Promise<void>;
  availablePlaques?: Plaque[];
  isLoading?: boolean;
  existingPlaqueIds?: number[]; // Add this prop to track existing plaques
}

// Number of items to show per page
const ITEMS_PER_PAGE = 20;

// Debounce function to prevent excessive searches
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const AddPlaquesModal: React.FC<AddPlaquesModalProps> = ({
  isOpen,
  onClose,
  onAddPlaques,
  availablePlaques: propAvailablePlaques,
  isLoading: propIsLoading = false,
  existingPlaqueIds = [] // Default to empty array if not provided
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaqueIds, setSelectedPlaqueIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Plaque[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'selected'
  const [selectedPlaques, setSelectedPlaques] = useState<Plaque[]>([]); // Full plaque objects that are selected
  
  // Debounced search query to trigger searches while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaqueIds([]);
      setSelectedPlaques([]);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentPage(1);
      setHasSearched(false);
      setActiveTab('search');
    }
  }, [isOpen]);
  
  // Handle search when input changes (via debounced value)
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      handleSearch();
    } else if (debouncedSearchQuery.trim() === '') {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [debouncedSearchQuery]);

  // Handle search 
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Allow UI to update first
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Use either provided plaques or search in the JSON data
      let results: Plaque[] = [];
      
      if (propAvailablePlaques && propAvailablePlaques.length > 0) {
        // Filter the provided plaques
        results = propAvailablePlaques.filter(plaque => searchInPlaque(plaque, searchQuery));
      } else {
        // Search in all plaques from the data file
        const query = searchQuery.toLowerCase();
        
        // Process data in a more efficient way
        // Process data in smaller chunks to prevent UI freezing
        const chunkSize = 500;
        let processedResults: Plaque[] = [];
        
        for (let i = 0; i < plaqueData.length; i += chunkSize) {
          // Process a chunk
          const chunk = plaqueData.slice(i, i + chunkSize);
          const adaptedChunk = adaptPlaquesData(chunk);
          
          // Filter the chunk for matches
          const chunkResults = adaptedChunk.filter(plaque => searchInPlaque(plaque, query));
          processedResults = [...processedResults, ...chunkResults];
          
          // If we have enough results, stop processing
          if (processedResults.length >= 100) {
            break;
          }
          
          // Allow UI to update between chunks
          if (i + chunkSize < plaqueData.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        results = processedResults;
      }
      
      setSearchResults(results);
      setTotalCount(results.length);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching plaques:", error);
      toast.error("Failed to search plaques");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Helper function to search all plaque fields
  const searchInPlaque = (plaque: Plaque, query: string): boolean => {
    const searchText = query.toLowerCase();
    
    // Check all text fields for the search query
    for (const [key, value] of Object.entries(plaque)) {
      // Skip non-string and empty values
      if (typeof value !== 'string' || !value) continue;
      
      if (value.toLowerCase().includes(searchText)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Determine loading state
  const isLoading = propIsLoading || isSearching;
  
  // Get current page items
  const getCurrentPagePlaques = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchResults, currentPage]);
  
  // Current page plaques
  const currentPlaques = getCurrentPagePlaques();
  
  // Total pages calculation
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  
  // Check if plaque is already in collection
  const isPlaqueInCollection = (plaqueId: number): boolean => {
    return existingPlaqueIds.includes(plaqueId);
  };
  
  // Toggle selection of a plaque
  const togglePlaque = (plaque: Plaque) => {
    // If plaque is already in collection, don't allow selection
    if (isPlaqueInCollection(plaque.id)) {
      toast.info(`${plaque.title} is already in this collection`);
      return;
    }
    
    const plaqueId = plaque.id;
    
    if (selectedPlaqueIds.includes(plaqueId)) {
      // Remove from selection
      setSelectedPlaqueIds(prev => prev.filter(id => id !== plaqueId));
      setSelectedPlaques(prev => prev.filter(p => p.id !== plaqueId));
    } else {
      // Add to selection
      setSelectedPlaqueIds(prev => [...prev, plaqueId]);
      setSelectedPlaques(prev => [...prev, plaque]);
    }
  };
  
  // Handle adding plaques
  const handleAddPlaques = async () => {
    if (selectedPlaqueIds.length === 0) {
      toast.error('Please select at least one plaque to add');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onAddPlaques(selectedPlaqueIds);
      onClose();
    } catch (error) {
      console.error('Error adding plaques:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Go to next/previous page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Clear search and reset
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };
  
  // Remove a plaque from selection
  const removeFromSelection = (plaqueId: number) => {
    setSelectedPlaqueIds(prev => prev.filter(id => id !== plaqueId));
    setSelectedPlaques(prev => prev.filter(p => p.id !== plaqueId));
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    setSelectedPlaqueIds([]);
    setSelectedPlaques([]);
  };
  
  // Render a plaque item with text wrapping fix
  const renderPlaqueItem = (plaque: Plaque, isInSelectedView = false) => {
    const isSelected = selectedPlaqueIds.includes(plaque.id);
    const isAlreadyInCollection = isPlaqueInCollection(plaque.id);
    
    return (
      <div
        key={plaque.id}
        className={`border rounded-lg overflow-hidden ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : isAlreadyInCollection
              ? 'border-green-200 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
        } transition-colors ${isAlreadyInCollection ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={() => !isInSelectedView && !isAlreadyInCollection && togglePlaque(plaque)}
      >
        <div className="flex items-center p-3">
          {/* Plaque image */}
          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
            <PlaqueImage
              src={plaque.image || plaque.main_photo}
              alt={plaque.title}
              className="w-full h-full object-cover"
              plaqueColor={plaque.color}
            />
          </div>
          
          {/* Content with text wrapping for both title and location */}
          <div className="ml-3 overflow-hidden pr-3" style={{ flexGrow: 1, minWidth: 0, maxWidth: "calc(100% - 60px)" }}>
            {/* Title with line clamping */}
            <h4 className="font-medium text-sm" style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {plaque.title}
            </h4>
            
            {/* Location/address with line clamping instead of truncation */}
            <p className="text-xs text-gray-500" style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {plaque.location || plaque.address}
            </p>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {plaque.color && (
                <Badge variant="outline" className="text-xs py-0">
                  {plaque.color}
                </Badge>
              )}
              {plaque.profession && (
                <Badge variant="outline" className="text-xs py-0">
                  {plaque.profession}
                </Badge>
              )}
              {isAlreadyInCollection && (
                <Badge variant="outline" className="text-xs py-0 bg-green-100 text-green-700 border-green-200">
                  Added
                </Badge>
              )}
            </div>
          </div>
          
          {/* Selection indicator or already-in-collection indicator */}
          <div className="flex-shrink-0 ml-1" style={{ width: '24px' }}>
            {isInSelectedView ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromSelection(plaque.id);
                }}
              >
                <X size={16} />
              </Button>
            ) : isAlreadyInCollection ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 border border-green-300">
                <CheckCircle size={14} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ 
                    border: isSelected ? 'none' : '1px solid #d1d5db',
                    backgroundColor: isSelected ? '#3b82f6' : 'transparent'
                  }}>
                {isSelected && <Check size={14} className="text-white" />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0">
        {/* Fixed height structure */}
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Fixed header section */}
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>Add Plaques to Collection</DialogTitle>
            </DialogHeader>
            
            <div className="mt-2 text-sm text-gray-500 bg-blue-50 p-4 rounded-md border border-blue-100">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                <span>You can also add plaques directly from the <strong>Discover</strong> page when browsing the map or list view.</span>
              </p>
            </div>
            
            {/* Tabs for Search and Selected */}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search" className="flex items-center gap-1">
                    <Search size={14} /> Search
                  </TabsTrigger>
                  <TabsTrigger value="selected" className="flex items-center gap-1">
                    <Check size={14} /> Selected ({selectedPlaqueIds.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {activeTab === 'search' && (
              <div className="flex justify-between items-center mt-4 mb-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search plaques by any text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'selected' && selectedPlaqueIds.length > 0 && (
              <div className="flex justify-between items-center mt-4 mb-2">
                <div className="text-sm">
                  <span className="font-medium">{selectedPlaqueIds.length}</span> plaques selected
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllSelections}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X size={14} className="mr-1" />
                  Clear All
                </Button>
              </div>
            )}
            
            {/* Status bar with counts and pagination info (Search tab only) */}
            {activeTab === 'search' && searchResults.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">
                  {`Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, searchResults.length)} of ${searchResults.length} plaques`}
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </div>
              </div>
            )}
          </div>
          
          {/* Scrollable content area with fixed height */}
          <div className="p-6 pt-2 pb-0 flex-grow overflow-hidden">
            <div className="border-t pt-2 h-full max-h-[calc(85vh-280px)] overflow-y-auto pr-2">
              {activeTab === 'search' && (
                <>
                  {isLoading ? (
                    <div className="flex-grow flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin text-blue-500" size={24} />
                        <p className="text-gray-500 text-sm">Searching plaques...</p>
                      </div>
                    </div>
                  ) : !hasSearched ? (
                    <div className="flex-grow flex items-center justify-center py-8 text-center">
                      <div className="flex flex-col items-center gap-3 max-w-sm">
                        <Search size={32} className="text-gray-300" />
                        <p className="text-gray-500">Search for plaques to add to your collection</p>
                        <p className="text-xs text-gray-400">You can search by title, location, profession, or any other text related to the plaques</p>
                      </div>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No plaques match your search.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSearch}
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <>
                      {searchResults.length >= 100 && (
                        <div className="mb-3 text-xs flex gap-2 items-center bg-amber-50 p-2 rounded-md border border-amber-200">
                          <Info size={14} className="text-amber-500 flex-shrink-0" />
                          <span>Showing up to 100 matching plaques. Refine your search to see more specific results.</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {currentPlaques.map(plaque => renderPlaqueItem(plaque))}
                      </div>
                      
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-4 gap-2 pb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              
              {activeTab === 'selected' && (
                <>
                  {selectedPlaqueIds.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center py-8 text-center">
                      <div className="flex flex-col items-center gap-3 max-w-sm">
                        <Check size={32} className="text-gray-300" />
                        <p className="text-gray-500">No plaques selected yet</p>
                        <p className="text-xs text-gray-400">Switch to the Search tab to find and select plaques to add to your collection</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('search')}
                        >
                          <Search size={14} className="mr-1" />
                          Search Plaques
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlaques.map(plaque => renderPlaqueItem(plaque, true))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Fixed footer with action buttons - always visible */}
          <div className="p-6 border-t mt-2 bg-white">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddPlaques} 
                disabled={selectedPlaqueIds.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Add {selectedPlaqueIds.length > 0 ? selectedPlaqueIds.length : ''} Plaques
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaquesModal;