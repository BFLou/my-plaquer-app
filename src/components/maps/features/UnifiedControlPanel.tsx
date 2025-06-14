// src/components/maps/features/UnifiedControlPanel.tsx - REFACTORED: Main component
import React, { useState, useEffect } from 'react';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { Plaque } from '@/types/plaque';
import { DesktopCompactSidebar } from './Desktop/DesktopCompactSidebar';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';

// Distance filter interface
interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface UnifiedControlPanelProps {
  // Distance filter props
  distanceFilter: DistanceFilter;
  onSetLocation: (coords: [number, number]) => void;
  onRadiusChange: (radius: number) => void;
  onClearDistanceFilter: () => void;

  // Standard filter props
  plaques: Plaque[];
  visiblePlaques: Plaque[];
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  onColorsChange: (values: string[]) => void;
  onPostcodesChange: (values: string[]) => void;
  onProfessionsChange: (values: string[]) => void;
  onVisitedChange: (value: boolean) => void;
  onFavoritesChange: (value: boolean) => void;
  onResetStandardFilters: () => void;

  // Route props
  routeMode: boolean;
  onToggleRoute: () => void;
  routePointsCount: number;

  // Reset props
  onResetView: () => void;

  // External functions
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;

  className?: string;

  // Organisation filter props
  selectedOrganisations?: string[];
  onOrganisationsChange?: (values: string[]) => void;
}

// Main Unified Control Panel Component
export const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = (
  props
) => {
  const mobile = isMobile();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true); // Start collapsed by default
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Enhanced auto-collapse logic for desktop
  useEffect(() => {
    if (!mobile) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        const isControlPanel =
          target.closest('.desktop-compact-sidebar') ||
          target.closest('.desktop-floating-toggle');

        if (!isControlPanel && !isDesktopCollapsed) {
          // Auto-collapse after 10 seconds of no interaction
          const timeout = setTimeout(() => {
            setIsDesktopCollapsed(true);
          }, 10000);

          return () => clearTimeout(timeout);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobile, isDesktopCollapsed]);

  // Enhanced mobile gesture handling
  useEffect(() => {
    if (mobile && isMobileOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobile, isMobileOpen]);

  // Destructure props and provide default empty array/function for optional props
  const {
    selectedOrganisations = [],
    onOrganisationsChange = () => {},
    ...rest
  } = props;

  if (mobile) {
    return (
      <MobileBottomSheet
        {...rest}
        isOpen={isMobileOpen}
        onToggle={() => {
          triggerHapticFeedback('selection');
          setIsMobileOpen(!isMobileOpen);
        }}
        selectedOrganisations={selectedOrganisations}
        onOrganisationsChange={onOrganisationsChange}
      />
    );
  }

  return (
    <DesktopCompactSidebar
      {...rest}
      isCollapsed={isDesktopCollapsed}
      onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
      selectedOrganisations={selectedOrganisations}
      onOrganisationsChange={onOrganisationsChange}
    />
  );
};

// Export default
export default UnifiedControlPanel;
