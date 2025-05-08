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
export type { Plaque } from './plaques/PlaqueCard';
export { PlaqueListItem } from './plaques/PlaqueListItem';
export { PlaqueDetail } from './plaques/PlaqueDetail';

// Collection components
export { CollectionCard } from './collections/CollectionCard';
export type { Collection } from './collections/CollectionCard';
export { CollectionListItem } from './collections/CollectionListItem';
export { CollectionCreator } from './collections/CollectionCreator';
export type { NewCollection } from './collections/CollectionCreator';
export { CollectionStats } from './collections/CollectionStats';
export { default as CollectionsPage } from './collections/CollectionsPage';
export { default as CollectionsHeader } from './collections/CollectionsHeader';
export { default as CollectionsDashboard } from './collections/CollectionsDashboard';
export { default as CollectionsFilterBar } from './collections/CollectionsFilterBar';
export { default as CollectionsList } from './collections/CollectionsList';
export { default as CollectionsGrid } from './collections/CollectionsGrid';
export { default as CollectionFilterSheet } from './collections/CollectionFilterSheet';
export { default as CollectionsSortDropdown } from './collections/CollectionsSortDropdown';

// Common components
export { EmptyState } from './common/EmptyState';
export { ActionBar } from './common/ActionBar';
export type { ActionBarButton } from './common/ActionBar';
export { ViewToggle } from './common/ViewToggle';
export type { ViewMode } from './common/ViewToggle';
export { FilterBar } from './common/FilterBar';
export { FilterSheet } from './common/FilterSheet';
export { SearchHero } from './common/SearchHero';
export { StatCard } from './common/StatCard';
export { FeatureCard } from './common/FeatureCard';

// You can optionally re-export UI components from here if needed
// export * from './ui';