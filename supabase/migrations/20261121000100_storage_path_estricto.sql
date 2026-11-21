-- Rutas de archivos con forma estricta. La CHECK original solo pedía el prefijo
-- {company_id}/{work_order_id}/ y que no hubiera ".." literal: dejaba pasar "%2e%2e", y el reporte
-- público descarga esas rutas con la llave service-role (storage-js no las codifica), lo que
-- permitía salir del bucket y leer cualquier cosa de Supabase saltándose RLS.
-- Ahora el archivo es un solo segmento: {uuid o id}.{ext}, sin "%", "/", "\", "?", "#" ni puntos extra.
-- Las rutas legítimas ya tienen esa forma (web: photos.tsx, celular: sync.ts, instalaciones: upload.ts).
-- NOT VALID: no revisa filas viejas (la app las rechaza al descargar, lib/report.ts), sí lo nuevo.

alter table public.attachments
  add constraint attachments_storage_path_estricto check (
    storage_path ~ ('^' || company_id::text || '/' || work_order_id::text || '/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,5}$')
  ) not valid;

alter table public.installation_files
  add constraint installation_files_storage_path_estricto check (
    storage_path ~ ('^' || company_id::text || '/' || installation_id::text || '/(equipos|sitio)/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,5}$')
  ) not valid;

alter table public.assets
  add constraint assets_photo_path_estricto check (
    photo_path is null
    or photo_path ~ ('^' || company_id::text || '/' || installation_id::text || '/(equipos|sitio)/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,5}$')
  ) not valid;
