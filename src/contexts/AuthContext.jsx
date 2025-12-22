'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signUp as authSignUp, signIn as authSignIn, signOut as authSignOut, signInWithGoogle as authSignInWithGoogle } from '@/lib/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: onAuthStateChanged - user:', firebaseUser?.email || 'null');
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile({ id: userDoc.id, ...userDoc.data() });
          } else {
            // New user (Google auth but no Firestore doc yet)
            setUserProfile({ id: firebaseUser.uid, isNew: true });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({ id: firebaseUser.uid, isNew: true }); // Fallback
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (phone, password, displayName) => {
    const user = await authSignUp(phone, password, displayName);
    return user;
  };

  const signIn = async (phone, password) => {
    const user = await authSignIn(phone, password);
    return user;
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setUserProfile(null);
  };

  const signInWithGoogle = async () => {
    const user = await authSignInWithGoogle();
    return user;
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    authError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
