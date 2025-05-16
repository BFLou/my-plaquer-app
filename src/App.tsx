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
            
            <Route path="/profile" element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            } />
            
            <Route path="/profile/visited" element={
              <RequireAuth>
                <ProfilePage activeTab="visited" />
              </RequireAuth>
            } />
            
            <Route path="/profile/routes" element={
              <RequireAuth>
                <ProfilePage activeTab="routes" />
              </RequireAuth>
            } />
            
            <Route path="/settings" element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            } />
            
            <Route path="/settings/profile" element={
              <RequireAuth>
                <SettingsPage activeTab="profile" />
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