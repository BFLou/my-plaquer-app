// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Discover from './pages/Discover';
import UserDashboard from './pages/UserDashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/profile" element={<UserDashboard />} />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </UserProvider>
  );
}

export default App;