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
import { PageContainer } from './components/layout/PageContainer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={
              <PageContainer activePage="home">
                <Home />
              </PageContainer>
            } />
            
            <Route path="/discover" element={
              <PageContainer activePage="discover">
                <Discover />
              </PageContainer>
            } />
            
            <Route path="/about" element={
              <PageContainer activePage="about">
                <About />
              </PageContainer>
            } />
            
            {/* Protected routes */}
            <Route path="/collections" element={
              <RequireAuth>
                <PageContainer activePage="collections">
                  <CollectionsPage />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/collections/:id" element={
              <RequireAuth>
                <PageContainer activePage="collections">
                  <CollectionDetailPage />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/collections/new" element={
              <RequireAuth>
                <PageContainer activePage="collections">
                  <CollectionDetailPage isNew={true} />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/profile" element={
              <RequireAuth>
                <PageContainer activePage="profile">
                  <ProfilePage />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/profile/visited" element={
              <RequireAuth>
                <PageContainer activePage="profile">
                  <ProfilePage activeTab="visited" />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/profile/routes" element={
              <RequireAuth>
                <PageContainer activePage="profile">
                  <ProfilePage activeTab="routes" />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/settings" element={
              <RequireAuth>
                <PageContainer activePage="settings">
                  <SettingsPage />
                </PageContainer>
              </RequireAuth>
            } />
            
            <Route path="/settings/profile" element={
              <RequireAuth>
                <PageContainer activePage="settings">
                  <SettingsPage activeTab="profile" />
                </PageContainer>
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