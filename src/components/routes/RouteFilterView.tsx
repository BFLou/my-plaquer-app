// src/components/routes/RouteFilterView.tsx
import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Grid, 
  List, 
  Map,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RouteViewMode = 'grid' | 'list' | 'map';

interface RouteFilterViewProps {
  routes: any[];
  viewMode: RouteViewMode;
  setViewMode: (mode: RouteViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  onCreateRoute?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  showMapView?: boolean;
  activeFilters?: string[];
  onClearFilters?: () => void;
}

const RouteFilterView: React.FC<RouteFilterViewProps> = ({
  routes,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  onCreateRoute,
  isLoading = false,
  children,
  showMapView = true,
  activeFilters = [],
  onClearFilters
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* Top Row: Search and Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={handleSearchClear}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Create Route Button */}
          {onCreateRoute && (
            <Button onClick={onCreateRoute} className="gap-1 shrink-0">
              <Plus size={16} />
              Create Route
            </Button>
          )}
        </div>
        
        {/* Bottom Row: View Mode, Sort, and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value: RouteViewMode) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid size={16} className="mr-1" />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list">
                <List size={16} className="mr-1" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              {showMapView && (
                <TabsTrigger value="map">
                  <Map size={16} className="mr-1" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            {/* Sort Options */}
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="distance_asc">Shortest First</SelectItem>
                <SelectItem value="distance_desc">Longest First</SelectItem>
                <SelectItem value="most_waypoints">Most Waypoints</SelectItem>
                <SelectItem value="least_waypoints">Least Waypoints</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Advanced Filters Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="gap-1"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {filter}
                  <X size={12} className="cursor-pointer" />
                </Badge>
              ))}
              {onClearFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="text-xs h-6"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${routes.length} ${routes.length === 1 ? 'route' : 'routes'} found`}
        </p>
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};

export default RouteFilterView;