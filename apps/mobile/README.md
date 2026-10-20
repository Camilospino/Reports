# Tecnio — app del técnico

Expo (SDK 57) + Expo Router. Funciona sin señal: todo se guarda primero en SQLite y se sube a Supabase con una cola de sincronización.

## Probar en desarrollo

1. Supabase local corriendo (`npm run db:start` en la raíz).
2. Copia `.env.example` a `.env` y pon la anon key (`npx supabase status`).
   - Emulador de Android: `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`
   - Celular real en la misma Wi‑Fi: la IP del computador, por ejemplo `http://192.168.1.4:54321`
3. `npm run dev:mobile` (en la raíz) y abre la app con **Expo Go** (escanea el QR) o presiona `a` para el emulador.

Usuarios de prueba: `tecnico1@seguridadtotal.test`, `tecnico2@…`, `tecnico3@…` — contraseña `Tecnio2026!`.
Solo entran usuarios con rol técnico; el dueño y el despachador usan el panel web.

## Generar el APK para celulares de prueba

Necesita una cuenta gratis de Expo y un proyecto de Supabase en la nube (el APK no puede llegar a tu Supabase local).

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init                                   # crea el proyecto en Expo y guarda su id en app.json
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://TU-PROYECTO.supabase.co --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value TU_ANON_KEY --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SITE_URL --value https://tu-dominio.com --visibility plaintext
eas build --platform android --profile preview
```

Al terminar, EAS da un enlace y un QR para descargar el `.apk` e instalarlo directamente en el celular (perfil `preview`, distribución interna). El plan gratis de EAS incluye builds de Android con cola compartida.

## Cómo funciona sin señal

- `src/lib/db.ts`: SQLite local con las órdenes del técnico (7 días atrás y 7 adelante), el catálogo y la cola de cambios.
- `src/lib/actions.ts`: cada acción (estado con GPS, checklist, materiales, fotos comprimidas a 1600 px / 0.7, firma, cierre) se guarda en local y entra a la cola.
- `src/lib/sync.ts`: sube la cola en orden cuando hay conexión (al volver la señal, cada minuto y cuando el despachador cambia una orden). Si falla por red reintenta con espera creciente; si el servidor rechaza un cambio (por ejemplo, la orden ya estaba cerrada) queda en Perfil › "No se pudieron subir".
- Las fotos y la firma se suben antes que el cierre, así la orden nunca queda completada sin su evidencia.

## Errores en producción (Sentry, plan gratis)

1. Crea una cuenta en sentry.io y un proyecto **React Native** (`tecnio-movil`).
2. Agrega el DSN al ambiente de EAS:
   `eas env:create --environment preview --name EXPO_PUBLIC_SENTRY_DSN --value https://...ingest.sentry.io/... --visibility plaintext`
3. Para ver el código original en los errores, sube los source maps en cada build:
   `eas env:create --environment preview --name SENTRY_AUTH_TOKEN --value sntrys_... --visibility secret`
   y también `SENTRY_ORG` y `SENTRY_PROJECT` (texto plano).

Sin DSN la app no envía nada. Solo se registra el id del técnico (no su nombre ni correo), y los
enlaces de reporte se envían con el token borrado. Además de los cierres inesperados, llegan como
aviso los cambios que el servidor rechazó (los mismos que el técnico ve en Perfil).
