// src/utils/authErrorHandler.ts
export interface AuthErrorInfo {
  message: string;
  action?: string;
  canRetry?: boolean;
  canResetPassword?: boolean;
  canSwitchMethod?: boolean;
  suggestedMethods?: string[];
}

export const getAuthErrorMessage = (
  error: any,
  email?: string
): AuthErrorInfo => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  switch (errorCode) {
    case 'auth/invalid-credential':
      return {
        message:
          'The email or password you entered is incorrect. Please check your credentials and try again.',
        action: 'Double-check your email and password',
        canRetry: true,
        canResetPassword: true,
      };

    case 'auth/user-not-found':
      return {
        message: email
          ? `No account found with ${email}. Would you like to create a new account?`
          : 'No account found with this email address. Would you like to create a new account?',
        action: 'Create a new account or check your email address',
        canRetry: true,
        canSwitchMethod: true,
      };

    case 'auth/wrong-password':
      return {
        message:
          'The password you entered is incorrect. Please try again or reset your password.',
        action: 'Try again or reset your password',
        canRetry: true,
        canResetPassword: true,
      };

    case 'auth/invalid-email':
      return {
        message: 'Please enter a valid email address.',
        action: 'Check your email format',
        canRetry: true,
      };

    case 'auth/user-disabled':
      return {
        message: email
          ? `The account for ${email} has been temporarily disabled. Please contact support for assistance.`
          : 'This account has been temporarily disabled. Please contact support for assistance.',
        action: 'Contact support',
        canRetry: false,
      };

    case 'auth/too-many-requests':
      return {
        message:
          'Too many unsuccessful attempts. Please wait a few minutes before trying again.',
        action: 'Wait a few minutes and try again',
        canRetry: true,
        canResetPassword: true,
      };

    case 'auth/email-already-in-use':
      return {
        message: email
          ? `An account with ${email} already exists. Please sign in instead.`
          : 'An account with this email already exists. Please sign in instead.',
        action: 'Sign in to your existing account',
        canRetry: false,
        canSwitchMethod: true,
      };

    case 'auth/weak-password':
      return {
        message:
          'Password is too weak. Please choose a stronger password with at least 8 characters.',
        action: 'Create a stronger password',
        canRetry: true,
      };

    case 'auth/account-exists-with-different-credential':
      return {
        message: email
          ? `An account with ${email} exists but uses a different sign-in method.`
          : 'An account with this email exists but uses a different sign-in method.',
        action: 'Try signing in with a different method',
        canRetry: false,
        canSwitchMethod: true,
        suggestedMethods: ['Google', 'Email & Password'],
      };

    case 'auth/popup-closed-by-user':
      return {
        message: 'Sign-in was cancelled. Please try again.',
        action: 'Try signing in again',
        canRetry: true,
      };

    case 'auth/popup-blocked':
      return {
        message:
          'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.',
        action: 'Allow pop-ups and try again',
        canRetry: true,
      };

    case 'auth/cancelled-popup-request':
      return {
        message: 'Sign-in was cancelled. Please try again.',
        action: 'Try signing in again',
        canRetry: true,
      };

    case 'auth/network-request-failed':
      return {
        message:
          'Network error. Please check your internet connection and try again.',
        action: 'Check your connection and retry',
        canRetry: true,
      };

    case 'auth/internal-error':
      return {
        message:
          'Something went wrong on our end. Please try again in a moment.',
        action: 'Try again in a moment',
        canRetry: true,
      };

    case 'auth/requires-recent-login':
      return {
        message:
          'For security reasons, please sign out and sign in again before making this change.',
        action: 'Sign out and sign in again',
        canRetry: false,
      };

    case 'auth/credential-already-in-use':
      return {
        message: 'This credential is already associated with another account.',
        action: 'Use a different account or contact support',
        canRetry: false,
      };

    case 'auth/invalid-verification-code':
      return {
        message:
          'The verification code is invalid. Please check the code and try again.',
        action: 'Check the verification code',
        canRetry: true,
      };

    case 'auth/invalid-verification-id':
      return {
        message: 'The verification session has expired. Please start over.',
        action: 'Start the verification process again',
        canRetry: false,
      };

    // Custom error for account linking scenarios
    case 'auth/email-exists-with-different-method':
      return {
        message: email
          ? `An account with ${email} already exists using a different sign-in method.`
          : 'An account with this email already exists using a different sign-in method.',
        action: 'Sign in with your existing method',
        canRetry: false,
        canSwitchMethod: true,
      };

    default:
      // Fallback for unknown errors
      if (errorMessage.toLowerCase().includes('network')) {
        return {
          message:
            'Network error. Please check your internet connection and try again.',
          action: 'Check your connection and retry',
          canRetry: true,
        };
      }

      if (errorMessage.toLowerCase().includes('credential')) {
        return {
          message:
            'The email or password you entered is incorrect. Please check your credentials and try again.',
          action: 'Double-check your email and password',
          canRetry: true,
          canResetPassword: true,
        };
      }

      return {
        message:
          'Something went wrong. Please try again or contact support if the problem persists.',
        action: 'Try again or contact support',
        canRetry: true,
      };
  }
};

