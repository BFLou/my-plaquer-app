import React from 'react';
import { MapPin, Star, List, BookMarked } from 'lucide-react';
import { Button } from "@/components/ui/button";

type CollectionsHeaderProps = {
  totalCollections: number;
  totalPlaques: number;
  favoritedCollections: number;
  onCreateCollection: () => void;
};

const CollectionsHeader = ({
  totalCollections,
  totalPlaques,
  favoritedCollections,
  onCreateCollection
}: CollectionsHeaderProps) => {
  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">My Collections</h1>
            <p className="text-blue-50">Curate your own plaque discoveries around London</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 p-5 rounded-xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-100 mb-1 text-sm font-medium">Collections</div>
              <div className="text-3xl font-bold text-white">{totalCollections}</div>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <BookMarked size={24} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-blue-600 p-5 rounded-xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-100 mb-1 text-sm font-medium">Total Plaques</div>
              <div className="text-3xl font-bold text-white">{totalPlaques}</div>
            </div>
            <div className="p-3 bg-blue-700 rounded-lg">
              <MapPin size={24} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-amber-500 p-5 rounded-xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-amber-100 mb-1 text-sm font-medium">Favorites</div>
              <div className="text-3xl font-bold text-white">{favoritedCollections}</div>
            </div>
            <div className="p-3 bg-amber-600 rounded-lg">
              <Star size={24} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-blue-700 p-5 rounded-xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-100 mb-1 text-sm font-medium">Create New</div>
              <Button 
                onClick={onCreateCollection} 
                className="bg-white hover:bg-gray-100 text-blue-700 mt-2"
              >
                <Plus size={16} className="mr-1" /> New Collection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionsHeader;