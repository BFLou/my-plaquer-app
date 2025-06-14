// src/App.tsx - Updated with mobile auth onboarding and improved toaster
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import { AppRoutes } from './router/AppRoutes';
import { ScrollToTop } from './components/ScrollToTop';
import { useGlobalErrorHandlers } from './hooks/useGlobalErrorHandlers';
import PendingActionHandler from './components/auth/PendingActionHandler';
import { useMobileAuthOnboarding } from './hooks/useMobileAuthOnboarding';
import { Toaster } from 'sonner';
import { initMobileOptimizations } from './utils/mobileUtils';

// Import mobile navigation CSS
import './styles/mobile-navigation.css';

// Enhanced toaster configuration for mobile
const toasterConfig = {
  position: 'bottom-center' as const,
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
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      borderRadius: '12px',
      padding: '12px 16px',
      margin: '0 16px 80px 16px', // Add bottom margin for mobile nav
    },
    className: 'custom-toast',
  },
  // Mobile-specific positioning
  offset: '16px',
};

// Mobile Auth Helper Component
const MobileAuthHelper: React.FC = () => {
  useMobileAuthOnboarding();
  return null;
};

function App() {
  // Set up global error handling and resource preloading
  useGlobalErrorHandlers();

  // Initialize mobile optimizations once
  React.useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <ScrollToTop />
          {/* Mobile auth onboarding helper */}
          <MobileAuthHelper />
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
