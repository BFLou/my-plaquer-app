// src/components/plaques/Pagination.tsx - Fixed for 300+ pages without horizontal scrolling
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
import { MobileInput } from '@/components/ui/mobile-input';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { cn } from '@/lib/utils';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  compact?: boolean;
};

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = '',
  showPageNumbers = true,
  compact = false
}: PaginationProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showJumpInput, setShowJumpInput] = useState(false);
  const [jumpValue, setJumpValue] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Swipe gesture for mobile navigation
  const { handleTouchStart, handleTouchEnd, handleTouchMove } = useSwipeGesture({
    onSwipe: (direction) => {
      if (direction === 'left' && currentPage < totalPages) {
        triggerHapticFeedback('selection');
        goToPage(currentPage + 1);
      } else if (direction === 'right' && currentPage > 1) {
        triggerHapticFeedback('selection');
        goToPage(currentPage - 1);
      }
    },
    threshold: 50
  });

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      triggerHapticFeedback('selection');
      onPageChange(page);
      // Scroll to top when changing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
      setShowJumpInput(false);
      setJumpValue('');
    }
  };

  const handleJumpInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    } else if (e.key === 'Escape') {
      setShowJumpInput(false);
      setJumpValue('');
    }
  };

  // Smart page calculation that works for 300+ pages without horizontal scrolling
  const getVisiblePages = () => {
    // For mobile, show fewer pages to prevent overflow
    const maxVisible = isMobile ? 3 : 5;
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);
    
    // Calculate the range around current page
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(2, currentPage - halfVisible + 1);
    let end = Math.min(totalPages - 1, currentPage + halfVisible - 1);
    
    // Adjust range to always show maxVisible pages when possible
    if (end - start + 1 < maxVisible - 2) {
      if (start === 2) {
        end = Math.min(totalPages - 1, start + maxVisible - 3);
      } else if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisible + 3);
      }
    }
    
    // Add ellipsis and pages
    if (start > 2) {
      pages.push('ellipsis');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Mobile compact view - optimized for 300+ pages
  if (isMobile && compact) {
    return (
      <div 
        className={cn("flex flex-col items-center gap-3 my-6", className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <MobileButton
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            touchOptimized={true}
            className="px-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </MobileButton>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <MobileButton
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            touchOptimized={true}
            className="px-3"
          >
            <ChevronRight className="h-5 w-5" />
          </MobileButton>
        </div>

        {/* Jump to page for large page counts */}
        {totalPages > 20 && (
          <div className="flex items-center gap-2">
            {!showJumpInput ? (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={() => setShowJumpInput(true)}
                className="text-xs"
              >
                Jump to page
              </MobileButton>
            ) : (
              <div className="flex items-center gap-2">
                <MobileInput
                  type="number"
                  placeholder="Page"
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={handleJumpInputKeyDown}
                  className="w-20 h-8 text-center text-sm"
                  min="1"
                  max={totalPages}
                />
                <MobileButton
                  variant="outline"
                  size="sm"
                  onClick={handleJumpToPage}
                  className="h-8 px-2 text-xs"
                >
                  Go
                </MobileButton>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowJumpInput(false);
                    setJumpValue('');
                  }}
                  className="h-8 px-2 text-xs"
                >
                  Cancel
                </MobileButton>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full pagination view - NO horizontal scrolling, handles 300+ pages
  return (
    <div 
      className={cn("flex flex-col items-center gap-3 my-6", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Main pagination controls */}
      <div className="flex items-center justify-center gap-1 flex-wrap max-w-full">
        {/* First page button (for large page counts) */}
        {totalPages > 10 && currentPage > 5 && (
          <MobileButton
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            onClick={() => goToPage(1)}
            touchOptimized={true}
            className={cn(
              "shrink-0",
              isMobile ? "w-11 h-11" : "w-10 h-10"
            )}
            title="First page"
          >
            <ChevronsLeft className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
          </MobileButton>
        )}

        {/* Previous button */}
        <MobileButton
          variant="outline"
          size={isMobile ? "sm" : "sm"}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          touchOptimized={true}
          className={cn(
            "shrink-0",
            isMobile ? "w-11 h-11" : "w-10 h-10"
          )}
        >
          <ChevronLeft className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
        </MobileButton>
        
        {/* Page numbers - FIXED: No horizontal scrolling */}
        {showPageNumbers && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {visiblePages.map((page, index) => (
              typeof page === 'number' ? (
                <MobileButton
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size={isMobile ? "sm" : "sm"}
                  onClick={() => goToPage(page)}
                  touchOptimized={true}
                  className={cn(
                    "shrink-0",
                    isMobile ? "w-11 h-11 text-sm" : "w-10 h-10 text-xs",
                    currentPage === page && "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {page}
                </MobileButton>
              ) : (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-center justify-center shrink-0",
                    isMobile ? "w-11 h-11" : "w-10 h-10"
                  )}
                >
                  <MoreHorizontal className={cn(
                    "text-gray-400",
                    isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
                  )} />
                </div>
              )
            ))}
          </div>
        )}
        
        {/* Next button */}
        <MobileButton
          variant="outline"
          size={isMobile ? "sm" : "sm"}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          touchOptimized={true}
          className={cn(
            "shrink-0",
            isMobile ? "w-11 h-11" : "w-10 h-10"
          )}
        >
          <ChevronRight className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
        </MobileButton>

        {/* Last page button (for large page counts) */}
        {totalPages > 10 && currentPage < totalPages - 4 && (
          <MobileButton
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            onClick={() => goToPage(totalPages)}
            touchOptimized={true}
            className={cn(
              "shrink-0",
              isMobile ? "w-11 h-11" : "w-10 h-10"
            )}
            title="Last page"
          >
            <ChevronsRight className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
          </MobileButton>
        )}
      </div>

      {/* Page info and jump controls for large page counts */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        
        {/* Jump to page input for 300+ pages */}
        {totalPages > 20 && (
          <div className="flex items-center gap-2">
            {!showJumpInput ? (
              <button
                onClick={() => setShowJumpInput(true)}
                className="text-blue-600 hover:underline text-xs font-medium"
              >
                Jump to page
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs">Go to:</span>
                <MobileInput
                  type="number"
                  placeholder="Page"
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={handleJumpInputKeyDown}
                  className="w-16 h-8 text-center text-xs"
                  min="1"
                  max={totalPages}
                />
                <MobileButton
                  variant="outline"
                  size="sm"
                  onClick={handleJumpToPage}
                  className="h-8 px-2 text-xs"
                >
                  Go
                </MobileButton>
                <button
                  onClick={() => {
                    setShowJumpInput(false);
                    setJumpValue('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;