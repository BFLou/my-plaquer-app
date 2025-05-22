// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import LibraryPage from './pages/LibraryPage';
import CollectionsPage from './pages/Collections';
import CollectionDetailPage from './pages/CollectionDetail';
import RoutesManagementPage from './pages/RoutesManagementPage';
import RouteDetailPage from './pages/RouteDetailPage';
import VisitsPage from './pages/VisitsPage';
import Discover from './pages/Discover';
import Home from './pages/Home';
import About from './pages/About';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import RequireAuth from './components/auth/RequireAuth';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/about" element={<About />} />
            
            {/* Library routes - Main landing page */}
            <Route path="/library" element={
              <RequireAuth>
                <LibraryPage />
              </RequireAuth>
            } />
            
            {/* Collections routes under Library */}
            <Route path="/library/collections" element={
              <RequireAuth>
                <CollectionsPage />
              </RequireAuth>
            } />
            
            <Route path="/library/collections/:id" element={
              <RequireAuth>
                <CollectionDetailPage />
              </RequireAuth>
            } />
            
            {/* Routes management under Library */}
            <Route path="/library/routes" element={
              <RequireAuth>
                <RoutesManagementPage />
              </RequireAuth>
            } />
            
            <Route path="/library/routes/:id" element={
              <RequireAuth>
                <RouteDetailPage />
              </RequireAuth>
            } />
            
            {/* Visits under Library */}
            <Route path="/library/visits" element={
              <RequireAuth>
                <VisitsPage />
              </RequireAuth>
            } />
            
            {/* Legacy redirects for backward compatibility */}
            <Route path="/collections" element={
              <RequireAuth>
                <CollectionsPage />
              </RequireAuth>
            } />
            
            <Route path="/collections/:id" element={
              <RequireAuth>
                <CollectionDetailPage />
              </RequireAuth>
            } />
            
            <Route path="/routes" element={
              <RequireAuth>
                <RoutesManagementPage />
              </RequireAuth>
            } />
            
            <Route path="/routes/:id" element={
              <RequireAuth>
                <RouteDetailPage />
              </RequireAuth>
            } />
            
            {/* Profile routes */}
            <Route path="/profile" element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            } />
            
            <Route path="/profile/:tab" element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            } />
            
            {/* Settings routes */}
            <Route path="/settings" element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            } />
            
            <Route path="/settings/:tab" element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            } />
          </Routes>
          <Toaster position="bottom-right" />
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;