// src/components/collections/AddPlaquesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X, Plus, MapPin, Loader, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import PlaqueImage from '../plaques/PlaqueImage';
import plaqueData from '../../data/plaque_data.json';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

interface AddPlaquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaques: (plaqueIds: number[]) => Promise<void>;
  availablePlaques?: Plaque[];
  isLoading?: boolean;
}

// Number of items to show per page
const ITEMS_PER_PAGE = 20;

const AddPlaquesModal: React.FC<AddPlaquesModalProps> = ({
  isOpen,
  onClose,
  onAddPlaques,
  availablePlaques: propAvailablePlaques,
  isLoading: propIsLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaqueIds, setSelectedPlaqueIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Plaque[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaqueIds([]);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentPage(1);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Handle search when button is clicked or Enter is pressed
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
  
  // Toggle selection of a plaque
  const togglePlaque = (plaqueId: number) => {
    setSelectedPlaqueIds(prev =>
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Plaques to Collection</DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 text-sm text-gray-500 bg-blue-50 p-4 rounded-md border border-blue-100">
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <span>You can also add plaques directly from the <strong>Discover</strong> page when browsing the map or list view.</span>
          </p>
        </div>
        
        <div className="flex justify-between items-center mt-4 mb-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search plaques by any text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pl-9 pr-3"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                  setCurrentPage(1);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="ml-2"
          >
            {isSearching ? (
              <>
                <Loader size={14} className="mr-1 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={14} className="mr-1" />
                Search
              </>
            )}
          </Button>
        </div>
        
        {selectedPlaqueIds.length > 0 && (
          <div className="flex justify-end">
            <Badge variant="secondary">
              {selectedPlaqueIds.length} selected
            </Badge>
          </div>
        )}
        
        {/* Status bar with counts and pagination info */}
        {searchResults.length > 0 && (
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <div>
              Showing {searchResults.length > 0 ? 
                `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, searchResults.length)} of ${searchResults.length}` : 
                '0'} plaques
            </div>
            {totalPages > 1 && (
              <div>
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        )}
        
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
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] mt-2 pr-2">
            {searchResults.length >= 100 && (
              <div className="mb-3 text-xs flex gap-2 items-center bg-amber-50 p-2 rounded-md border border-amber-200">
                <Info size={14} className="text-amber-500" />
                <span>Showing up to 100 matching plaques. Refine your search to see more specific results.</span>
              </div>
            )}
            
            <div className="space-y-2">
              {currentPlaques.map(plaque => (
                <div
                  key={plaque.id}
                  className={`border rounded-lg overflow-hidden ${
                    selectedPlaqueIds.includes(plaque.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-colors cursor-pointer`}
                  onClick={() => togglePlaque(plaque.id)}
                >
                  <div className="flex items-center p-3">
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      <PlaqueImage
                        src={plaque.image || plaque.main_photo}
                        alt={plaque.title}
                        className="w-full h-full object-cover"
                        plaqueColor={plaque.color}
                      />
                    </div>
                    
                    <div className="ml-3 flex-grow">
                      <h4 className="font-medium text-sm">{plaque.title}</h4>
                      <p className="text-xs text-gray-500">{plaque.location || plaque.address}</p>
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
                      </div>
                    </div>
                    
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                      selectedPlaqueIds.includes(plaque.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlaqueIds.includes(plaque.id) && <Check size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
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
          </div>
        )}
        
        <DialogFooter className="mt-4">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaquesModal;