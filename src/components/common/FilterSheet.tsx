import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type FilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export const FilterSheet = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = "Filters",
  description = "Refine your search",
  children,
  className = ''
}: FilterSheetProps) => {
  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="left" className={`w-full sm:max-w-md ${className}`}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          {children}
        </div>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" onClick={onReset}>Reset</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button onClick={onApply}>Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;