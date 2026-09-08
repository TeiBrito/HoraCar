import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { app, db, FIREBASE_VAPID_KEY } from './firebase';
import { DriverId } from '@/types';

const STORAGE_KEY_DRIVER = 'horacar_active_driver_device';
const STORAGE_KEY_TOKEN = 'horacar_fcm_token';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
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

    // Disparar una notificación de bienvenida inmediata
    try {
      registration.showNotification('HoraCar: Avisos Activos', {
        body: `Notificaciones conectadas correctamente para ${driver === 'tei' ? 'Tei' : 'Adán'}.`,
        icon: '/logo.jpg',
        badge: '/logo.jpg',
      });
    } catch (e) {
      console.log('Notificación de bienvenida mostrada');
    }

    if (!app) {
      return { success: true, token: 'local_token' };
    }

    let fcmToken: string | undefined;
    try {
      const messaging: Messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        fcmToken = token;
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        if (db) {
          // Usar identificador único por token para evitar duplicados si se cambia de conductor
          const tokenDocId = `token_${token.slice(-24)}`;
          const tokenRef = doc(db, 'push_tokens', tokenDocId);
          await setDoc(
            tokenRef,
            {
              driver,
              token,
              userAgent: navigator.userAgent,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
    } catch (fcmErr) {
      console.warn('FCM Token aviso:', fcmErr);
    }

    return { success: true, token: fcmToken };
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

  try {
    if (db && token) {
      const tokenDocId = `token_${token.slice(-24)}`;
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
  targetDriver?: DriverId;
  title: string;
  body: string;
  type?: 'booking' | 'fuel' | 'maintenance' | 'test';
}): Promise<void> {
  const { sender, targetDriver, title, body, type = 'booking' } = params;

  // 1. Guardar evento en Firestore en tiempo real
  if (db) {
    try {
      await addDoc(collection(db, 'activity_notifications'), {
        sender,
        targetDriver: targetDriver || (sender === 'tei' ? 'adan' : 'tei'),
        title,
        body,
        type,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('No se pudo registrar actividad en Firestore:', err);
    }
  }

  // 2. Disparar API de Next.js
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        targetDriver,
        title,
        body,
        type,
      }),
    });
  } catch (err) {
    console.warn('Error enviando push a /api/notify:', err);
  }
}

/**
 * Suscripción reactiva en tiempo real a los avisos de Firestore
 */
export function subscribeToLiveNotifications(
  _driver?: DriverId,
  callback?: (notification: { title: string; body: string; type: string }) => void
): () => void {
  if (!db) return () => {};

  const startedAt = Date.now();
  const notifCol = collection(db, 'activity_notifications');
  const q = query(notifCol, orderBy('timestamp', 'desc'), limit(5));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const activeDriver = getDeviceDriver();
        // Solo avisar si el cambio viene del OTRO conductor y fue emitido después de abrir la app
        if (data.sender !== activeDriver && data.timestamp && data.timestamp >= startedAt - 3000) {
          if (callback) {
            callback({
              title: data.title || 'HoraCar',
              body: data.body || 'Nuevo cambio',
              type: data.type || 'update',
            });
          }

          // Disparar notificación del sistema operativo
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(data.title || 'HoraCar', {
                    body: data.body || 'Nuevo cambio en el coche',
                    icon: '/logo.jpg',
                    badge: '/logo.jpg',
                    tag: 'horacar-live',
                  });
                });
              } else {
                new Notification(data.title || 'HoraCar', {
                  body: data.body || 'Nuevo cambio en el coche',
                  icon: '/logo.jpg',
                });
              }
            } catch (notifErr) {
              console.log('Push local emitido:', notifErr);
            }
          }
        }
      }
    });
  });

  return unsubscribe;
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
