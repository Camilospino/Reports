-- Bolsa de órdenes: las órdenes pendientes sin técnico las ven todos los técnicos
-- activos de la empresa, y el primero que la toma se la queda.

-- ¿El usuario actual es técnico activo de la empresa?
create function public.is_technician_of(company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role(company) = 'technician', false)
$$;
revoke execute on function public.is_technician_of(uuid) from public, anon;
grant execute on function public.is_technician_of(uuid) to authenticated;

-- Lectura: además de las suyas, el técnico ve las pendientes sin asignar de su empresa.
drop policy "staff y técnico asignado leen" on public.work_orders;
create policy "staff, técnico asignado y bolsa leen" on public.work_orders for select
  using (
    public.is_staff(company_id)
    or public.is_my_membership(technician_id)
    or (technician_id is null and status = 'pendiente' and public.is_technician_of(company_id))
  );

-- El técnico puede asignarse una orden de la bolsa (solo eso: ningún otro campo).
create or replace function public.work_orders_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r public.member_role;
  taking boolean;
begin
  -- Actualizaciones internas (el total que recalcula work_order_items).
  if pg_trigger_depth() > 1 then return new; end if;

  if new.company_id <> old.company_id or new.number <> old.number then
    raise exception using errcode = '42501', message = 'La empresa y el número de la orden no se pueden cambiar';
  end if;

  if auth.uid() is not null then
    if new.total is distinct from old.total
       or new.public_token is distinct from old.public_token
       or new.completed_at is distinct from old.completed_at then
      raise exception using errcode = '42501', message = 'Total, token y fecha de cierre los calcula el sistema';
    end if;

    r := public.my_role(old.company_id);
    if r = 'technician' then
      taking := old.technician_id is null and old.status = 'pendiente'
                and new.technician_id is not null and public.is_my_membership(new.technician_id)
                and new.status in ('pendiente', 'asignada');
      if (new.customer_id, new.site_id, new.asset_id, new.service_type_id, new.title, new.description,
          new.technician_id, new.scheduled_start, new.scheduled_end, new.priority)
         is distinct from
         (old.customer_id, old.site_id, old.asset_id, old.service_type_id, old.title, old.description,
          case when taking then new.technician_id else old.technician_id end,
          old.scheduled_start, old.scheduled_end, old.priority) then
        raise exception using errcode = '42501', message = 'El técnico solo puede actualizar la ejecución de la orden';
      end if;
      if old.status in ('completada', 'cancelada') then
        raise exception using errcode = '42501', message = 'La orden ya está cerrada';
      end if;
      if new.status is distinct from old.status and new.status not in ('en_camino', 'en_proceso', 'completada')
         and not (taking and new.status = 'asignada') then
        raise exception using errcode = '42501', message = 'El técnico no puede pasar la orden a ese estado';
      end if;
    end if;
  end if;

  if new.technician_id is distinct from old.technician_id then
    perform public.assert_technician(new.company_id, new.technician_id);
    if new.technician_id is not null and new.status = 'pendiente' then new.status := 'asignada'; end if;
    if new.technician_id is null and new.status = 'asignada' then new.status := 'pendiente'; end if;
  end if;

  if new.status = 'completada' and old.status <> 'completada' then
    new.completed_at := now();
    new.public_token := coalesce(old.public_token, encode(extensions.gen_random_bytes(16), 'hex'));
  elsif new.status <> 'completada' and old.status = 'completada' then
    new.completed_at := null; -- reabierta; el token se conserva pero el reporte deja de mostrarse
  end if;
  return new;
end $$;

-- Tomar una orden de la bolsa. Atómico: si dos técnicos la toman a la vez, solo uno gana.
create function public.take_work_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid;
begin
  select m.id into me
  from public.work_orders w
  join public.memberships m on m.company_id = w.company_id
  where w.id = p_order and m.user_id = (select auth.uid()) and m.active and m.role = 'technician';
  if me is null then
    raise exception using errcode = '42501', message = 'Solo un técnico de la empresa puede tomar esta orden';
  end if;

  update public.work_orders set technician_id = me
  where id = p_order and technician_id is null and status = 'pendiente';
  if not found then
    raise exception using errcode = 'P0001', message = 'Otro técnico ya tomó esta orden';
  end if;
end $$;
revoke execute on function public.take_work_order(uuid) from public, anon;
grant execute on function public.take_work_order(uuid) to authenticated;
