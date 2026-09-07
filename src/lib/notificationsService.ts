import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app, db, FIREBASE_VAPID_KEY, isFirebaseConfigured } from './firebase';
import { DriverId } from '@/types';

const STORAGE_KEY_DRIVER = 'horacar_active_driver_device';
const STORAGE_KEY_TOKEN = 'horacar_fcm_token';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getDeviceDriver(): DriverId {
  if (typeof window === 'undefined') return 'tei';
  const saved = localStorage.getItem(STORAGE_KEY_DRIVER);
  return (saved === 'adan' ? 'adan' : 'tei') as DriverId;
}

export function setDeviceDriver(driver: DriverId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DRIVER, driver);
}

export function getNotificationPermissionStatus(): PushPermissionStatus {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

/**
 * Registra el Service Worker y obtiene el token FCM de Firebase para este dispositivo
 */
export async function registerDeviceForPush(driver: DriverId): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Este navegador no soporta notificaciones push.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado en el navegador.' };
    }

    setDeviceDriver(driver);

    // Registrar el Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    if (!app) {
      return { success: true, error: 'Firebase en modo local. Notificaciones listas en cliente.' };
    }

    const messaging: Messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { success: false, error: 'No se pudo generar el token de notificación de Firebase.' };
    }

    // Guardar localmente
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    // Guardar en Firestore para que el otro conductor pueda notificarle
    if (db) {
      const tokenDocId = `${driver}_${token.slice(-16)}`;
      const tokenRef = doc(db, 'push_tokens', tokenDocId);
      await setDoc(tokenRef, {
        driver,
        token,
        userAgent: navigator.userAgent,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    return { success: true, token };
  } catch (error: any) {
    console.error('Error registrando notificaciones push:', error);
    return { success: false, error: error?.message || 'Error al activar notificaciones.' };
  }
}

/**
 * Desactiva y borra el token de este dispositivo
 */
export async function unregisterDevicePush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const driver = getDeviceDriver();

  try {
    if (db && token) {
      const tokenDocId = `${driver}_${token.slice(-16)}`;
      await deleteDoc(doc(db, 'push_tokens', tokenDocId));
    }
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    return true;
  } catch (e) {
    console.warn('Error eliminando token:', e);
    return false;
  }
}

/**
 * Envía una notificación al OTRO conductor cuando se realiza un cambio
 */
export async function notifyDriverChange(params: {
  sender: DriverId;
  title: string;
  body: string;
  type?: 'booking' | 'fuel' | 'maintenance' | 'test';
}): Promise<void> {
  const { sender, title, body, type = 'booking' } = params;

  // 1. Guardar evento en Firestore en la colección de avisos
  if (db) {
    try {
      await addDoc(collection(db, 'activity_notifications'), {
        sender,
        title,
        body,
        type,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('No se pudo registrar actividad en Firestore:', err);
    }
  }

  // 2. Disparar webhook/API de Next.js para enviar el push real a los dispositivos suscritos
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        title,
        body,
        type,
      }),
    });
  } catch (err) {
    console.warn('Error enviando notificación push a la API:', err);
  }
}

/**
 * Escucha notificaciones en primer plano cuando la web está abierta
 */
export function listenForegroundMessages(callback: (payload: { title: string; body: string }) => void): () => void {
  if (!isPushSupported() || !app) return () => {};

  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'HoraCar';
      const body = payload.notification?.body || payload.data?.body || 'Actualización en el coche';
      callback({ title, body });
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}
