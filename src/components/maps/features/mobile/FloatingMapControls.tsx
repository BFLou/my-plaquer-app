// src/components/maps/features/mobile/FloatingMapControls.tsx
import React, { useState, useCallback } from 'react';
import {
  Route,
  Target,
  Filter,
  Layers,
  Save,
  Home,
  List,
  Grid,
  MoreHorizontal,
  X,
  Navigation,
  ArrowLeft
} from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

interface FloatingMapControlsProps {
  // View state
  view: 'map' | 'list' | 'grid';
  onViewChange: (view: 'map' | 'list' | 'grid') => void;
  
  // Route state
  routeMode: boolean;
  routePointsCount: number;
  onToggleRoute: () => void;
  onSaveRoute: () => void;
  
  // Filter state
  hasActiveFilters: boolean;
  visiblePlaques: number;
  onOpenFilters: () => void;
  
  // Navigation
  onGoHome: () => void;
  onMyLocation: () => void;
  
  // Map controls
  onResetView: () => void;
  onToggleMapControls: () => void;
}

export const FloatingMapControls: React.FC<FloatingMapControlsProps> = ({
  view,
  onViewChange,
  routeMode,
  routePointsCount,
  onToggleRoute,
  onSaveRoute,
  hasActiveFilters,
  visiblePlaques,
  onOpenFilters,
  onGoHome,
  onMyLocation,
  onResetView
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showViewSwitcher, setShowViewSwitcher] = useState(false);
  const mobile = isMobile();

  // Handle quick menu toggle
  const toggleQuickMenu = useCallback(() => {
    if (mobile) triggerHapticFeedback('selection');
    setShowQuickMenu(!showQuickMenu);
  }, [showQuickMenu, mobile]);

  // Handle view switcher
  const toggleViewSwitcher = useCallback(() => {
    if (mobile) triggerHapticFeedback('light');
    setShowViewSwitcher(!showViewSwitcher);
  }, [showViewSwitcher, mobile]);

  // Primary action based on context
  const getPrimaryAction = () => {
    if (routeMode && routePointsCount > 1) {
      return {
        icon: <Save size={18} />,
        label: 'Save Route',
        onClick: onSaveRoute,
        className: 'bg-green-600 hover:bg-green-700 text-white',
        badge: routePointsCount
      };
    }
    
    return {
      icon: <Route size={18} />,
      label: routeMode ? 'Exit Route' : 'Plan Route',
      onClick: onToggleRoute,
      className: routeMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
      badge: routeMode ? routePointsCount : undefined
    };
  };

  const primaryAction = getPrimaryAction();

  if (!mobile) return null;

  return (
    <>
      {/* Context Header - Only in map view */}
      {view === 'map' && (
        <div className="absolute top-0 left-0 right-0 z-[995] p-4 bg-gradient-to-b from-black/20 to-transparent">
          <div className="flex items-center justify-between">
            {/* Back to discovery */}
            <MobileButton
              variant="ghost"
              size="sm"
              className="bg-white/90 backdrop-blur border border-white/20 shadow-lg"
              onClick={() => onViewChange('list')}
              touchOptimized
            >
              <ArrowLeft size={16} />
              <span className="ml-2 text-sm font-medium">Back</span>
            </MobileButton>

            {/* Current context */}
            <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1 shadow-lg border border-white/20">
              <span className="text-sm font-medium text-gray-800">
                {visiblePlaques} plaque{visiblePlaques !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick menu toggle */}
            <MobileButton
              variant="ghost"
              size="sm"
              className="bg-white/90 backdrop-blur border border-white/20 shadow-lg"
              onClick={toggleQuickMenu}
              touchOptimized
            >
              <MoreHorizontal size={16} />
            </MobileButton>
          </div>
        </div>
      )}

      {/* Main Floating Actions - Right side */}
      <div className="fixed bottom-20 right-4 z-[990] flex flex-col gap-3">
        {/* Primary Action Button */}
        <div className="relative">
          <MobileButton
            className={`h-14 w-14 rounded-full shadow-xl border-2 border-white ${primaryAction.className}`}
            onClick={primaryAction.onClick}
            touchOptimized
          >
            {primaryAction.icon}
          </MobileButton>
          
          {primaryAction.badge && (
            <Badge 
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white"
            >
              {primaryAction.badge}
            </Badge>
          )}
        </div>

        {/* My Location Button */}
        <MobileButton
          variant="outline"
          className="h-12 w-12 rounded-full bg-white/95 backdrop-blur shadow-lg border border-gray-200"
          onClick={onMyLocation}
          touchOptimized
        >
          <Target size={16} className="text-gray-700" />
        </MobileButton>

        {/* View Switcher */}
        <MobileButton
          variant="outline"
          className="h-12 w-12 rounded-full bg-white/95 backdrop-blur shadow-lg border border-gray-200"
          onClick={toggleViewSwitcher}
          touchOptimized
        >
          <Layers size={16} className="text-gray-700" />
        </MobileButton>
      </div>

      {/* Filter Status Chip - Left side */}
      {hasActiveFilters && (
        <div className="fixed bottom-20 left-4 z-[990]">
          <MobileButton
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 rounded-full px-4 py-2 shadow-lg"
            onClick={onOpenFilters}
            touchOptimized
          >
            <Filter size={14} className="mr-2" />
            <span className="text-sm font-medium">Filters Active</span>
          </MobileButton>
        </div>
      )}

      {/* Quick Menu Overlay */}
      {showQuickMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[995] bg-black/20"
            onClick={() => setShowQuickMenu(false)}
          />
          
          {/* Menu */}
          <div className="fixed bottom-4 right-4 z-[996]">
            <Card className="w-56 shadow-xl border-0 bg-white/95 backdrop-blur">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">Quick Actions</span>
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickMenu(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X size={14} />
                  </MobileButton>
                </div>
                
                <div className="space-y-2">
                  <MobileButton
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenFilters();
                    }}
                    touchOptimized
                  >
                    <Filter size={16} className="mr-3" />
                    <span className="text-sm">Filters</span>
                  </MobileButton>
                  
                  <MobileButton
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onResetView();
                    }}
                    touchOptimized
                  >
                    <Navigation size={16} className="mr-3" />
                    <span className="text-sm">Reset View</span>
                  </MobileButton>
                  
                  <MobileButton
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onGoHome();
                    }}
                    touchOptimized
                  >
                    <Home size={16} className="mr-3" />
                    <span className="text-sm">Home</span>
                  </MobileButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* View Switcher Overlay */}
      {showViewSwitcher && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[995] bg-black/20"
            onClick={() => setShowViewSwitcher(false)}
          />
          
          {/* View Options */}
          <div className="fixed bottom-32 right-4 z-[996]">
            <Card className="w-48 shadow-xl border-0 bg-white/95 backdrop-blur">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">View Mode</span>
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowViewSwitcher(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X size={14} />
                  </MobileButton>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <MobileButton
                    variant={view === 'list' ? 'default' : 'outline'}
                    className="flex-col h-16 p-2"
                    onClick={() => {
                      setShowViewSwitcher(false);
                      onViewChange('list');
                    }}
                    touchOptimized
                  >
                    <List size={16} />
                    <span className="text-xs mt-1">List</span>
                  </MobileButton>
                  
                  <MobileButton
                    variant={view === 'grid' ? 'default' : 'outline'}
                    className="flex-col h-16 p-2"
                    onClick={() => {
                      setShowViewSwitcher(false);
                      onViewChange('grid');
                    }}
                    touchOptimized
                  >
                    <Grid size={16} />
                    <span className="text-xs mt-1">Grid</span>
                  </MobileButton>
                  
                  <MobileButton
                    variant={view === 'map' ? 'default' : 'outline'}
                    className="flex-col h-16 p-2"
                    onClick={() => {
                      setShowViewSwitcher(false);
                      onViewChange('map');
                    }}
                    touchOptimized
                  >
                    <Target size={16} />
                    <span className="text-xs mt-1">Map</span>
                  </MobileButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
};