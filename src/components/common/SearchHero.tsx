import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SearchCategory = {
  label: string;
  onClick: () => void;
};

type SearchHeroProps = {
  title: string;
  subtitle?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  categories?: SearchCategory[];
  className?: string;
  placeholderText?: string;
};

export const SearchHero = ({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onSearch,
  categories = [],
  className = '',
  placeholderText = "Search by name, location, or period"
}: SearchHeroProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <section className={`relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 md:py-12 px-4 ${className}`}>
      <div className="absolute right-0 top-0 w-32 h-32 md:w-64 md:h-64 opacity-10">
        <MapPin size="100%" />
      </div>
      
      <div className="container mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg opacity-90 mb-6 max-w-2xl">
            {subtitle}
          </p>
        )}
        
        <div className="bg-white rounded-xl shadow-lg p-3 flex gap-2 items-center">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              type="text" 
              placeholder={placeholderText} 
              className="pl-9 border-none shadow-none focus-visible:ring-0"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button className="shrink-0" onClick={onSearch}>
            Search
          </Button>
        </div>
        
        {categories.length > 0 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category, index) => (
              <Badge 
                key={index}
                className="bg-blue-500 hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                onClick={category.onClick}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchHero;