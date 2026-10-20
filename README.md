# Tecnio

Órdenes de trabajo para empresas de servicio técnico: panel web (Next.js) para el dueño y el
despachador, app del técnico (Expo) que funciona sin señal, y Supabase con RLS por empresa.

```
apps/web       Panel, reporte público /r/[token] y cotización pública /c/[token]
apps/mobile    App del técnico (ver apps/mobile/README.md)
packages/db    Tipos generados de la base de datos
supabase/      Migraciones, seed y pruebas de aislamiento (pgTAP)
```

## Correr en local

1. `npm install`
2. `npm run db:start` (Docker) y luego `npm run db:reset` para cargar los datos de prueba.
3. Copia `apps/web/.env.example` a `apps/web/.env.local` con los valores de `npx supabase status`.
4. `npm run dev:web` → http://localhost:4000

Usuarios de prueba (contraseña `Tecnio2026!`): `dueno@seguridadtotal.test`, `despacho@seguridadtotal.test`,
`tecnico1@seguridadtotal.test`… y lo mismo con `@frioexpress.test` (segunda empresa, para probar el aislamiento).

## Verificar antes de publicar

`npm run check`: pruebas de aislamiento entre empresas (136 casos; recorren **todas** las tablas con
`company_id`, así que una tabla nueva queda cubierta), tipos de web y móvil, y lint.

## Inventario

El stock no se edita a mano: cambia con movimientos (entrada, salida o conteo físico, desde
Inventario) y se descuenta solo cuando una orden pasa a completada. Si la orden se reabre o se le
cambian materiales, la diferencia se devuelve o se descuenta. Todo queda en `stock_movements`.
Materiales y tipos de servicio se archivan en vez de borrarse, para no romper órdenes viejas.

## Seguridad

- Cada tabla tiene `company_id` y RLS. El navegador y el celular solo usan la llave pública (anon).
- La llave secreta (`SUPABASE_SECRET_KEY`) solo existe en el servidor (`import "server-only"`): se usa
  para invitar al equipo y para entregar las fotos del reporte público después de validar el token.
- El cliente final no tiene cuenta: el reporte y la cotización salen de funciones `security definer`
  que reciben el token (32 caracteres hexadecimales).

## Errores en producción (Sentry, plan gratis)

1. En sentry.io crea un proyecto **Next.js** (`tecnio-web`).
2. En el hosting define `NEXT_PUBLIC_SENTRY_DSN` y, para ver el código original en los errores,
   `SENTRY_ORG`, `SENTRY_PROJECT` y `SENTRY_AUTH_TOKEN` (este último es secreto; solo lo usa el build).

Sin DSN no se envía nada. Solo se envían errores (sin trazas de rendimiento, para cuidar la cuota),
sin IP, cookies ni formularios, y los tokens de `/r/…` y `/c/…` se borran antes de salir.
Los errores del navegador pasan por `/monitoreo` en el propio dominio para que no los bloqueen.
