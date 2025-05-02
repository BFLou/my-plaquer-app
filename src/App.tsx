import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import your page components
import Home from './pages/Home';
import Discover from './pages/Discover';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import About from './pages/About';

// Import any global providers
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      {/* Provide any global context here */}
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/about" element={<About />} />
        </Routes>
        
        {/* Global components like Toaster for notifications */}
        <Toaster position="top-right" />
      </main>
    </Router>
  );
}