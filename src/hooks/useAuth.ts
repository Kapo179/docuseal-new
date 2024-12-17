import { useState, useEffect } from 'react';
import { 
  type User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
        setError(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isRedirecting || loading) return;

    try {
      setError(null);
      setIsRedirecting(true);

      // Use popup instead of redirect for better control
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      setError((error as AuthError).message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setIsRedirecting(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      localStorage.removeItem('contract-flow');
    } catch (error) {
      console.error('Sign out error:', error);
      setError((error as AuthError).message || 'Failed to sign out');
    }
  };

  return {
    user,
    loading,
    error,
    isRedirecting,
    signInWithGoogle,
    signOut
  };
}