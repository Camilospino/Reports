-- Clientes, técnicos e inventario.
-- Materiales y tipos de servicio se archivan en vez de borrarse (las órdenes viejas los citan),
-- y el stock solo cambia con movimientos registrados: ajustes del equipo o el cierre de una orden.

alter table public.materials
  add column sku text check (length(sku) <= 40),
  add column track_stock boolean not null default true, -- false para servicios como "Mano de obra"
  add column active boolean not null default true,
  add constraint materials_name_check check (length(trim(name)) between 1 and 120),
  add constraint materials_unit_check check (length(trim(unit)) between 1 and 12);

alter table public.service_types
  add column active boolean not null default true,
  add constraint service_types_name_check check (length(trim(name)) between 1 and 120);

-- El stock no se edita directo: se usa adjust_stock() o lo descuenta el cierre de la orden.
revoke update on public.materials from authenticated;
grant update (name, unit, unit_price, min_stock, sku, track_stock, active) on public.materials to authenticated;

-- ---------------------------------------------------------------------------
-- Movimientos de stock (solo se agregan)
-- ---------------------------------------------------------------------------
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  material_id uuid not null,
  delta numeric(12, 2) not null check (delta <> 0),
  stock_after numeric(12, 2) not null,
  reason text not null check (length(trim(reason)) between 1 and 160),
  work_order_id uuid,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (company_id, material_id) references public.materials (company_id, id) on delete cascade,
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete set null (work_order_id)
);
create index on public.stock_movements (material_id, created_at desc);
create index on public.stock_movements (work_order_id);

alter table public.stock_movements enable row level security;
create policy "staff lee" on public.stock_movements for select using (public.is_staff(company_id));
revoke all on public.stock_movements from anon;
revoke insert, update, delete, truncate, references, trigger on public.stock_movements from authenticated;

-- Entrada, salida o conteo físico. Devuelve el stock nuevo.
create function public.adjust_stock(p_material uuid, p_kind text, p_quantity numeric, p_note text default null)
returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  mat public.materials;
  v_delta numeric;
  v_reason text;
begin
  select * into mat from public.materials where id = p_material for update;
  if not found or not public.is_staff(mat.company_id) then
    raise exception using errcode = '42501', message = 'No tienes permiso sobre este material';
  end if;
  if p_quantity is null or p_quantity < 0 or (p_kind <> 'conteo' and p_quantity = 0) then
    raise exception using errcode = '22023', message = 'Cantidad inválida';
  end if;

  v_delta := case p_kind
    when 'entrada' then p_quantity
    when 'salida' then -p_quantity
    when 'conteo' then p_quantity - mat.stock
  end;
  if v_delta is null then
    raise exception using errcode = '22023', message = 'Tipo de movimiento inválido';
  end if;
  if mat.stock + v_delta < 0 then
    raise exception using errcode = '22023', message = 'El stock no puede quedar negativo';
  end if;
  if v_delta = 0 then return mat.stock; end if;

  v_reason := case p_kind when 'entrada' then 'Entrada' when 'salida' then 'Salida' else 'Conteo físico' end
    || coalesce(' · ' || nullif(left(trim(p_note), 120), ''), '');

  update public.materials set stock = stock + v_delta where id = mat.id;
  insert into public.stock_movements (company_id, material_id, delta, stock_after, reason)
  values (mat.company_id, mat.id, v_delta, mat.stock + v_delta, v_reason);
  return mat.stock + v_delta;
end $$;
revoke execute on function public.adjust_stock(uuid, text, numeric, text) from public, anon;
grant execute on function public.adjust_stock(uuid, text, numeric, text) to authenticated;

-- Stock inicial al crear un material.
create function public.materials_log_initial() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.stock <> 0 then
    insert into public.stock_movements (company_id, material_id, delta, stock_after, reason)
    values (new.company_id, new.id, new.stock, new.stock, 'Stock inicial');
  end if;
  return null;
end $$;
create trigger materials_log_initial after insert on public.materials
  for each row execute function public.materials_log_initial();

-- Deja el stock al día con una orden: si está completada, sus materiales salen del
-- inventario; si se reabre o se le quitan ítems, se devuelven. Compara lo que ya
-- se descontó (los movimientos de la orden) con lo que debería estar descontado.
create function public.sync_order_stock(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  wo public.work_orders;
  r record;
  v_after numeric;
begin
  select * into wo from public.work_orders where id = p_order;
  if not found then return; end if;

  for r in
    with target as (
      select i.material_id, sum(i.quantity) as qty
      from public.work_order_items i
      join public.materials m on m.id = i.material_id and m.track_stock
      where i.work_order_id = wo.id and wo.status = 'completada'
      group by i.material_id
    ), done as (
      select material_id, -sum(delta) as qty
      from public.stock_movements where work_order_id = wo.id
      group by material_id
    )
    select coalesce(t.material_id, d.material_id) as material_id,
           coalesce(t.qty, 0) - coalesce(d.qty, 0) as diff
    from target t full join done d on d.material_id = t.material_id
    order by 1 -- siempre el mismo orden de bloqueo
  loop
    continue when r.diff = 0;
    update public.materials set stock = stock - r.diff where id = r.material_id
    returning stock into v_after;
    insert into public.stock_movements (company_id, material_id, delta, stock_after, reason, work_order_id)
    values (wo.company_id, r.material_id, -r.diff, v_after,
            case when r.diff > 0 then 'Usado en OT-' else 'Devuelto de OT-' end || wo.number, wo.id);
  end loop;
end $$;
revoke execute on function public.sync_order_stock(uuid) from public, anon, authenticated;

create function public.work_orders_sync_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.status = 'completada') is distinct from (old.status = 'completada') then
    perform public.sync_order_stock(new.id);
  end if;
  return null;
end $$;
create trigger work_orders_sync_stock after update of status on public.work_orders
  for each row execute function public.work_orders_sync_stock();

-- Ítems que cambian en una orden ya completada (antes de facturar).
create function public.work_order_items_sync_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
declare wo uuid := coalesce(new.work_order_id, old.work_order_id);
begin
  if exists (select 1 from public.work_orders where id = wo and status = 'completada') then
    perform public.sync_order_stock(wo);
  end if;
  return null;
end $$;
create trigger work_order_items_sync_stock after insert or update or delete on public.work_order_items
  for each row execute function public.work_order_items_sync_stock();

revoke execute on function public.materials_log_initial() from public, anon, authenticated;
revoke execute on function public.work_orders_sync_stock() from public, anon, authenticated;
revoke execute on function public.work_order_items_sync_stock() from public, anon, authenticated;

-- El panel se actualiza solo cuando el técnico cierra una orden.
alter publication supabase_realtime add table public.materials;

-- Resumen por cliente para el listado. security_invoker: aplica la RLS de work_orders
-- de quien consulta, así nadie ve totales de otra empresa.
create view public.customer_stats with (security_invoker = true) as
select customer_id, company_id,
       count(*)::int as orders,
       count(*) filter (where status not in ('completada', 'cancelada'))::int as open_orders,
       max(completed_at) as last_service,
       coalesce(sum(total) filter (where status = 'completada'), 0) as billed
from public.work_orders
group by customer_id, company_id;
revoke all on public.customer_stats from anon;
revoke insert, update, delete, truncate, references, trigger on public.customer_stats from authenticated;
