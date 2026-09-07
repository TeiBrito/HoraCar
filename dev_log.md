# Dev Log - HoraCar 🚗💨

## Sesión: 2026-09-04
- **Estado inicial**: Inicio del proyecto HoraCar.
- **Objetivo**: Crear una aplicación web para coordinar el uso compartido del coche entre **Tei** y **Adán**, lista para desplegar en Vercel.
- **Decisiones tomadas**:
  - **Base de datos**: Google Firebase (Cloud Firestore) con sincronización en tiempo real (`onSnapshot`) y fallback local transparente.
  - **Autenticación**: Sin login tradicional (fricción cero). Al seleccionar una fecha/franja se elige directamente quién la ocupa (Tei o Adán).
  - **Diseño**: Minimalismo editorial sofisticado en tonos grafito/pizarra y neutros cálidos. **Cero emojis/emoticonos** en la interfaz y **cero temas neón/cyberpunk saturados**.
- **Componentes y archivos creados**:
  - `src/types/index.ts`: Tipos para conductores, turnos y reservas.
  - `src/lib/firebase.ts`: Inicialización segura de Firebase Firestore.
  - `src/lib/bookingsService.ts`: Servicio reactivo para guardar, editar, borrar y sincronizar reservas.
  - `src/components/Header.tsx` & `header.module.css`: Cabecera con selector de conductor y estado de sincronización.
  - `src/components/Calendar/CalendarView.tsx` & `calendar.module.css`: Calendario mensual táctil e interactivo.
  - `src/components/BookingModal/BookingModal.tsx` & `modal.module.css`: Modal de gestión de turnos con detección de conflictos.
  - `src/components/Upcoming/UpcomingList.tsx` & `upcoming.module.css`: Listado cronológico de próximos turnos.
  - `src/components/Stats/StatsSummary.tsx` & `stats.module.css`: Indicador de equidad y desglose mensual.
  - `src/components/FirebaseModal/FirebaseConfigModal.tsx`: Asistente de configuración de Firebase.
  - `public/manifest.json` y `public/icon.svg`: Soporte PWA para instalar en smartphone.
  - `README.md` & `.gitignore`: Guía de despliegue directo en Vercel.
  - `package.json`: Configurado puerto de desarrollo alternativo `3030` (`next dev -p 3030`).
  - `BookingModal`: Añadido selector de **Rango de días / Varios días** con atajos rápidos (+ Fin de semana, + 3 días, + 1 semana) y detección de conflictos acumulada.
  - **Identidad visual**: Creado logo vintage clásico automovilístico (emblema con silueta clásica y reloj heritage) integrado en favicon, cabecera de la app y manifest PWA (`/logo.jpg`).
  - **Repositorio GitHub**: [https://github.com/TeiBrito/HoraCar](https://github.com/TeiBrito/HoraCar) (rama `main`).

## Sesión: 2026-09-05
- **Objetivo**: Añadir módulo de mantenimiento del vehículo: ITV, Revisiones de taller, Seguro, Neumáticos y Gastos/Varios.
- **Implementado**:
  - `src/types/index.ts`: Añadidos tipos `MaintenanceItem`, `MaintenanceType` ('itv' | 'revision' | 'insurance' | 'tires' | 'other') y `MaintenanceResponsible` ('tei' | 'adan' | 'both' | 'none').
  - `src/lib/maintenanceService.ts`: Servicio reactivo con Firebase Firestore y fallback en `localStorage`.
  - `src/components/Maintenance/MaintenanceSection.tsx`: Vista con pestañas (Pendientes vs Historial), contadores de urgencia/días restantes y badge de conductor encargado.
  - `src/components/Maintenance/MaintenanceModal.tsx`: Modal para crear/editar mantenimientos con selección de tipo, fecha, encargado, coste y kilometraje.
  - `src/components/Calendar/CalendarView.tsx`: Integración de avisos de taller e ITV directamente en los días del calendario.
  - `src/components/Header.tsx`: Pestañas para alternar entre "Turnos y Calendario" y "Mantenimiento & ITV" con contador de alertas pendientes.
  - `src/components/FuelTurn/FuelToggleWidget.tsx`: Widget de **Interruptor Táctil de Turno de Gasolina** para alternar entre Tei y Adán con sincronización en tiempo real (`settings/fuel_turn`), fondo deslizante y badge alineado a la derecha.
- **Correcciones y optimizaciones móviles**:
  - `src/components/BookingModal/modal.module.css`: Corregido el bloqueo de scroll en smartphones al seleccionar "Rango / Varios Días". Se ha añadido contención de viewport (`max-height: min(90vh, calc(100dvh - 2rem))` y `calc(100dvh - 1rem)` en móviles), scroll interno fluido (`overflow-y: auto`, `-webkit-overflow-scrolling: touch`), cabecera anclada y espaciados compactos para garantizar acceso inmediato al botón de confirmación.
  - `src/components/Maintenance/maintenanceModal.module.css` y `src/components/FirebaseModal/firebaseModal.module.css`: Aplicada la misma arquitectura responsiva y fluida para asegurar desplazamiento táctil perfecto en todas las pantallas.
- **Estado final**: Aplicación completa, optimizada y sincronizada en tiempo real con Firebase Firestore y Vercel.

## Sesión: 2026-09-07
- **Objetivo**: Integrar sistema de notificaciones push en vivo con Firebase Cloud Messaging (FCM) y Web Push para alertar en tiempo real a Tei y Adán ante cualquier cambio, y vincular la base de datos de producción `horacar-494d1` con experiencia sin fricción (cero configuración manual para el usuario).
- **Implementado**:
  - `src/lib/firebase.ts`: Credenciales embebidas por defecto para el proyecto `horacar-494d1` y VAPID Key pública. La app se conecta a Firestore y FCM inmediatamente en cualquier dispositivo o despliegue sin requerir configuración manual.
  - `public/firebase-messaging-sw.js`: Service Worker dedicado para gestionar recepciones push en segundo plano con las credenciales del proyecto `horacar-494d1`, badges, icono de app y foco táctil al pulsar la notificación.
  - `src/lib/notificationsService.ts`: Servicio reactivo para pedir permisos de navegador, registrar tokens FCM por conductor (`push_tokens` en Firestore y `localStorage`), emitir notificaciones cruzadas y escuchar mensajes en primer plano.
  - `src/app/api/notify/route.ts`: Endpoint dinámico en Next.js para despachar avisos automáticos entre Tei y Adán.
  - `src/lib/bookingsService.ts`, `src/lib/fuelService.ts` y `src/lib/maintenanceService.ts`: Integrado el disparador de notificaciones automático en la creación/edición/borrado de turnos, cambio de turno de repostaje y avisos de taller/ITV.
  - `src/app/page.tsx` & `page.module.css`: Creado banner superior de 1 solo toque (*"Avisos en el móvil: [Soy Tei] [Soy Adán]"*) para activación instantánea de notificaciones push sin menús técnicos.
  - `src/components/Notifications/NotificationModal.tsx` & `notificationsModal.module.css`: Modal táctil con selector de identidad de dispositivo ("Soy Tei" / "Soy Adán"), estado de permisos y botón para lanzar notificación de prueba.
  - `src/components/Header.tsx` & `header.module.css`: Integrado botón con campana de avisos en la cabecera indicando el conductor activo registrado en el dispositivo.
- **Estado del build**: Verificado y compilado sin errores con `next build`. Conectado y listo para producción sin fricción.
