import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      // Scroll to top when changing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Create page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are fewer than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first and last page
      pages.push(1);
      
      // Calculate middle pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pages.push('ellipsis1');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis2');
      }
      
      // Add last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 my-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(page)}
            className="h-8 w-8"
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2">...</span>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;