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

// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { Google, Github } from 'lucide-react';

type LoginFormProps = {
  onForgotPassword: () => void;
  onSuccess: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithGoogle, signInWithGithub } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    try {
      await signInWithGithub();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with GitHub.');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" 
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <button 
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
              Signing in...
            </>
          ) : 'Sign In'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">or continue with</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2"
        >
          <Google size={16} />
          <span>Google</span>
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGithubSignIn}
          className="flex items-center justify-center gap-2"
        >
          <Github size={16} />
          <span>GitHub</span>
        </Button>
      </div>
    </div>
  );
};

export default LoginForm;

// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/useAuth';

type RegisterFormProps = {
  onSuccess: () => void;
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const validatePassword = (pass: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and numbers');
      return;
    }
    
    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password, displayName);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name</Label>
        <Input 
          id="displayName"
          type="text" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="John Smith" 
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" 
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          Must be at least 8 characters with uppercase, lowercase, and numbers
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input 
          id="confirmPassword"
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={agreeTerms} 
          onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} 
        />
        <Label 
          htmlFor="terms" 
          className="text-sm font-normal leading-tight cursor-pointer"
        >
          I agree to the{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </Label>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
            Creating account...
          </>
        ) : 'Create Account'}
      </Button>
    </form>
  );
};

export default RegisterForm;

// src/components/auth/ForgotPasswordForm.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
  onSuccess: () => void;
};

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={onBackToLogin}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to login
      </button>
      
      <p className="text-sm text-gray-600">
        Enter your email address below and we'll send you a link to reset your password.
      </p>
      
      {isSuccess ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p className="font-medium">Password reset email sent!</p>
          <p className="text-sm mt-1">
            Check your inbox for instructions to reset your password. Redirecting to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Sending Reset Link...
              </>
            ) : 'Send Reset Link'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;

// src/components/auth/UserMenu.tsx
import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  MapPin, 
  List, 
  Star, 
  Route 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthModal from './AuthModal';
import { useNavigate } from 'react-router-dom';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.displayName) return 'U';
    
    const names = user.displayName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-gray-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/collections')}>
                <List className="mr-2 h-4 w-4" />
                <span>My Collections</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile/visited')}>
                <MapPin className="mr-2 h-4 w-4" />
                <span>Visited Plaques</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile/favorites')}>
                <Star className="mr-2 h-4 w-4" />
                <span>Favorites</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile/routes')}>
                <Route className="mr-2 h-4 w-4" />
                <span>My Routes</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="default" 
          onClick={() => setIsAuthModalOpen(true)}
          className="gap-2"
        >
          <User size={16} />
          Sign In
        </Button>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default UserMenu;

// src/components/auth/RequireAuth.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (!user) {
    // Redirect to login page, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;