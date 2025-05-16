// src/components/auth/AuthTest.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const AuthTest: React.FC = () => {
  const { user, signIn, register, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplayName] = useState('Test User');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setStatus('Signing in...');
    setError(null);
    
    try {
      await signIn(email, password);
      setStatus('Signed in successfully!');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(`Error: ${err.code} - ${err.message}`);
      setStatus('Sign in failed');
    }
  };

  const handleRegister = async () => {
    setStatus('Registering...');
    setError(null);
    
    try {
      await register(email, password, displayName);
      setStatus('Registered successfully!');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(`Error: ${err.code} - ${err.message}`);
      setStatus('Registration failed');
    }
  };

  const handleSignOut = async () => {
    setStatus('Signing out...');
    setError(null);
    
    try {
      await signOut();
      setStatus('Signed out successfully!');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(`Error: ${err.code} - ${err.message}`);
      setStatus('Sign out failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
      
      {/* Current Auth State */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Current Auth State:</h3>
        {user ? (
          <div>
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Display Name:</strong> {user.displayName}</p>
          </div>
        ) : (
          <p>Not signed in</p>
        )}
      </div>
      
      {/* Form Inputs */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Display Name (for registration):</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Sign In
        </button>
        
        <button
          onClick={handleRegister}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Register
        </button>
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          disabled={!user}
        >
          Sign Out
        </button>
      </div>
      
      {/* Status and Error Messages */}
      {status && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
          {status}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default AuthTest;