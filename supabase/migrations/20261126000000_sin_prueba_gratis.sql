-- Tecnio no tiene prueba gratis: las empresas nacen con la suscripción activa (el cobro es mensual
-- por adelantado y se gestiona por fuera de la app). trial_ends_at queda sin uso y se vuelve opcional;
-- 'trial' sigue siendo un valor permitido en la CHECK para no romper datos ni versiones viejas.
alter table public.companies
  alter column subscription_status set default 'active',
  alter column trial_ends_at drop not null,
  alter column trial_ends_at set default null;

update public.companies
set subscription_status = 'active', trial_ends_at = null
where subscription_status = 'trial';
