// src/components/home/HomeComponents.tsx
import React from 'react';
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Category Card Component
export const CategoryCard = ({ category, onClick }: { 
  category: { 
    label: string; 
    icon: string; 
    count: number;
    onClick: () => void;
  }; 
  onClick: () => void 
}) => {
  return (
    <Button 
      variant="outline" 
      className="whitespace-nowrap flex items-center justify-start h-10 gap-1.5 shadow-sm bg-white hover:bg-gray-50 border text-left"
      onClick={category.onClick}
    >
      <span className="mr-1">{category.icon}</span>
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium">{category.label}</span>
        <span className="text-xs text-gray-500">{category.count}</span>
      </div>
    </Button>
  );
};

// Popular Locations Section
export const PopularLocations = ({ locations }: { 
  locations: { name: string; count: number }[] 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="p-3">
      <h3 className="font-medium text-sm text-gray-700 mb-2">Popular Locations</h3>
      <div className="flex flex-wrap gap-2">
        {locations.map((location, idx) => (
          <div 
            key={idx}
            className="px-3 py-1.5 bg-gray-50 rounded-md text-sm cursor-pointer hover:bg-blue-50 transition flex items-center"
            onClick={() => {
              navigate(`/discover?search=${encodeURIComponent(location.name)}`);
            }}
          >
            <MapPin size={14} className="mr-1 text-gray-400" />
            <span className="font-medium">{location.name}</span>
            <Badge variant="secondary" className="ml-1.5 text-xs">{location.count}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

// Popular Historical Figures Section
export const PopularFigures = ({ figures }: { 
  figures: { name: string; profession: string }[] 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="p-3">
      <h3 className="font-medium text-sm text-gray-700 mb-2">Popular Historical Figures</h3>
      <div className="flex flex-wrap gap-2">
        {figures.map((figure, idx) => (
          <div 
            key={idx}
            className="px-3 py-1.5 bg-gray-50 rounded-md text-sm cursor-pointer hover:bg-blue-50 transition flex items-center"
            onClick={() => {
              navigate(`/discover?search=${encodeURIComponent(figure.name)}`);
            }}
          >
            <span className="font-medium">{figure.name}</span>
            <span className="text-xs text-gray-500 ml-1">({figure.profession})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Map Preview component
export const MapPreview = ({ 
  isMapLoaded, 
  mapContainerRef,
  navigateToDiscover 
}: { 
  isMapLoaded: boolean;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  navigateToDiscover: () => void;
}) => {
  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-gray-100 cursor-pointer transition duration-200 hover:opacity-95"
        onClick={navigateToDiscover}
      >
        {!isMapLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 text-sm">Loading map preview...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Always visible overlay button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform hover:scale-105 transition-transform"
          onClick={navigateToDiscover}
        >
          Open Map View
        </Button>
      </div>
      
      {/* Fixed bottom button for easier access */}
      <div className="absolute bottom-4 right-4 left-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          onClick={navigateToDiscover}
        >
          Open Map View
        </Button>
      </div>
    </div>
  );
};

// Onboarding Dialog Content
export const OnboardingStepContent = ({ 
  step, 
  steps 
}: { 
  step: number; 
  steps: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] 
}) => {
  return (
    <div className="flex flex-col items-center text-center">
      {steps[step].icon}
      <h2 className="mt-4 text-xl font-semibold">{steps[step].title}</h2>
      <p className="mt-2 text-gray-500">
        {steps[step].description}
      </p>
    </div>
  );
};

// Categories Section
export const CategoriesSection = ({ categories }: { 
  categories: {
    label: string;
    icon: string;
    count: number;
    onClick: () => void;
  }[] 
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1">
        {categories.map((category, index) => (
          <CategoryCard 
            key={index} 
            category={category} 
            onClick={category.onClick} 
          />
        ))}
      </div>
    </div>
  );
};

// Feature Section Item
export const FeatureItem = ({ 
  number, 
  title, 
  description 
}: { 
  number: number; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-4">
        {number}
      </div>
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};