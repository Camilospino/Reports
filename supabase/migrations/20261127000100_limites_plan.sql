-- Límites por plan. El plan lo pone Tecnio (npm run plan) cuando el cliente paga; el dueño no lo puede cambiar.
--   Arranque: 3 técnicos activos, sin inventario ni cotizaciones.
--   Equipo:   10 técnicos activos, todo incluido.
--   Empresa:  25 técnicos activos, todo incluido.
-- Los mismos números están en apps/web/src/components/landing/planes.ts: si cambian, cambiar los dos.

alter table public.companies
  add constraint companies_plan_check check (plan in ('arranque', 'equipo', 'empresa'));

create function public.plan_technicians(p_plan text) returns int
language sql immutable set search_path = '' as $$
  select case p_plan when 'arranque' then 3 when 'equipo' then 10 when 'empresa' then 25 else 0 end
$$;

create function public.plan_includes_extras(p_plan text) returns boolean
language sql immutable set search_path = '' as $$
  select p_plan in ('equipo', 'empresa')
$$;

-- Técnicos activos: no se puede crear ni activar uno más de los que incluye el plan.
-- Aplica siempre, también cuando el panel crea la cuenta con la llave de servicio.
-- Si una empresa baja de plan con más técnicos de la cuenta, no se toca a nadie: solo no puede sumar más.
create function public.memberships_plan_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.companies;
  n int;
  lim int;
begin
  if new.role <> 'technician' or not new.active then return new; end if;
  if tg_op = 'UPDATE' and old.role = 'technician' and old.active then return new; end if;
  -- Quien no es dueño de esa empresa lo rechaza la RLS (sin contarle nada del plan ajeno).
  if auth.uid() is not null and public.my_role(new.company_id) is distinct from 'owner' then return new; end if;

  -- Bloquea la empresa para que dos altas simultáneas no se pasen del límite.
  select * into c from public.companies where id = new.company_id for update;
  lim := public.plan_technicians(c.plan);
  select count(*) into n from public.memberships
  where company_id = new.company_id and role = 'technician' and active and id <> new.id;

  if n >= lim then
    raise exception using errcode = 'P0001',
      message = format('Tu plan %s incluye %s técnicos activos. Desactiva uno o escríbenos para cambiar de plan.',
                       initcap(c.plan), lim);
  end if;
  return new;
end $$;
create trigger memberships_plan_limit before insert or update of role, active on public.memberships
  for each row execute function public.memberships_plan_limit();

-- Inventario y cotizaciones: desde el plan Equipo. Lo que ya existe se conserva; solo no se crea más.
-- Solo aplica a lo que hace el dueño o el despachador desde el panel (el resto lo rechaza la RLS).
create function public.assert_plan_extras() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p text;
begin
  if auth.uid() is null or not public.is_staff(new.company_id) then return new; end if;
  select plan into p from public.companies where id = new.company_id;
  if not public.plan_includes_extras(p) then
    raise exception using errcode = '42501',
      message = tg_argv[0] || ' desde el plan Equipo. Escríbenos para cambiar de plan.';
  end if;
  return new;
end $$;
create trigger quotes_plan before insert on public.quotes
  for each row execute function public.assert_plan_extras('Las cotizaciones están disponibles');
create trigger materials_plan before insert on public.materials
  for each row execute function public.assert_plan_extras('El inventario está disponible');

revoke execute on function public.memberships_plan_limit() from public, anon, authenticated;
revoke execute on function public.assert_plan_extras() from public, anon, authenticated;
