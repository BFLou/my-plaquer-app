// src/components/auth/AuthErrorDisplay.tsx
import React from 'react';
import { AlertTriangle, RefreshCw, Key, UserPlus, LogIn } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage, getSuggestedActions, ErrorDisplayProps } from '@/utils/authErrorHandler';

const AuthErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  email,
  context = 'signin',
  onRetry,
  onResetPassword,
  onSwitchToSignUp,
  onSwitchToSignIn
}) => {
  if (!error) return null;

  const errorInfo = getAuthErrorMessage(error, email);
  const suggestedActions = getSuggestedActions(error, email);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'retry': return <RefreshCw size={14} />;
      case 'reset': return <Key size={14} />;
      case 'signup': return <UserPlus size={14} />;
      case 'signin': return <LogIn size={14} />;
      default: return null;
    }
  };

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'retry':
        onRetry?.();
        break;
      case 'reset':
        if (email && onResetPassword) {
          onResetPassword(email);
        }
        break;
      case 'signup':
        onSwitchToSignUp?.();
        break;
      case 'signin':
        onSwitchToSignIn?.();
        break;
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div>
          <p className="font-medium">{errorInfo.message}</p>
          {errorInfo.action && (
            <p className="text-sm mt-1 opacity-90">{errorInfo.action}</p>
          )}
        </div>
        
        {suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedActions.map((action) => (
              <Button
                key={action.type}
                variant="outline"
                size="sm"
                onClick={() => handleActionClick(action.type)}
                className="h-8 text-xs bg-white border-red-200 text-red-700 hover:bg-red-50"
              >
                {getActionIcon(action.type)}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default AuthErrorDisplay;