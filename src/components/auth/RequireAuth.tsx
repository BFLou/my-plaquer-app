// src/components/auth/RequireAuth.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import AuthModal from './AuthModal';

type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = React.useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show auth modal instead of redirecting
  if (!user) {
    // Show the modal
    if (!showModal) {
      setShowModal(true);
    }
    
    // Return the current page with an auth modal
    return (
      <>
        {React.cloneElement(children as React.ReactElement, { isPreview: true })}
        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;