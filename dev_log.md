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
  - **Repositorio GitHub creado**: [https://github.com/TeiBrito/HoraCar](https://github.com/TeiBrito/HoraCar) (rama `main`).
