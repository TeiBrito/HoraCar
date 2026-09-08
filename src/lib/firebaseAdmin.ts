import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

function initFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'horacar-494d1';
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    'firebase-adminsdk-fbsvc@horacar-494d1.iam.gserviceaccount.com';
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    console.warn('Firebase Admin: Falta FIREBASE_PRIVATE_KEY');
    return null;
  }

  // Corregir escapes de saltos de línea \n si vienen como string plano
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Error inicializando Firebase Admin SDK:', error);
    return null;
  }
}

export const adminApp = initFirebaseAdmin();
export const getAdminDb = (): Firestore | null => (adminApp ? getFirestore(adminApp) : null);
export const getAdminMessaging = (): Messaging | null =>
  adminApp ? getMessaging(adminApp) : null;
