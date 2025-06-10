// src/components/collections/AddPlaquesModal.tsx - MOBILE OPTIMIZED
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileInput } from "@/components/ui/mobile-input";
import { Search, Check, X, Plus, MapPin, Loader, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import PlaqueImage from '../plaques/PlaqueImage';
import plaqueData from '../../data/plaque_data.json';
import { adaptPlaquesData, RawPlaqueData } from '@/utils/plaqueAdapter';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { useSafeArea } from '@/hooks/useSafeArea';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

interface AddPlaquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaques: (plaqueIds: number[]) => Promise<void>;
  availablePlaques?: Plaque[];
  isLoading?: boolean;
  existingPlaqueIds?: number[];
}

const ITEMS_PER_PAGE = 20;

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
  existingPlaqueIds = []
}) => {
  // Mobile detection and responsive hooks
  const mobile = isMobile();
  const { isKeyboardOpen, keyboardHeight } = useKeyboardDetection();
  const safeArea = useSafeArea();
  
  // State management - FIXED: Proper totalCount state declaration
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaqueIds, setSelectedPlaqueIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Plaque[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [, setTotalCount] = useState(0); // totalCount not used in display, only for internal tracking
  const [activeTab, setActiveTab] = useState('search');
  const [selectedPlaques, setSelectedPlaques] = useState<Plaque[]>([]);
  
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
  
  // Handle search when input changes
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      handleSearch();
    } else if (debouncedSearchQuery.trim() === '') {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [debouncedSearchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      let results: Plaque[] = [];
      
      if (propAvailablePlaques && propAvailablePlaques.length > 0) {
        results = propAvailablePlaques.filter(plaque => searchInPlaque(plaque, searchQuery));
      } else {
        const query = searchQuery.toLowerCase();
        const chunkSize = 500;
        let processedResults: Plaque[] = [];
        
        // FIXED: Ensure plaqueData is treated as an array
        const dataArray = Array.isArray(plaqueData) ? plaqueData : [];
        
for (let i = 0; i < dataArray.length; i += chunkSize) {
  const chunk = dataArray.slice(i, i + chunkSize);
  // Type assertion to ensure chunk is treated as RawPlaqueData[]
  const adaptedChunk = adaptPlaquesData(chunk as RawPlaqueData[]);
  const chunkResults = adaptedChunk.filter(plaque => searchInPlaque(plaque, query));
  processedResults = [...processedResults, ...chunkResults];
  
  if (processedResults.length >= 100) {
    break;
  }
  
  if (i + chunkSize < dataArray.length) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
        
        results = processedResults;
      }
      
      setSearchResults(results);
      setTotalCount(results.length); // FIXED: Now totalCount exists
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching plaques:", error);
      toast.error("Failed to search plaques");
    } finally {
      setIsSearching(false);
    }
  };
  
  // FIXED: Removed unused 'key' variable and proper typing
  const searchInPlaque = (plaque: Plaque, query: string): boolean => {
    const searchText = query.toLowerCase();
    
    for (const [, value] of Object.entries(plaque)) {
      if (typeof value !== 'string' || !value) continue;
      
      if (value.toLowerCase().includes(searchText)) {
        return true;
      }
    }
    
    return false;
  };
  
  // FIXED: Proper event parameter typing
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const isLoading = propIsLoading || isSearching;
  
  const getCurrentPagePlaques = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchResults, currentPage]);
  
  const currentPlaques = getCurrentPagePlaques();
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  
  const isPlaqueInCollection = (plaqueId: number): boolean => {
    return existingPlaqueIds.includes(plaqueId);
  };
  
  const togglePlaque = (plaque: Plaque) => {
    if (isPlaqueInCollection(plaque.id)) {
      toast.info(`${plaque.title} is already in this collection`);
      return;
    }
    
    // Add haptic feedback for mobile
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    
    const plaqueId = plaque.id;
    
    if (selectedPlaqueIds.includes(plaqueId)) {
      setSelectedPlaqueIds(prev => prev.filter(id => id !== plaqueId));
      setSelectedPlaques(prev => prev.filter(p => p.id !== plaqueId));
    } else {
      setSelectedPlaqueIds(prev => [...prev, plaqueId]);
      setSelectedPlaques(prev => [...prev, plaque]);
    }
  };
  
  const handleAddPlaques = async () => {
    if (selectedPlaqueIds.length === 0) {
      toast.error('Please select at least one plaque to add');
      return;
    }
    
    if (mobile) {
      triggerHapticFeedback('success');
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
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };
  
  const removeFromSelection = (plaqueId: number) => {
    if (mobile) {
      triggerHapticFeedback('light');
    }
    setSelectedPlaqueIds(prev => prev.filter(id => id !== plaqueId));
    setSelectedPlaques(prev => prev.filter(p => p.id !== plaqueId));
  };
  
  const clearAllSelections = () => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    setSelectedPlaqueIds([]);
    setSelectedPlaques([]);
  };
  
  // Calculate responsive dimensions
  const modalHeight = mobile 
    ? isKeyboardOpen 
      ? `${window.innerHeight - keyboardHeight - safeArea.top - 20}px`
      : '90vh'
    : '85vh';
    
  const modalWidth = mobile ? '95vw' : 'min(90vw, 600px)';
  
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
        } transition-colors ${isAlreadyInCollection ? 'cursor-default' : 'cursor-pointer'} ${
          mobile ? 'active:bg-gray-100' : ''
        }`}
        onClick={() => !isInSelectedView && !isAlreadyInCollection && togglePlaque(plaque)}
      >
        <div className={`flex items-center ${mobile ? 'p-4' : 'p-3'}`}>
          {/* Plaque image */}
          <div className={`${mobile ? 'w-16 h-16' : 'w-12 h-12'} rounded overflow-hidden flex-shrink-0 bg-gray-100`}>
            <PlaqueImage
              src={plaque.image || plaque.main_photo}
              alt={plaque.title}
              className="w-full h-full object-cover"
              plaqueColor={plaque.color}
            />
          </div>
          
          {/* Content */}
          <div className="ml-3 overflow-hidden pr-3 flex-grow min-w-0">
            <h4 className={`font-medium ${mobile ? 'text-base' : 'text-sm'} line-clamp-2`}>
              {plaque.title}
            </h4>
            
            <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 line-clamp-2`}>
              {plaque.location || plaque.address}
            </p>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {plaque.color && (
                <Badge variant="outline" className={`${mobile ? 'text-xs' : 'text-xs'} py-0`}>
                  {plaque.color}
                </Badge>
              )}
              {plaque.profession && (
                <Badge variant="outline" className={`${mobile ? 'text-xs' : 'text-xs'} py-0`}>
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
          
          {/* Selection indicator */}
          <div className="flex-shrink-0 ml-1" style={{ width: mobile ? '32px' : '24px' }}>
            {isInSelectedView ? (
              <MobileButton 
                variant="ghost" 
                size="sm" 
                className={`${mobile ? 'h-8 w-8' : 'h-6 w-6'} p-0 text-red-500 hover:text-red-700 hover:bg-red-50`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  removeFromSelection(plaque.id);
                }}
              >
                <X size={mobile ? 18 : 16} />
              </MobileButton>
            ) : isAlreadyInCollection ? (
              <div className={`${mobile ? 'w-8 h-8' : 'w-6 h-6'} rounded-full flex items-center justify-center bg-green-100 text-green-600 border border-green-300`}>
                <CheckCircle size={mobile ? 16 : 14} />
              </div>
            ) : (
              <div className={`${mobile ? 'w-8 h-8' : 'w-6 h-6'} rounded-full flex items-center justify-center`}
                  style={{ 
                    border: isSelected ? 'none' : '1px solid #d1d5db',
                    backgroundColor: isSelected ? '#3b82f6' : 'transparent'
                  }}>
                {isSelected && <Check size={mobile ? 16 : 14} className="text-white" />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 overflow-hidden"
        style={{
          width: modalWidth,
          height: modalHeight,
          maxHeight: modalHeight,
          paddingTop: mobile ? safeArea.top : undefined,
          paddingBottom: mobile ? Math.max(safeArea.bottom, 20) : undefined
        }}
      >
        {/* Fixed height structure */}
        <div className="flex flex-col h-full">
          {/* Fixed header section */}
          <div className={`${mobile ? 'p-4' : 'p-6'} pb-2`}>
            <DialogHeader>
              <DialogTitle className={mobile ? 'text-lg' : 'text-xl'}>
                Add Plaques to Collection
              </DialogTitle>
            </DialogHeader>
            
            <div className={`mt-2 ${mobile ? 'text-sm' : 'text-sm'} text-gray-500 bg-blue-50 p-4 rounded-md border border-blue-100`}>
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
                  <MobileInput
                    placeholder="Search plaques by any text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-9 pr-9"
                    preventZoom={true}
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
                <MobileButton
                  variant="outline"
                  size="sm"
                  onClick={clearAllSelections}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X size={14} className="mr-1" />
                  Clear All
                </MobileButton>
              </div>
            )}
            
            {/* Status bar with counts and pagination info */}
            {activeTab === 'search' && searchResults.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">
                  {`Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, searchResults.length)} of ${searchResults.length} plaques`}
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </div>
              </div>
            )}
          </div>
          
          {/* Scrollable content area */}
          <div className={`${mobile ? 'p-4' : 'p-6'} pt-2 pb-0 flex-grow overflow-hidden`}>
            <div 
              className="border-t pt-2 h-full overflow-y-auto pr-2"
              style={{
                maxHeight: isKeyboardOpen ? '30vh' : 'calc(100% - 100px)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
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
                      <MobileButton 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSearch}
                      >
                        Clear Search
                      </MobileButton>
                    </div>
                  ) : (
                    <>
                      {searchResults.length >= 100 && (
                        <div className="mb-3 text-xs flex gap-2 items-center bg-amber-50 p-2 rounded-md border border-amber-200">
                          <Info size={14} className="text-amber-500 flex-shrink-0" />
                          <span>Showing up to 100 matching plaques. Refine your search to see more specific results.</span>
                        </div>
                      )}
                      
                      <div className={`space-y-${mobile ? '3' : '2'}`}>
                        {currentPlaques.map(plaque => renderPlaqueItem(plaque))}
                      </div>
                      
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-4 gap-2 pb-4">
                          <MobileButton
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </MobileButton>
                          <MobileButton
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </MobileButton>
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
                        <MobileButton
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('search')}
                        >
                          <Search size={14} className="mr-1" />
                          Search Plaques
                        </MobileButton>
                      </div>
                    </div>
                  ) : (
                    <div className={`space-y-${mobile ? '3' : '2'}`}>
                      {selectedPlaques.map(plaque => renderPlaqueItem(plaque, true))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Fixed footer with action buttons */}
          <div 
            className={`${mobile ? 'p-4' : 'p-6'} border-t mt-2 bg-white`}
            style={{
              paddingBottom: mobile ? Math.max(safeArea.bottom + 10, 20) : undefined
            }}
          >
            <div className="flex items-center justify-end gap-2">
              <MobileButton variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </MobileButton>
              <MobileButton 
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
              </MobileButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaquesModal;