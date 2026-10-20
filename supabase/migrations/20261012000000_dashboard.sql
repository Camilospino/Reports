-- Inicio del panel: inventario mínimo, especialidad por tipo de servicio,
-- fecha de envío de cotizaciones e indicadores del día.

-- Inventario: alerta de "material bajo" cuando stock <= min_stock.
alter table public.materials
  add column stock numeric(12, 2) not null default 0,
  add column min_stock numeric(12, 2) not null default 0 check (min_stock >= 0);

-- Especialidad que pide el tipo de servicio; se cruza con memberships.skills
-- para sugerir técnico en la agenda.
alter table public.service_types add column skill text;

-- Cuándo se envió la cotización (para "sin respuesta hace más de 3 días").
alter table public.quotes add column sent_at timestamptz;

create or replace function public.quotes_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.number := public.next_number(new.company_id, 'quote');
  elsif new.company_id <> old.company_id or new.number <> old.number then
    raise exception using errcode = '42501', message = 'La empresa y el número de la cotización no se pueden cambiar';
  end if;
  new.total := coalesce((
    select round(sum((i ->> 'quantity')::numeric * (i ->> 'unit_price')::numeric), 2)
    from jsonb_array_elements(new.items) i
  ), 0);
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status <> 'enviada') then
    new.sent_at := coalesce(new.sent_at, now());
  end if;
  return new;
end $$;

-- Busca un usuario por correo. Solo para el servidor (invitar a alguien que ya tiene cuenta).
create function public.find_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1
$$;
revoke execute on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- Indicadores del Inicio. security invoker: la RLS del usuario aplica.
-- "Hoy" y "este mes" se calculan en hora de Bogotá.
-- ---------------------------------------------------------------------------
create function public.dashboard_kpis(p_company uuid) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Bogota')::date;
  day_start timestamptz := today::timestamp at time zone 'America/Bogota';
  day_end timestamptz := (today + 1)::timestamp at time zone 'America/Bogota';
  month_start timestamptz := date_trunc('month', today)::timestamp at time zone 'America/Bogota';
  prev_month_start timestamptz := (date_trunc('month', today) - interval '1 month')::timestamp at time zone 'America/Bogota';
  result jsonb;
begin
  if not public.is_staff(p_company) then
    raise exception using errcode = '42501', message = 'Solo dueño o despachador';
  end if;

  with today_orders as (
    select * from public.work_orders
    where company_id = p_company and status <> 'cancelada'
      and scheduled_start >= day_start and scheduled_start < day_end
  ),
  techs as (
    select id from public.memberships where company_id = p_company and role = 'technician' and active
  ),
  -- Técnicos con orden activa cuyo último reporte (cualquier evento hecho por ellos en
  -- sus órdenes de hoy) tiene más de 45 minutos.
  offline as (
    select m.id as technician_id, max(e.created_at) as last_report
    from public.memberships m
    join today_orders o on o.technician_id = m.id
    join public.work_order_events e on e.work_order_id = o.id and e.user_id = m.user_id
    where m.id in (select technician_id from today_orders where status in ('en_camino', 'en_proceso'))
    group by m.id
    having max(e.created_at) < now() - interval '45 minutes'
  )
  select jsonb_build_object(
    'orders_total', (select count(*) from today_orders),
    'orders_completed', (select count(*) from today_orders where status = 'completada'),
    'orders_in_progress', (select count(*) from today_orders where status in ('en_camino', 'en_proceso')),
    'orders_unassigned', (select count(*) from today_orders where technician_id is null),
    'technicians_total', (select count(*) from techs),
    'technicians_in_field', (select count(distinct technician_id) from today_orders
                             where technician_id is not null and status <> 'completada'),
    'technicians_offline', (select count(*) from offline),
    'offline_since', (select min(last_report) from offline),
    'quotes_pending', (select count(*) from public.quotes where company_id = p_company and status = 'enviada'),
    'quotes_pending_total', (select coalesce(sum(total), 0) from public.quotes where company_id = p_company and status = 'enviada'),
    'billed_month', (select coalesce(sum(total), 0) from public.work_orders
                     where company_id = p_company and status = 'completada' and completed_at >= month_start),
    'billed_prev_month_to_date', (select coalesce(sum(total), 0) from public.work_orders
                                  where company_id = p_company and status = 'completada'
                                    and completed_at >= prev_month_start and completed_at < now() - interval '1 month')
  ) into result;
  return result;
end $$;
grant execute on function public.dashboard_kpis(uuid) to authenticated;
