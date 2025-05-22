// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import CollectionsPage from './pages/Collections';
import CollectionDetailPage from './pages/CollectionDetail';
import Discover from './pages/Discover';
import Home from './pages/Home';
import About from './pages/About';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import RoutesManagementPage from './components/routes/RoutesManagementPage';
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
            
            {/* Protected routes */}
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
            
            <Route path="/collections/new" element={
              <RequireAuth>
                <CollectionDetailPage isNew={true} />
              </RequireAuth>
            } />
            
            {/* Routes management */}
            <Route path="/routes" element={
              <RequireAuth>
                <RoutesManagementPage />
              </RequireAuth>
            } />
            
            <Route path="/routes/:id" element={
              <RequireAuth>
                {/* This would be a RouteDetailPage component if you create one */}
                <div>Route Detail Page - Coming Soon</div>
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