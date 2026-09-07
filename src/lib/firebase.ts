import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWIDoQh9BFV3HojoLzAYKY3d1IyLg9N1E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "horacar-494d1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "horacar-494d1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "horacar-494d1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "941993684843",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:941993684843:web:974e389b4c2f11ada5662e",
};

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  'BAh9Ab2zFSlnyrcuKu6C_vlS6JDqaqi8pTgF4Q2u2hB1unkdq2QOUrG1yTISW9j-MJKA5CwuobyJvOrlYUM8xII';

export const isFirebaseConfigured = true;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Error inicializando Firebase:', error);
  }
}

export { app, db };
