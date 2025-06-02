// src/App.tsx - Updated with PendingActionHandler integration
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import { AppRoutes } from './router/AppRoutes';
import { ScrollToTop } from './components/ScrollToTop';
import { useGlobalErrorHandlers } from './hooks/useGlobalErrorHandlers';
import PendingActionHandler from './components/auth/PendingActionHandler';
import { Toaster } from 'sonner';

// Toaster configuration
const toasterConfig = {
  position: 'bottom-right' as const,
  expand: true,
  richColors: true,
  closeButton: true,
  duration: 4000,
  style: {
    fontSize: '14px',
  },
  toastOptions: {
    style: {
      background: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    className: 'custom-toast',
  },
};

function App() {
  // Set up global error handling and resource preloading
  useGlobalErrorHandlers();

  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <ScrollToTop />
          {/* Global pending action handler */}
          <PendingActionHandler />
          <AppRoutes />
          <Toaster {...toasterConfig} />
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;