// src/components/collections/CollectionsHeader.tsx
import React from 'react';
import { MapPin, Star, BookMarked, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

type CollectionsHeaderProps = {
  totalCollections: number;
  totalPlaques: number;
  favoritedCollections: number;
  onCreateCollection: () => void;
};

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  subValue?: string;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  bgColor,
  iconBgColor,
  subValue
}) => (
  <div className={`${bgColor} p-5 rounded-xl shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-blue-100 mb-1 text-sm font-medium">{label}</div>
        <div className="text-3xl font-bold text-white">{value}</div>
        {subValue && (
          <div className="mt-1 text-xs text-blue-100">{subValue}</div>
        )}
      </div>
      <div className={`p-3 ${iconBgColor} rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

export const CollectionsHeader: React.FC<CollectionsHeaderProps> = ({
  totalCollections,
  totalPlaques,
  favoritedCollections,
  onCreateCollection
}) => {
  return (
    <div className="container mx-auto px-4 pt-6 pb-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">My Collections</h1>
            <p className="text-blue-50">Curate your own plaque discoveries around London</p>
          </div>
          
          <Button 
            onClick={onCreateCollection} 
            size="lg"
            className="bg-white hover:bg-gray-100 text-blue-700"
          >
            <Plus size={18} className="mr-2" /> New Collection
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Collections" 
          value={totalCollections} 
          icon={<BookMarked size={24} className="text-white" />}
          bgColor="bg-blue-500"
          iconBgColor="bg-blue-600"
        />
        
        <StatCard 
          label="Total Plaques" 
          value={totalPlaques} 
          icon={<MapPin size={24} className="text-white" />}
          bgColor="bg-blue-600"
          iconBgColor="bg-blue-700"
        />
        
        <StatCard 
          label="Favorites" 
          value={favoritedCollections} 
          icon={<Star size={24} className="text-white" />}
          bgColor="bg-amber-500"
          iconBgColor="bg-amber-600"
        />
        
        <StatCard 
          label="Create New" 
          value={0}
          icon={<Plus size={24} className="text-white" />}
          bgColor="bg-blue-700"
          iconBgColor="bg-blue-800"
          subValue="Add a new collection"
        />
      </div>
    </div>
  );
};

export default CollectionsHeader;