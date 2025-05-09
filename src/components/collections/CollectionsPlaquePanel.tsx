// src/components/collections/CollectionPlaquesPanel.tsx
import React, { useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plaque } from '@/types/plaque';

interface CollectionPlaquesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  plaques: Plaque[];
  selectedPlaques: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onConfirm: () => void;
  confirmText: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export const CollectionPlaquesPanel: React.FC<CollectionPlaquesPanelProps> = ({
  open,
  onOpenChange,
  title,
  plaques,
  selectedPlaques,
  onToggleSelect,
  onSelectAll,
  onConfirm,
  confirmText,
  emptyMessage = "No plaques available",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter plaques based on search query
  const filteredPlaques = plaques.filter(plaque => 
    searchQuery === '' || 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (plaque.inscription && plaque.inscription.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSelectAll}
              disabled={plaques.length === 0}
            >
              {selectedPlaques.length === plaques.length && plaques.length > 0
                ? "Unselect All"
                : "Select All"}
            </Button>
            
            {selectedPlaques.length > 0 && (
              <Badge variant="secondary">
                {selectedPlaques.length} selected
              </Badge>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search plaques..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto">
            {filteredPlaques.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            ) : (
              filteredPlaques.map(plaque => (
                <div 
                  key={plaque.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                    selectedPlaques.includes(plaque.id) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => onToggleSelect(plaque.id)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100">
                    {plaque.image ? (
                      <img src={plaque.image} alt={plaque.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        plaque.color === 'blue' ? 'bg-blue-100 text-blue-500' :
                        plaque.color === 'green' ? 'bg-green-100 text-green-500' :
                        plaque.color === 'brown' ? 'bg-amber-100 text-amber-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {plaque.color?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-medium">{plaque.title}</h4>
                    <p className="text-sm text-gray-500">{plaque.location || plaque.address || ''}</p>
                    {plaque.profession && (
                      <Badge variant="outline" className="mt-1 text-xs bg-gray-50">
                        {plaque.profession}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPlaques.includes(plaque.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPlaques.includes(plaque.id) && <Check size={12} />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            disabled={selectedPlaques.length === 0 || disabled}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionPlaquesPanel;