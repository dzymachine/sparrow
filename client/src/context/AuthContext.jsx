import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseActive } from '../services/firebase';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'sarah.demo@ruthai.org',
  displayName: 'Sarah Jenkins',
  isDemo: true
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent guest/demo session
    const stored = localStorage.getItem('ruthai_current_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    }

    if (isFirebaseActive && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const formatted = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            photoURL: firebaseUser.photoURL,
            isDemo: false
          };
          setCurrentUser(formatted);
          localStorage.setItem('ruthai_current_user', JSON.stringify(formatted));
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithDemo = () => {
    setCurrentUser(DEMO_USER);
    localStorage.setItem('ruthai_current_user', JSON.stringify(DEMO_USER));
    return DEMO_USER;
  };

  const signIn = async (email, password) => {
    if (isFirebaseActive && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } else {
      // Local development mock authentication
      const user = {
        uid: 'user-' + Date.now(),
        email,
        displayName: email.split('@')[0],
        isDemo: false
      };
      setCurrentUser(user);
      localStorage.setItem('ruthai_current_user', JSON.stringify(user));
      return user;
    }
  };

  const signUp = async (email, password, displayName) => {
    if (isFirebaseActive && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    } else {
      const user = {
        uid: 'user-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        isDemo: false
      };
      setCurrentUser(user);
      localStorage.setItem('ruthai_current_user', JSON.stringify(user));
      return user;
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseActive && auth && googleProvider) {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } else {
      const user = {
        uid: 'google-user-' + Date.now(),
        email: 'evaluator.google@example.com',
        displayName: 'Google Dev Account',
        isDemo: true
      };
      setCurrentUser(user);
      localStorage.setItem('ruthai_current_user', JSON.stringify(user));
      return user;
    }
  };

  const logout = async () => {
    if (isFirebaseActive && auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('ruthai_current_user');
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    loginWithGoogle,
    loginWithDemo,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
