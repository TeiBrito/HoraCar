# HoraCar 🚗💨

Aplicación web minimalista y moderna para coordinar el uso compartido del coche entre **Tei** y **Adán** en tiempo real.

## Características

- **Sin fricción de logins**: Elige el conductor (Tei o Adán) al asignar cada turno.
- **Franjas horarias**: Día completo, Mañana (07:00–14:00), Tarde (14:00–20:00) y Noche.
- **Detección de conflictos**: Avisos visuales si ambos coinciden en el mismo día o franja.
- **Sincronización en tiempo real**: Con Google Firebase Cloud Firestore (`onSnapshot`).
- **Modo Offline / Local Fallback**: Funciona de inmediato en local incluso sin configurar claves.
- **Estadísticas de uso y equidad**: Balance mensual de turnos de cada conductor.
- **Diseño Editorial & Mobile-First**: Look minimalista y limpio con iconos vectoriales SVG (cero emojis y sin estilos neón saturados).
- **Instalable (PWA)**: Añadible a la pantalla de inicio del teléfono como app nativa.

---

## 🚀 Despliegue en Vercel

1. Sube este repositorio a **GitHub**.
2. Entra en [Vercel](https://vercel.com) y pulsa en **Add New Project** -> **Import Git Repository**.
3. En la sección **Environment Variables**, añade tus credenciales de Firebase (opcional, o déjalas para más tarde):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Pulsa **Deploy** ¡y listo!

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
