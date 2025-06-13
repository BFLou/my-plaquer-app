// src/components/maps/features/Search/SearchBar.tsx
import React from 'react';
import { MapboxSearchBar } from './MapboxSearchBar'; // Import the new component
import { useMap } from '@/components/maps/core/useMap'; // To get map center for biasing

interface SearchBarProps {
  onSearchSelect: (coords: [number, number], placeName: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchSelect,
  className,
  placeholder = "Search locations on map...",
}) => {
  // Create a dummy ref and default options for useMap
  const dummyRef = React.useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const { map } = useMap(dummyRef, { center: [0, 0], zoom: 1 });

  const handlePlaceSelect = (coords: [number, number], placeName: string) => {
    onSearchSelect(coords, placeName);
    // Optionally, pan the map to the selected location
    if (map) {
      map.flyTo(coords, 13); // Adjust zoom level as needed
    }
  };

  const mapCenterForProximity: [number, number] | null = map ? [map.getCenter().lng, map.getCenter().lat] : null;
  const mapBoundsForBbox: [number, number, number, number] | null = map ? [
    map.getBounds().getWest(), map.getBounds().getSouth(),
    map.getBounds().getEast(), map.getBounds().getNorth()
  ] : null;

  return (
    <div className={className}>
      <MapboxSearchBar
        onPlaceSelect={handlePlaceSelect}
        placeholder={placeholder}
        currentProximity={mapCenterForProximity}
        currentBbox={mapBoundsForBbox}
      />
    </div>
  );
};