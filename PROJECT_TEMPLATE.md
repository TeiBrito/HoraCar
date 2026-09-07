# HoraCar Architecture & Starter Template Blueprint 🚀

Documento de referencia para replicar la arquitectura, patrones y diseño de **HoraCar** en nuevos proyectos colaborativos o de gestión compartida.

---

## 1. Stack Tecnológico Base

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript.
- **Estilos**: Vanilla CSS Modules + Design System con variables CSS globales en `:root` (`src/styles/globals.css`).
- **Base de Datos & Tiempo Real**: Firebase Cloud Firestore (v10 SDK modular) con arquitectura reactiva basada en `onSnapshot` y fallback transparente en `localStorage`.
- **Iconos**: `lucide-react`.
- **PWA Ready**: `manifest.json` y meta tags táctiles preparados para instalar en Android / iOS.
- **Despliegue**: Optimizado para Vercel (`next build`, cero dependencias nativas o pesadas).

---

## 2. Decisiones de Arquitectura Clave

### A. Autenticación Cero-Fricción (Zero-Auth / Direct Switcher)
- En lugar de flujos de registro/login pesados, se utiliza un selector rápido de perfil activo (ej. Tei / Adán).
- El perfil activo se almacena en `localStorage` o estado global para prefijar acciones, pero cualquier usuario puede interactuar directamente.

### B. Patrón de Servicio Reactivo con Firestore + Fallback Local
Cada entidad (ej. `bookingsService.ts`, `maintenanceService.ts`) expone:
1. **Suscripción en tiempo real**: `subscribe(callback)` usando `onSnapshot(collection(...))`.
2. **Fallback Offline/Sin Configuración**: Si Firebase no está configurado o no tiene conexión, lee y escribe inmediatamente en `localStorage`, disparando un `CustomEvent` para sincronizar las pestañas locales sin romper la UI.
3. **Persistencia Híbrida**: Al guardar/editar/borrar, opera contra Firestore si está activo y actualiza la caché local.

Ejemplo de estructura de servicio:
```typescript
import { db, isFirebaseAvailable } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export function subscribeItems(callback: (items: Item[]) => void): () => void {
  if (isFirebaseAvailable() && db) {
    const unsubscribe = onSnapshot(collection(db, 'items'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      localStorage.setItem('local_items', JSON.stringify(data));
      callback(data);
    }, (err) => {
      console.warn('Firestore error, fallback to local', err);
      callback(getLocalItems());
    });
    return unsubscribe;
  } else {
    callback(getLocalItems());
    const handler = () => callback(getLocalItems());
    window.addEventListener('storage', handler);
    window.addEventListener('local_items_updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('local_items_updated', handler);
    };
  }
}
```

### C. Sistema de Diseño (Editorial Minimalista Grafito)
- **Cero neón / Cero emojis en interfaz corporativa**: Tipografía limpia del sistema, microinteracciones sutiles con `cubic-bezier(0.16, 1, 0.3, 1)`, bordes translucidos (`rgba(255,255,255, 0.07)` a `0.14`), fondos en capas (`#0c0e14` -> `#141824` -> `#1c2233`).
- **Paleta de Identidad Bipolar/Multiusuario**:
  - Usuario 1: Acento Índigo / Cobalto (`#6366f1`).
  - Usuario 2: Acento Esmeralda / Salvia (`#10b981`).
  - Avisos / Peligro: Rojo Coral (`#ef4444`).

### D. Ergonomía Móvil y Viewport Seguro
Todos los modales y componentes emergentes deben implementar contención de altura dinámica para evitar que el teclado o la barra del navegador tape botones de confirmación:
```css
.modalOverlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top, 1rem) 1rem env(safe-area-inset-bottom, 1rem);
  z-index: 1000;
}

.modalContent {
  width: 100%;
  max-width: 520px;
  max-height: min(90vh, calc(100dvh - 2rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.modalBody {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem;
}
```

---

## 3. Estructura de Carpetas Recomendada

```text
├── public/
│   ├── manifest.json
│   ├── icon.svg
│   └── logo.jpg
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Metadatos, viewport PWA, fuentes
│   │   ├── page.tsx           # Dashboard principal con orquestación
│   │   └── page.module.css
│   ├── components/
│   │   ├── Header.tsx         # Selector de usuario + estado de sincronización
│   │   ├── UI/                # Componentes comunes (Botones, Modales, Badges)
│   │   └── [Feature]/         # Módulos aislados (ej. Calendar, Maintenance, etc.)
│   ├── lib/
│   │   ├── firebase.ts        # Inicialización de Firebase v10
│   │   └── [feature]Service.ts # Servicios CRUD reactivos
│   ├── styles/
│   │   └── globals.css        # Tokens de diseño y reset
│   └── types/
│       └── index.ts           # Interfaces TypeScript unificadas
├── dev_log.md                 # Registro histórico de cambios y sesiones
├── package.json
└── tsconfig.json
```

---

## 4. Pasos Rápidos para Inicializar un Nuevo Proyecto

1. **Crear base Next.js con TypeScript**:
   ```bash
   npx create-next-app@latest . --typescript --no-tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. **Instalar dependencias necesarias**:
   ```bash
   npm install firebase lucide-react
   ```
3. **Copiar tokens de diseño**:
   - Reemplazar `src/styles/globals.css` con la plantilla de variables de HoraCar.
4. **Configurar Firebase**:
   - Copiar `src/lib/firebase.ts`.
   - Definir variables de entorno en `.env.local` (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.).
5. **Configurar dev log**:
   - Inicializar `dev_log.md` para mantener el historial del nuevo desarrollo.
