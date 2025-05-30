// src/router/AppRoutes.tsx - Complete version with AuthGate and SignIn
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MapErrorBoundary } from '@/components/ErrorBoundary';
import { OptimizedRoute } from '@/components/OptimizedRoute';
import { NotFoundPage } from '@/components/NotFoundPage';
import RequireAuth from '@/components/auth/RequireAuth';
import AuthGate from '@/components/auth/AuthGate';
import SignInPage from '@/pages/SignInPage';

// Import pages
import LibraryPage from '@/pages/LibraryPage';
import CollectionsPage from '@/pages/Collections';
import CollectionDetailPage from '@/pages/CollectionDetail';
import RoutesManagementPage from '@/pages/RoutesManagementPage';
import RouteDetailPage from '@/pages/RouteDetailPage';
import VisitsPage from '@/pages/VisitsPage';
import Discover from '@/pages/Discover';
import Home from '@/pages/Home';
import About from '@/pages/About';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import PlaqueDetailPage from '@/pages/PlaqueDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      
      {/* Enhanced Discover route with map error boundary */}
      <Route 
        path="/discover" 
        element={
          <MapErrorBoundary>
            <Discover />
          </MapErrorBoundary>
        } 
      />
      
      {/* Individual plaque detail route - PUBLIC */}
      <Route 
        path="/plaque/:id" 
        element={
          <MapErrorBoundary>
            <OptimizedRoute element={PlaqueDetailPage} />
          </MapErrorBoundary>
        } 
      />
      
      {/* Auth routes */}
      <Route path="/auth-required" element={<AuthGate />} />
      <Route path="/signin" element={<SignInPage />} />
      
      {/* Library routes - Main landing page */}
      <Route path="/library" element={
        <RequireAuth showGatePage={true}>
          <OptimizedRoute element={LibraryPage} />
        </RequireAuth>
      } />
      
      {/* Collections routes under Library */}
      <Route path="/library/collections" element={
        <RequireAuth showGatePage={true} featureName="create and manage collections">
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/collections/:id" element={
        <RequireAuth showGatePage={true} featureName="view collection details">
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Routes management under Library */}
      <Route path="/library/routes" element={
        <RequireAuth showGatePage={true} featureName="create and manage routes">
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/routes/:id" element={
        <RequireAuth showGatePage={true} featureName="view route details">
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Visits under Library */}
      <Route path="/library/visits" element={
        <RequireAuth showGatePage={true} featureName="track your visits">
          <OptimizedRoute element={VisitsPage} />
        </RequireAuth>
      } />
      
      {/* Legacy redirects for backward compatibility */}
      <Route path="/collections" element={
        <RequireAuth showGatePage={true} featureName="create and manage collections">
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/collections/:id" element={
        <RequireAuth showGatePage={true} featureName="view collection details">
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      <Route path="/routes" element={
        <RequireAuth showGatePage={true} featureName="create and manage routes">
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/routes/:id" element={
        <RequireAuth showGatePage={true} featureName="view route details">
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Profile routes */}
      <Route path="/profile" element={
        <RequireAuth showGatePage={true} featureName="manage your profile">
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      <Route path="/profile/:tab" element={
        <RequireAuth showGatePage={true} featureName="manage your profile">
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      {/* Settings routes */}
      <Route path="/settings" element={
        <RequireAuth showGatePage={true} featureName="access your settings">
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      <Route path="/settings/:tab" element={
        <RequireAuth showGatePage={true} featureName="access your settings">
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      {/* 404 Not Found route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};