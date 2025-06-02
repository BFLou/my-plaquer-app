/**
 * Main components index file
 * 
 * This file exports all components from their respective subfolders,
 * allowing for clean imports throughout the application.
 */

// Layout components
export { NavBar } from './layout/NavBar';
export { Footer } from './layout/Footer';
export { PageContainer } from './layout/PageContainer';

// Plaque components
export { PlaqueCard } from './plaques/PlaqueCard';
export type { Plaque } from '@/types/plaque';
export { PlaqueListItem } from './plaques/PlaqueListItem';
export { PlaqueDetail } from './plaques/PlaqueDetail';
export { PlaqueImage } from './plaques/PlaqueImage';
export { default as Pagination } from './plaques/Pagination';

// Collection components
export { CollectionStats } from './collections/CollectionStats';
// REMOVED: export { default as EmptyState } from './collections/EmptyState';

// Map components - NEW SECTION
export { MapContainer } from './maps/MapContainer';
export { MapView } from './maps/MapView';

// Map features
export { SearchBar } from './maps/features/Search/SearchBar';
export { useSearch } from './maps/features/Search/useSearch';
export { LocationFilter } from './maps/features/LocationFilter/LocationFilter';
export { useLocationFilter } from './maps/features/LocationFilter/useLocationFilter';

// Map core hooks
export { useMap } from './maps/core/useMap';
export { useMarkers } from './maps/core/useMarkers';
export { useRoute } from './maps/core/useRoute';
export { useDistanceCircle } from './maps/core/useDistanceCircle';

// Error Boundary and Route components
export { MapErrorBoundary } from './ErrorBoundary';
export { OptimizedRoute } from './OptimizedRoute';
export { NotFoundPage } from './NotFoundPage';
export { ScrollToTop } from './ScrollToTop';

// Common components - FIXED: Use one EmptyState export
export { EmptyState } from './common/EmptyState'; // MAIN EmptyState export
export { ActionBar, type ActionBarButton } from './common/ActionBar';
export { ViewToggle, type ViewMode } from './common/ViewToggle';
export { FilterBar } from './common/FilterBar';
export { SearchableFilterBar } from './common/SearchableFilterBar';

// UI components
export * from './ui/alert-dialog';
export * from './ui/avatar';
export * from './ui/badge';
export * from './ui/button';
export * from './ui/card';
export * from './ui/checkbox';
export * from './ui/command';
export * from './ui/dialog';
export * from './ui/dropdown-menu';
export * from './ui/input';
export * from './ui/label';
export * from './ui/popover';
export * from './ui/scroll-area';
export * from './ui/select';
export * from './ui/separator';
export * from './ui/sheet';
export * from './ui/slider';
export * from './ui/switch';
export * from './ui/tabs';
export * from './ui/textarea';
export * from './ui/tooltip';
export { Toaster } from './ui/sonner';

// src/hooks/index.ts
export { useAuth } from '../hooks/useAuth';
export { useCollections } from '../hooks/useCollection';
export { useCollectionActions } from '../hooks/useCollectionActions';
export { useCollectionDetail } from '../hooks/useCollectionDetail';
export { useCollectionsList } from '../hooks/useCollectionsList';
export { useFavorites } from '../hooks/useFavorites';
export { usePlaqueFilters } from '../hooks/usePlaqueFilters';
export { usePlaques } from '../hooks/usePlaques';
export { useRoutes } from '../hooks/useRoutes';
export { useTheme } from '../hooks/useTheme';
export { useVisitedPlaques } from '../hooks/useVisitedPlaques';
export { useAnimation } from '../hooks/useAnimation';
export { useGlobalErrorHandlers } from '../hooks/useGlobalErrorHandlers';