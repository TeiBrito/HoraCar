/* eslint-disable no-undef */
// Service Worker para notificaciones push de Firebase Cloud Messaging en HoraCar
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parámetros de inicialización Firebase para segundo plano
const firebaseConfig = {
  apiKey: "AIzaSyDWIDoQh9BFV3HojoLzAYKY3d1IyLg9N1E",
  authDomain: "horacar-494d1.firebaseapp.com",
  projectId: "horacar-494d1",
  storageBucket: "horacar-494d1.firebasestorage.app",
  messagingSenderId: "941993684843",
  appId: "1:941993684843:web:974e389b4c2f11ada5662e"
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

    const title = payload.notification?.title || payload.data?.title || 'HoraCar';
    const body = payload.notification?.body || payload.data?.body || 'Nuevo cambio en el turno del coche';

    const notificationOptions = {
      body: body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: 'horacar-update',
      renotify: true,
      data: {
        url: payload.data?.url || '/',
        time: Date.now()
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Modo push pasivo:', e);
}

// Soporte push estándar de fallback
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || data.notification?.title || 'HoraCar 🚗';
      const body = data.body || data.notification?.body || 'Se ha actualizado el calendario del coche.';
      
      event.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          tag: 'horacar-update',
          renotify: true,
          data: { url: '/' }
        })
      );
    } catch (err) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('HoraCar', {
          body: text || 'Nuevo cambio registrado.',
          icon: '/logo.jpg',
          badge: '/logo.jpg'
        })
      );
    }
  }
});

// Al pulsar sobre la notificación, abre o enfoca la ventana de la app
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
