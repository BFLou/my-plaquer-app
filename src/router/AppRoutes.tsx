// src/router/AppRoutes.tsx - Complete enhanced version with context-aware auth gates
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
      
      {/* Context-aware auth gates with descriptive URLs */}
      <Route path="/join/to-save-favorites" element={
        <AuthGate 
          featureName="save favorites"
          redirectTo="/discover"
          backTo="/discover"
          context="favorites"
        />
      } />
      
      <Route path="/join/to-track-visits" element={
        <AuthGate 
          featureName="track your visits"
          redirectTo="/discover"
          backTo="/discover"
          context="visits"
        />
      } />
      
      <Route path="/join/to-create-collections" element={
        <AuthGate 
          featureName="create and manage collections"
          redirectTo="/library/collections"
          backTo="/discover"
          context="collections"
        />
      } />
      
      <Route path="/join/to-access-library" element={
        <AuthGate 
          featureName="access your personal library"
          redirectTo="/library"
          backTo="/"
          context="library"
        />
      } />
      
      <Route path="/join/to-plan-routes" element={
        <AuthGate 
          featureName="plan and save routes"
          redirectTo="/library/routes"
          backTo="/discover"
          context="routes"
        />
      } />
      
      <Route path="/join/to-manage-profile" element={
        <AuthGate 
          featureName="manage your profile"
          redirectTo="/profile"
          backTo="/"
          context="profile"
        />
      } />
      
      <Route path="/join/to-access-settings" element={
        <AuthGate 
          featureName="access your settings"
          redirectTo="/settings"
          backTo="/profile"
          context="settings"
        />
      } />
      
      {/* Fallback auth gate for generic cases */}
      <Route path="/join" element={
        <AuthGate 
          featureName="unlock all features"
          redirectTo="/library"
          backTo="/discover"
          context="general"
        />
      } />
      
      {/* Legacy redirects for backward compatibility */}
      <Route path="/auth-required" element={<Navigate to="/join" replace />} />
      
      {/* Auth routes */}
      <Route path="/signin" element={<SignInPage />} />
      
      {/* Library routes - Main landing page */}
      <Route path="/library" element={
        <RequireAuth 
          showGatePage={true}
          featureName="access your library"
          authGateUrl="/join/to-access-library"
        >
          <OptimizedRoute element={LibraryPage} />
        </RequireAuth>
      } />
      
      {/* Collections routes under Library */}
      <Route path="/library/collections" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="create and manage collections"
          authGateUrl="/join/to-create-collections"
        >
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/collections/:id" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="view collection details"
          authGateUrl="/join/to-create-collections"
        >
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Routes management under Library */}
      <Route path="/library/routes" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="create and manage routes"
          authGateUrl="/join/to-plan-routes"
        >
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/library/routes/:id" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="view route details"
          authGateUrl="/join/to-plan-routes"
        >
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Visits under Library */}
      <Route path="/library/visits" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="track your visits"
          authGateUrl="/join/to-track-visits"
        >
          <OptimizedRoute element={VisitsPage} />
        </RequireAuth>
      } />
      
      {/* Legacy redirects for backward compatibility */}
      <Route path="/collections" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="create and manage collections"
          authGateUrl="/join/to-create-collections"
        >
          <OptimizedRoute element={CollectionsPage} />
        </RequireAuth>
      } />
      
      <Route path="/collections/:id" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="view collection details"
          authGateUrl="/join/to-create-collections"
        >
          <MapErrorBoundary>
            <OptimizedRoute element={CollectionDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      <Route path="/routes" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="create and manage routes"
          authGateUrl="/join/to-plan-routes"
        >
          <OptimizedRoute element={RoutesManagementPage} />
        </RequireAuth>
      } />
      
      <Route path="/routes/:id" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="view route details"
          authGateUrl="/join/to-plan-routes"
        >
          <MapErrorBoundary>
            <OptimizedRoute element={RouteDetailPage} />
          </MapErrorBoundary>
        </RequireAuth>
      } />
      
      {/* Profile routes */}
      <Route path="/profile" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="manage your profile"
          authGateUrl="/join/to-manage-profile"
        >
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      <Route path="/profile/:tab" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="manage your profile"
          authGateUrl="/join/to-manage-profile"
        >
          <OptimizedRoute element={ProfilePage} />
        </RequireAuth>
      } />
      
      {/* Settings routes */}
      <Route path="/settings" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="access your settings"
          authGateUrl="/join/to-access-settings"
        >
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      <Route path="/settings/:tab" element={
        <RequireAuth 
          showGatePage={true} 
          featureName="access your settings"
          authGateUrl="/join/to-access-settings"
        >
          <OptimizedRoute element={SettingsPage} />
        </RequireAuth>
      } />
      
      {/* 404 Not Found route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};