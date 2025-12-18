/**
 * Maps Firebase Auth error codes to user-friendly error messages.
 * @param {Object} error - The error object from Firebase Auth.
 * @returns {string} A user-friendly error message.
 */
export function getAuthErrorMessage(error) {
  const code = error?.code;

  switch (code) {
    // Login errors
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid phone number or password. Please check your details and try again.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';

    // Signup errors
    case 'auth/email-already-in-use':
      return 'This phone number is already registered. Try logging in instead.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    
    case 'auth/operation-not-allowed':
      return 'Phone/Password authentication is not enabled. Please contact support.';

    // Network/General errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again later.';

    default:
      // Log the original error for debugging but show a generic message to the user
      console.error('Unhandled Auth Error:', error);
      return 'An unexpected error occurred. Please try again.';
  }
}
