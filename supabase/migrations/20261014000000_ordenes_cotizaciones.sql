-- Detalle de la orden y cotizaciones: garantía por tipo de servicio, pie de foto,
-- facturación de órdenes, enlace público de cotizaciones y conversión en orden.

-- Garantía que se ofrece por tipo de servicio ("Garantía 6 meses").
alter table public.service_types add column warranty_months int check (warranty_months >= 0);

-- Pie de foto ("Antes · fachada", "Cámara 3 instalada").
alter table public.attachments add column caption text check (length(caption) <= 120);

-- ---------------------------------------------------------------------------
-- Facturación: solo el staff marca como facturada una orden completada. Una vez
-- facturada no se reabre ni cambian sus materiales.
-- ---------------------------------------------------------------------------
alter table public.work_orders add column invoiced_at timestamptz;

create function public.work_orders_invoice_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if new.invoiced_at is distinct from old.invoiced_at then
    if auth.uid() is not null and not public.is_staff(old.company_id) then
      raise exception using errcode = '42501', message = 'Solo el dueño o el despachador facturan';
    end if;
    if new.invoiced_at is not null then
      if new.status <> 'completada' then
        raise exception using errcode = '23514', message = 'Solo se facturan órdenes completadas';
      end if;
      -- La fecha la pone el sistema (el seed y procesos internos pueden fijarla).
      if auth.uid() is not null then new.invoiced_at := now(); end if;
    end if;
  end if;
  if old.invoiced_at is not null and new.invoiced_at is not null and new.status <> 'completada' then
    raise exception using errcode = '23514', message = 'La orden ya está facturada; no se puede reabrir';
  end if;
  return new;
end $$;
create trigger work_orders_invoice_guard before update on public.work_orders
  for each row execute function public.work_orders_invoice_guard();

create function public.work_orders_log_invoice() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.invoiced_at is not null and old.invoiced_at is null then
    insert into public.work_order_events (company_id, work_order_id, type, user_id, payload)
    values (new.company_id, new.id, 'facturada', auth.uid(), jsonb_build_object('total', new.total));
  end if;
  return new;
end $$;
create trigger work_orders_log_invoice after update on public.work_orders
  for each row execute function public.work_orders_log_invoice();

create function public.work_order_items_invoice_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.work_orders
             where id = coalesce(new.work_order_id, old.work_order_id) and invoiced_at is not null) then
    raise exception using errcode = '42501', message = 'La orden ya está facturada; sus materiales no cambian';
  end if;
  return coalesce(new, old);
end $$;
create trigger c_invoice_guard before insert or update or delete on public.work_order_items
  for each row execute function public.work_order_items_invoice_guard();

-- "Facturado en el mes" pasa a contar lo facturado, no solo lo completado.
create or replace function public.dashboard_kpis(p_company uuid) returns jsonb
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
                     where company_id = p_company and invoiced_at >= month_start),
    'billed_prev_month_to_date', (select coalesce(sum(total), 0) from public.work_orders
                                  where company_id = p_company
                                    and invoiced_at >= prev_month_start and invoiced_at < now() - interval '1 month')
  ) into result;
  return result;
end $$;

-- ---------------------------------------------------------------------------
-- Cotizaciones: enlace público para el cliente y conversión en orden.
-- ---------------------------------------------------------------------------
alter table public.quotes
  add column public_token text unique default encode(extensions.gen_random_bytes(16), 'hex'),
  add column notes text;
update public.quotes set public_token = encode(extensions.gen_random_bytes(16), 'hex') where public_token is null;
alter table public.quotes alter column public_token set not null;

-- Lo que ve el cliente con el enlace: solo cotizaciones ya enviadas (no borradores).
create function public.public_quote(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', q.number,
    'status', q.status,
    'items', q.items,
    'total', q.total,
    'valid_until', q.valid_until,
    'notes', q.notes,
    'created_at', q.created_at,
    'sent_at', q.sent_at,
    'customer', jsonb_build_object('name', c.name, 'contact_name', c.contact_name),
    'company', jsonb_build_object('name', co.name, 'nit', co.nit, 'phone', co.phone, 'logo_url', co.logo_url)
  )
  from public.quotes q
  join public.customers c on c.id = q.customer_id
  join public.companies co on co.id = q.company_id
  where q.public_token = p_token and length(p_token) = 32 and q.status <> 'borrador'
$$;
revoke execute on function public.public_quote(text) from public;
grant execute on function public.public_quote(text) to anon, authenticated;

-- Convierte una cotización aprobada en orden con sus ítems. security invoker: aplica la RLS del que llama.
create function public.convert_quote_to_order(p_quote uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  q public.quotes;
  wo uuid;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found or not public.is_staff(q.company_id) then
    raise exception using errcode = '42501', message = 'Cotización no encontrada';
  end if;
  if q.status <> 'aprobada' then
    raise exception using errcode = '23514', message = 'Solo se convierten cotizaciones aprobadas';
  end if;
  if q.work_order_id is not null then
    return q.work_order_id;
  end if;

  insert into public.work_orders (company_id, customer_id, site_id, title, description)
  values (q.company_id, q.customer_id,
          (select id from public.sites where customer_id = q.customer_id and company_id = q.company_id order by created_at limit 1),
          'Trabajo de la cotización COT-' || q.number,
          q.notes)
  returning id into wo;

  insert into public.work_order_items (work_order_id, material_id, description, quantity, unit_price)
  select wo, public.try_uuid(i ->> 'material_id'), i ->> 'description', (i ->> 'quantity')::numeric, (i ->> 'unit_price')::numeric
  from jsonb_array_elements(q.items) i;

  update public.quotes set work_order_id = wo where id = q.id;
  return wo;
end $$;
revoke execute on function public.convert_quote_to_order(uuid) from public, anon;
grant execute on function public.convert_quote_to_order(uuid) to authenticated;

revoke execute on function public.work_orders_invoice_guard() from public, anon, authenticated;
revoke execute on function public.work_orders_log_invoice() from public, anon, authenticated;
revoke execute on function public.work_order_items_invoice_guard() from public, anon, authenticated;
