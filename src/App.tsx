// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import CollectionsPage from './pages/Collections';
import CollectionDetailPage from './pages/CollectionDetail';
import Discover from './pages/Discover';
import Home from './pages/Home';
import About from './pages/About';
import { Toaster } from 'sonner';
import { PageContainer } from './components/layout/PageContainer';

function App() {
  return (
    <UserProvider>
      <Router>
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
          
          <Route path="/collections" element={
            <PageContainer activePage="collections">
              <CollectionsPage />
            </PageContainer>
          } />
          
          <Route path="/collections/:id" element={
            <PageContainer activePage="collections">
              <CollectionDetailPage />
            </PageContainer>
          } />
          
          <Route path="/about" element={
            <PageContainer activePage="about">
              <About />
            </PageContainer>
          } />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </UserProvider>
  );
}

export default App;