// src/components/auth/AuthModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {activeTab === 'login' ? 'Sign In' : 
               activeTab === 'register' ? 'Create Account' : 
               'Reset Password'}
            </DialogTitle>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        {(activeTab === 'login' || activeTab === 'register') && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mb-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {activeTab === 'login' && (
          <LoginForm 
            onForgotPassword={() => setActiveTab('forgot')}
            onSuccess={onClose}
          />
        )}

        {activeTab === 'register' && (
          <RegisterForm onSuccess={() => setActiveTab('login')} />
        )}

        {activeTab === 'forgot' && (
          <ForgotPasswordForm 
            onBackToLogin={() => setActiveTab('login')} 
            onSuccess={() => setActiveTab('login')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;