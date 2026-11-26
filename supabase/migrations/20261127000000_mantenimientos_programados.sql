-- Mantenimientos programados: cada día, la base crea una orden "pendiente" para cada instalación
-- cuyo próximo mantenimiento vence dentro de los días de anticipación que eligió la empresa.
--
-- * La empresa lo activa en Ajustes (companies.auto_maintenance_days; null = apagado).
-- * La orden queda sin técnico ni horario: el despachador la asigna desde la agenda.
-- * work_orders.maintenance_due guarda la fecha para la que se creó. No se crea otra orden para
--   la misma instalación y fecha, aunque la cancelen; al completar el mantenimiento cambia el
--   próximo vencimiento y el ciclo sigue.
-- * Solo la base escribe maintenance_due: los usuarios no lo pueden poner ni cambiar.

alter table public.companies
  add column auto_maintenance_days int check (auto_maintenance_days between 1 and 60);
grant update (auto_maintenance_days) on public.companies to authenticated;

alter table public.work_orders add column maintenance_due date;
create unique index work_orders_installation_maintenance_due
  on public.work_orders (installation_id, maintenance_due)
  where maintenance_due is not null;

create function public.work_orders_maintenance_due_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if; -- la tarea programada y el servidor
  if tg_op = 'INSERT' then
    new.maintenance_due := null;
  else
    new.maintenance_due := old.maintenance_due;
  end if;
  return new;
end $$;
create trigger work_orders_maintenance_due_guard before insert or update on public.work_orders
  for each row execute function public.work_orders_maintenance_due_guard();

-- Al completar un mantenimiento (por tipo de servicio o creado por la programación), la
-- instalación toma esa fecha como último mantenimiento.
create or replace function public.work_orders_update_maintenance() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d date := (new.completed_at at time zone 'America/Bogota')::date;
begin
  if new.installation_id is null or new.status <> 'completada' or (tg_op = 'UPDATE' and old.status = 'completada') then
    return null;
  end if;
  if new.maintenance_due is not null
     or exists (select 1 from public.service_types where id = new.service_type_id and is_maintenance) then
    update public.installations set last_maintenance = greatest(last_maintenance, d)
    where id = new.installation_id;
  end if;
  return null;
end $$;

-- Crea las órdenes de los mantenimientos que vencen pronto. Devuelve cuántas creó.
create function public.create_scheduled_maintenance_orders() returns int
language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Bogota')::date;
  r record;
  n int := 0;
begin
  for r in
    select i.id, i.company_id, i.customer_id, i.site_id, i.name, i.next_maintenance,
           (select st.id from public.service_types st
            where st.company_id = i.company_id and st.is_maintenance
            order by st.name limit 1) as service_type_id
    from public.installations i
    join public.companies c on c.id = i.company_id
    where c.auto_maintenance_days is not null
      and c.subscription_status <> 'canceled'
      and i.status = 'activa'
      and i.next_maintenance is not null
      and i.next_maintenance <= today + c.auto_maintenance_days
      and not exists (
        select 1 from public.work_orders w
        where w.installation_id = i.id and w.maintenance_due = i.next_maintenance
      )
      -- ya hay un mantenimiento abierto en la instalación (creado a mano o antes)
      and not exists (
        select 1 from public.work_orders w
        left join public.service_types st on st.id = w.service_type_id
        where w.installation_id = i.id
          and w.status not in ('completada', 'cancelada')
          and (w.maintenance_due is not null or st.is_maintenance)
      )
  loop
    insert into public.work_orders
      (company_id, customer_id, site_id, installation_id, service_type_id, title, description, maintenance_due)
    values
      (r.company_id, r.customer_id, r.site_id, r.id, r.service_type_id,
       left('Mantenimiento: ' || r.name, 200),
       'Creada automáticamente por el plan de mantenimiento. Fecha programada: ' || to_char(r.next_maintenance, 'DD/MM/YYYY') || '.',
       r.next_maintenance);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.work_orders_maintenance_due_guard() from public, anon, authenticated;
revoke execute on function public.create_scheduled_maintenance_orders() from public, anon, authenticated;

-- Todos los días a las 6:00 a. m. de Colombia (11:00 UTC).
create extension if not exists pg_cron;
select cron.schedule('mantenimientos-programados', '0 11 * * *', 'select public.create_scheduled_maintenance_orders()');