// Helper function to get specific error message for common scenarios
export const getSpecificErrorMessage = (
  error: any,
  context: 'signin' | 'signup' | 'reset' = 'signin'
): string => {
  const errorInfo = getAuthErrorMessage(error);

  // Customize message based on context
  if (context === 'signin' && error?.code === 'auth/user-not-found') {
    return "We couldn't find an account with this email. Would you like to create a new account instead?";
  }

  if (context === 'signup' && error?.code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead or use a different email.';
  }

  return errorInfo.message;
};

// Enhanced error component props
export interface ErrorDisplayProps {
  error: any;
  email?: string;
  context?: 'signin' | 'signup' | 'reset';
  onRetry?: () => void;
  onResetPassword?: (email: string) => void;
  onSwitchToSignUp?: () => void;
  onSwitchToSignIn?: () => void;
}

// Helper to determine if error suggests switching auth methods
export const shouldSuggestAuthMethodSwitch = (error: any): boolean => {
  const switchCodes = [
    'auth/user-not-found',
    'auth/email-already-in-use',
    'auth/account-exists-with-different-credential',
    'auth/email-exists-with-different-method',
  ];

  return switchCodes.includes(error?.code);
};

// Helper to get suggested actions based on error
export const getSuggestedActions = (error: any, email?: string) => {
  const errorInfo = getAuthErrorMessage(error, email);
  const actions = [];

  if (errorInfo.canRetry) {
    actions.push({ type: 'retry', label: 'Try Again' });
  }

  if (errorInfo.canResetPassword && email) {
    actions.push({ type: 'reset', label: 'Reset Password' });
  }

  if (errorInfo.canSwitchMethod) {
    if (error?.code === 'auth/user-not-found') {
      actions.push({ type: 'signup', label: 'Create Account' });
    } else if (error?.code === 'auth/email-already-in-use') {
      actions.push({ type: 'signin', label: 'Sign In Instead' });
    }
  }

  return actions;
};

// Helper to format error messages with user context
export const formatErrorWithContext = (
  error: any,
  userEmail?: string,
  userName?: string
): string => {
  const errorInfo = getAuthErrorMessage(error, userEmail);

  // Add user context to error messages when available
  if (userName && userEmail) {
    return errorInfo.message.replace(
      /this email/g,
      `${userName}'s email (${userEmail})`
    );
  } else if (userEmail) {
    return errorInfo.message.replace(/this email/g, userEmail);
  }

  return errorInfo.message;
};

// Helper to get user-friendly error title
export const getErrorTitle = (error: any): string => {
  const errorCode = error?.code || '';

  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect Login';

    case 'auth/user-not-found':
      return 'Account Not Found';

    case 'auth/email-already-in-use':
      return 'Account Already Exists';

    case 'auth/weak-password':
      return 'Weak Password';

    case 'auth/too-many-requests':
      return 'Too Many Attempts';

    case 'auth/user-disabled':
      return 'Account Disabled';

    case 'auth/network-request-failed':
      return 'Connection Error';

    case 'auth/popup-blocked':
    case 'auth/popup-closed-by-user':
      return 'Sign-in Interrupted';

    default:
      return 'Authentication Error';
  }
};
