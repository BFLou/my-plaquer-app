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
export { PlaqueBadge } from './plaques/PlaqueBadge';
export { default as Pagination } from './plaques/Pagination';
export { default as VisitLogger } from './plaques/VisitLogger';

// Collection components
export { CollectionCard, type Collection } from './collections/CollectionCard';
export { CollectionStats } from './collections/CollectionStats';
export { default as EmptyState } from './collections/EmptyState';

// Map components
export { default as PlaqueMap } from './maps/PlaqueMap';

// Profile components
export { default as UserCollectionsPanel } from './profile/UserCollectionsPanel';
export { default as VisitedPlaquesPanel } from './profile/VisitedPlaquesPanel';

// Common components
export { EmptyState as CommonEmptyState } from './common/EmptyState';
export { ActionBar, type ActionBarButton } from './common/ActionBar';
export { ViewToggle, type ViewMode } from './common/ViewToggle';
export { FilterBar } from './common/FilterBar';
export { FilterSheet } from './common/FilterSheet';
export { ImprovedFilterSheet } from './common/ImprovedFilterSheet';
export { MultiSelectFilter } from './common/MultiSelectFilter';
export { SearchHero } from './common/SearchHero';
export { SearchableFilterBar } from './common/SearchableFilterBar';
export { StatCard } from './common/StatCard';
export { FeatureCard } from './common/FeatureCard';

// Icons
export { RouteIcon } from './icons/RouteIcon';

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