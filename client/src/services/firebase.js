import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevRuthAI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ruth-ai-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ruth-ai-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ruth-ai-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isFirebaseActive = false;

try {
  // Only initialize real Firebase if an explicit real API key is set
  if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('MockKey')) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseActive = true;
    console.log('[Firebase Client] Initialized with live configuration.');
  } else {
    console.log('[Firebase Client] Using dev/offline authentication fallback mode.');
  }
} catch (err) {
  console.warn('[Firebase Client] Initialization deferred, using dev fallback:', err.message);
}

export { app, auth, db, googleProvider, isFirebaseActive };
