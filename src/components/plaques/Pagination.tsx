// src/components/plaques/Pagination.tsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
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

  // Get visible page numbers based on screen size
  const getVisiblePages = () => {
    const maxVisible = isMobile ? 3 : 5;
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - Math.floor((maxVisible - 3) / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 3);
      
      // Adjust start if end is at the limit
      if (end === totalPages - 1) {
        start = Math.max(2, end - (maxVisible - 3));
      }
      
      // Add ellipsis before middle pages if needed
      if (start > 2) {
        pages.push('ellipsis');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always show last page (unless it's already included)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Mobile compact view
  if (isMobile && compact) {
    return (
      <div 
        className={cn("flex items-center justify-center gap-4 my-6", className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
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
          <span className="text-sm font-medium text-gray-700">
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
    );
  }

  // Full pagination view
  return (
    <div 
      className={cn("flex items-center justify-center gap-2 my-6 overflow-x-auto pb-2", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
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
        <ChevronLeft className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
      </MobileButton>
      
      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1 overflow-x-auto">
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
                  isMobile ? "w-11 h-11 text-base" : "w-10 h-10 text-sm",
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
                  isMobile ? "h-5 w-5" : "h-4 w-4"
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
        <ChevronRight className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
      </MobileButton>
      
      {/* Mobile page indicator */}
      {isMobile && (
        <div className="ml-4 text-sm text-gray-500 shrink-0">
          {currentPage}/{totalPages}
        </div>
      )}
    </div>
  );
};

export default Pagination;