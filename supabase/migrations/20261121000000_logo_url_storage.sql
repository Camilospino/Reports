-- logo_url solo puede apuntar al Storage público de Supabase (o al Supabase local en desarrollo).
-- El PDF descarga el logo en el servidor desde rutas públicas: una URL libre permitía SSRF
-- (p. ej. http://169.254.169.254/...). La app además valida el origen exacto contra
-- NEXT_PUBLIC_SUPABASE_URL antes de usarlo (lib/logo.ts); este CHECK es la segunda barrera.
-- NOT VALID: no revisa filas viejas (la app ya las ignora si no cumplen), sí todo insert/update nuevo.
alter table public.companies
  add constraint companies_logo_url_storage check (
    logo_url is null
    or (
      logo_url ~ '^(https://[a-z0-9]+\.supabase\.co|http://(127\.0\.0\.1|localhost):[0-9]+)/storage/v1/object/public/[A-Za-z0-9_./-]+$'
      and logo_url not like '%..%'
    )
  ) not valid;
