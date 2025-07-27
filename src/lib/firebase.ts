
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

const initializeFirebase = () => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
};

// Initialize Firebase only on the client side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export const getFirebaseAuth = (): Auth => {
  // This function now simply returns the auth instance.
  // It assumes initialization has happened.
  // If called on the server, it might return undefined if not initialized,
  // but since all usages are in client components, this should be safe.
  if (!auth) {
    // This is a fallback for scenarios where the module is loaded, but initialization hasn't run for some reason.
    // This can happen in some HMR (Hot Module Replacement) scenarios during development.
    initializeFirebase();
  }
  return auth;
};
