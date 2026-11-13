import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseActive } from '../services/firebase';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'sarah.demo@ruthai.org',
  displayName: 'Sarah Jenkins',
  isDemo: true
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (user) => {
    if (!user?.uid) {
      setUserProfile(null);
      return null;
    }

    const fallbackProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      phone: '',
      state: 'California',
      city: '',
      preferredContact: 'email',
      discreetNotifications: true,
      defaultDiscreetMode: false
    };

    // Load cached profile first
    const cachedRaw = localStorage.getItem(`ruthai_user_profile_${user.uid}`);
    let merged = fallbackProfile;
    if (cachedRaw) {
      try {
        merged = { ...fallbackProfile, ...JSON.parse(cachedRaw) };
      } catch (e) {
        console.warn('Failed to parse cached profile', e);
      }
    }

    // Fetch from Firestore users/{uid} if Firebase is active
    if (isFirebaseActive && db && !user.isDemo) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          merged = { ...merged, ...snap.data() };
          localStorage.setItem(`ruthai_user_profile_${user.uid}`, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to load Firestore profile:', err.message);
      }
    }

    setUserProfile(merged);
    return merged;
  }, []);

  useEffect(() => {
    // Check local storage for persistent guest/demo session
    const stored = localStorage.getItem('ruthai_current_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        loadUserProfile(parsed);
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
          loadUserProfile(formatted);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const loginWithDemo = () => {
    setCurrentUser(DEMO_USER);
    localStorage.setItem('ruthai_current_user', JSON.stringify(DEMO_USER));
    loadUserProfile(DEMO_USER);
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
    setUserProfile(null);
    localStorage.removeItem('ruthai_current_user');
  };

  const updateAccountProfile = async (updates) => {
    if (!currentUser?.uid) throw new Error('No authenticated user found.');

    const nextDisplayName =
      updates.displayName !== undefined ? updates.displayName.trim() : currentUser.displayName;

    // 1. Update Firebase Auth displayName if live Firebase user
    if (isFirebaseActive && auth?.currentUser && !currentUser.isDemo && nextDisplayName !== undefined) {
      await updateProfile(auth.currentUser, { displayName: nextDisplayName });
    }

    // 2. Persist profile fields to Firestore users/{uid}
    const nextProfile = {
      ...(userProfile || {}),
      ...updates,
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: nextDisplayName || ''
    };

    if (isFirebaseActive && db && !currentUser.isDemo) {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          ...nextProfile,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }

    // 3. Update local state and localStorage
    const nextUser = {
      ...currentUser,
      displayName: nextDisplayName || currentUser.displayName
    };
    setCurrentUser(nextUser);
    setUserProfile(nextProfile);
    localStorage.setItem('ruthai_current_user', JSON.stringify(nextUser));
    localStorage.setItem(`ruthai_user_profile_${currentUser.uid}`, JSON.stringify(nextProfile));

    return {
      profile: nextProfile,
      persistedToFirebase: Boolean(isFirebaseActive && db && !currentUser.isDemo)
    };
  };

  const updateLoginCredentials = async ({ newEmail, currentPassword, newPassword }) => {
    if (!currentUser?.uid) throw new Error('No authenticated user found.');

    const trimmedEmail = newEmail?.trim();
    const emailChanged = Boolean(trimmedEmail && trimmedEmail !== currentUser.email);
    const passwordChanged = Boolean(newPassword && newPassword.length > 0);

    if (!emailChanged && !passwordChanged) {
      return { updated: false, persistedToFirebase: false };
    }

    if (isFirebaseActive && auth?.currentUser && !currentUser.isDemo) {
      // Re-authenticate if currentPassword was provided
      if (currentPassword && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      if (emailChanged) {
        await updateEmail(auth.currentUser, trimmedEmail);
      }

      if (passwordChanged) {
        await updatePassword(auth.currentUser, newPassword);
      }

      if (db && emailChanged) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          { email: trimmedEmail, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    }

    // Update local state & storage
    const nextUser = {
      ...currentUser,
      email: emailChanged ? trimmedEmail : currentUser.email
    };
    const nextProfile = {
      ...(userProfile || {}),
      email: nextUser.email
    };

    setCurrentUser(nextUser);
    setUserProfile(nextProfile);
    localStorage.setItem('ruthai_current_user', JSON.stringify(nextUser));
    localStorage.setItem(`ruthai_user_profile_${currentUser.uid}`, JSON.stringify(nextProfile));

    return {
      updated: true,
      persistedToFirebase: Boolean(isFirebaseActive && auth?.currentUser && !currentUser.isDemo)
    };
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    isFirebaseLive: Boolean(isFirebaseActive && db && !currentUser?.isDemo),
    signIn,
    signUp,
    loginWithGoogle,
    loginWithDemo,
    logout,
    updateAccountProfile,
    updateLoginCredentials
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
