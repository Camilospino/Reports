-- Tecnio: esquema multiempresa.
--
-- Reglas de seguridad:
-- * Toda tabla de negocio lleva company_id y RLS basada en memberships.
-- * Las llaves foráneas son compuestas (company_id, id): es imposible enlazar
--   una orden de la empresa A con un cliente, sede o técnico de la empresa B.
-- * El técnico solo ve y modifica las órdenes asignadas a él, y solo los campos
--   de ejecución (estado, checklist, observaciones, firma). Precios, totales y
--   numeración los calcula la base.
-- * El rol anon no tiene acceso a ninguna tabla; el reporte público sale de una
--   función security definer que recibe el token.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'dispatcher', 'technician');
create type public.work_order_status as enum ('pendiente', 'asignada', 'en_camino', 'en_proceso', 'completada', 'cancelada');
create type public.work_order_priority as enum ('baja', 'normal', 'alta');
create type public.attachment_kind as enum ('foto_antes', 'foto_despues', 'firma');
create type public.quote_status as enum ('borrador', 'enviada', 'aprobada', 'rechazada');

-- ---------------------------------------------------------------------------
-- Empresas y miembros
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  nit text,
  logo_url text,
  phone text,
  plan text not null default 'arranque',
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  role public.member_role not null,
  full_name text not null check (length(trim(full_name)) > 0),
  phone text,
  skills text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, company_id),
  unique (company_id, id)
);
create index on public.memberships (company_id);

-- ---------------------------------------------------------------------------
-- Funciones de permisos. security definer para no recursar en la RLS de memberships.
-- ---------------------------------------------------------------------------
create function public.is_member(company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.company_id = company and m.user_id = (select auth.uid()) and m.active
  )
$$;

create function public.my_role(company uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.memberships m
  where m.company_id = company and m.user_id = (select auth.uid()) and m.active
$$;

create function public.is_staff(company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role(company) in ('owner', 'dispatcher'), false)
$$;

-- ¿Esta membership es la del usuario actual?
create function public.is_my_membership(membership uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.id = membership and m.user_id = (select auth.uid()) and m.active
  )
$$;

-- ---------------------------------------------------------------------------
-- Clientes, sedes y equipos
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  contact_name text,
  phone_whatsapp text,
  email text,
  tax_id text,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);
create index on public.customers (company_id);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_id uuid not null,
  address text not null,
  neighborhood text,
  city text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  access_notes text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, customer_id) references public.customers (company_id, id) on delete cascade
);
create index on public.sites (company_id, customer_id);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  site_id uuid not null,
  type text not null, -- aire, DVR, cámara, router...
  brand text,
  model text,
  serial text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, site_id) references public.sites (company_id, id) on delete cascade
);
create index on public.assets (company_id, site_id);

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  estimated_minutes int not null default 60 check (estimated_minutes > 0),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'), -- ["Limpiar filtros", ...]
  created_at timestamptz not null default now(),
  unique (company_id, id)
);
create index on public.service_types (company_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  unit text not null default 'und',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (company_id, id)
);
create index on public.materials (company_id);

-- ---------------------------------------------------------------------------
-- Numeración consecutiva por empresa (OT-1001, OT-1002...). La fila del contador
-- queda bloqueada durante la transacción, así dos órdenes simultáneas no repiten número.
-- ---------------------------------------------------------------------------
create table public.company_counters (
  company_id uuid not null references public.companies (id) on delete cascade,
  kind text not null,
  last_value int not null,
  primary key (company_id, kind)
);

create function public.next_number(p_company uuid, p_kind text) returns int
language sql security definer set search_path = '' as $$
  insert into public.company_counters as c (company_id, kind, last_value)
  values (p_company, p_kind, 1001)
  on conflict (company_id, kind) do update set last_value = c.last_value + 1
  returning last_value
$$;

-- Un técnico asignable: membership activa con rol technician de la misma empresa.
create function public.assert_technician(p_company uuid, p_membership uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_membership is not null and not exists (
    select 1 from public.memberships
    where id = p_membership and company_id = p_company and role = 'technician' and active
  ) then
    raise exception using errcode = '23514', message = 'Solo se puede asignar a un técnico activo de la empresa';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Órdenes de trabajo
-- ---------------------------------------------------------------------------
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  number int not null default 0, -- lo asigna el trigger; se muestra como OT-1038
  customer_id uuid not null,
  site_id uuid,
  asset_id uuid,
  service_type_id uuid,
  title text not null check (length(trim(title)) > 0),
  description text,
  technician_id uuid,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status public.work_order_status not null default 'pendiente',
  priority public.work_order_priority not null default 'normal',
  checklist_state jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist_state) = 'array'), -- [{ "label", "done" }]
  observations text,
  signer_name text,
  signer_id_number text,
  total numeric(14, 2) not null default 0, -- suma de work_order_items, la mantiene un trigger
  public_token text unique, -- se genera al completar; enlace del reporte público
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, number),
  unique (company_id, id),
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, site_id) references public.sites (company_id, id) on delete set null (site_id),
  foreign key (company_id, asset_id) references public.assets (company_id, id) on delete set null (asset_id),
  foreign key (company_id, service_type_id) references public.service_types (company_id, id) on delete set null (service_type_id),
  foreign key (company_id, technician_id) references public.memberships (company_id, id) on delete set null (technician_id)
);
create index on public.work_orders (company_id, scheduled_start);
create index on public.work_orders (company_id, status);
create index on public.work_orders (technician_id, scheduled_start);

-- ¿La orden está asignada al usuario actual? (abierta = no completada ni cancelada)
create function public.is_my_work_order(wo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.work_orders w
    join public.memberships m on m.id = w.technician_id
    where w.id = wo and m.user_id = (select auth.uid()) and m.active
  )
$$;

create function public.is_my_open_work_order(wo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.work_orders w
    join public.memberships m on m.id = w.technician_id
    where w.id = wo and m.user_id = (select auth.uid()) and m.active
      and w.status not in ('completada', 'cancelada')
  )
$$;

-- Al crear: número consecutivo, checklist y duración desde el tipo de servicio.
create function public.work_orders_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st public.service_types;
begin
  new.number := public.next_number(new.company_id, 'work_order');
  new.total := 0;
  perform public.assert_technician(new.company_id, new.technician_id);

  if new.service_type_id is not null then
    select * into st from public.service_types
    where id = new.service_type_id and company_id = new.company_id;
    if new.checklist_state = '[]'::jsonb then
      select coalesce(jsonb_agg(jsonb_build_object('label', item #>> '{}', 'done', false)), '[]'::jsonb)
      into new.checklist_state
      from jsonb_array_elements(st.checklist) item;
    end if;
    if new.scheduled_end is null and new.scheduled_start is not null then
      new.scheduled_end := new.scheduled_start + make_interval(mins => st.estimated_minutes);
    end if;
  end if;

  if new.technician_id is not null and new.status = 'pendiente' then
    new.status := 'asignada';
  end if;
  if new.status = 'completada' then
    new.completed_at := coalesce(new.completed_at, now());
    new.public_token := encode(extensions.gen_random_bytes(16), 'hex');
  else
    new.completed_at := null;
    new.public_token := null;
  end if;
  return new;
end $$;
create trigger work_orders_before_insert before insert on public.work_orders
  for each row execute function public.work_orders_before_insert();

-- Al actualizar: protege campos calculados y limita lo que puede tocar el técnico.
create function public.work_orders_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.member_role;
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
      if (new.customer_id, new.site_id, new.asset_id, new.service_type_id, new.title, new.description,
          new.technician_id, new.scheduled_start, new.scheduled_end, new.priority)
         is distinct from
         (old.customer_id, old.site_id, old.asset_id, old.service_type_id, old.title, old.description,
          old.technician_id, old.scheduled_start, old.scheduled_end, old.priority) then
        raise exception using errcode = '42501', message = 'El técnico solo puede actualizar la ejecución de la orden';
      end if;
      if old.status in ('completada', 'cancelada') then
        raise exception using errcode = '42501', message = 'La orden ya está cerrada';
      end if;
      if new.status is distinct from old.status and new.status not in ('en_camino', 'en_proceso', 'completada') then
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
create trigger work_orders_before_update before update on public.work_orders
  for each row execute function public.work_orders_before_update();

-- ---------------------------------------------------------------------------
-- Historial de la orden (solo se agrega, nunca se edita ni se borra)
-- ---------------------------------------------------------------------------
create table public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null,
  type text not null, -- creada, asignada, estado, reprogramada, aviso_whatsapp, nota...
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  payload jsonb not null default '{}'::jsonb,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete cascade
);
create index on public.work_order_events (work_order_id, created_at);

-- Registra en el historial los cambios de estado, técnico y horario.
create function public.work_orders_log_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.work_order_events (company_id, work_order_id, type, user_id, payload)
    values (new.company_id, new.id, 'creada', auth.uid(), jsonb_build_object('estado', new.status));
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.work_order_events (company_id, work_order_id, type, user_id, payload)
    values (new.company_id, new.id, 'estado', auth.uid(), jsonb_build_object('de', old.status, 'a', new.status));
  end if;
  if new.technician_id is distinct from old.technician_id then
    insert into public.work_order_events (company_id, work_order_id, type, user_id, payload)
    values (new.company_id, new.id, 'asignada', auth.uid(), jsonb_build_object('technician_id', new.technician_id));
  end if;
  if (new.scheduled_start, new.scheduled_end) is distinct from (old.scheduled_start, old.scheduled_end) then
    insert into public.work_order_events (company_id, work_order_id, type, user_id, payload)
    values (new.company_id, new.id, 'reprogramada', auth.uid(),
            jsonb_build_object('inicio', new.scheduled_start, 'fin', new.scheduled_end));
  end if;
  return new;
end $$;
create trigger work_orders_log_event after insert or update on public.work_orders
  for each row execute function public.work_orders_log_event();

-- ---------------------------------------------------------------------------
-- Materiales y mano de obra de la orden
-- ---------------------------------------------------------------------------
create table public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null,
  material_id uuid,
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  total numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete cascade,
  foreign key (company_id, material_id) references public.materials (company_id, id) on delete set null (material_id)
);
create index on public.work_order_items (work_order_id);

-- El técnico solo registra materiales del catálogo, al precio del catálogo,
-- y después solo puede cambiar la cantidad.
create function public.work_order_items_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare mat public.materials;
begin
  if tg_op = 'UPDATE' and (new.work_order_id <> old.work_order_id or new.company_id <> old.company_id) then
    raise exception using errcode = '42501', message = 'El ítem no se puede mover a otra orden';
  end if;
  if auth.uid() is null or public.my_role(new.company_id) is distinct from 'technician' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select * into mat from public.materials where id = new.material_id and company_id = new.company_id;
    if not found then
      raise exception using errcode = '42501', message = 'El técnico solo puede agregar materiales del catálogo';
    end if;
    new.description := mat.name;
    new.unit_price := mat.unit_price;
  elsif (new.material_id, new.description, new.unit_price) is distinct from (old.material_id, old.description, old.unit_price) then
    raise exception using errcode = '42501', message = 'El técnico solo puede cambiar la cantidad';
  end if;
  return new;
end $$;

-- Mantiene work_orders.total al día.
create function public.work_order_items_update_total() returns trigger
language plpgsql security definer set search_path = '' as $$
declare wo uuid := coalesce(new.work_order_id, old.work_order_id);
begin
  update public.work_orders
  set total = coalesce((select sum(total) from public.work_order_items where work_order_id = wo), 0)
  where id = wo;
  return null;
end $$;
create trigger work_order_items_update_total after insert or update or delete on public.work_order_items
  for each row execute function public.work_order_items_update_total();

-- ---------------------------------------------------------------------------
-- Fotos y firma. Ruta en Storage: {company_id}/{work_order_id}/{archivo}
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null,
  kind public.attachment_kind not null,
  storage_path text not null,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete cascade,
  check (storage_path like company_id::text || '/' || work_order_id::text || '/%' and storage_path not like '%..%')
);
create index on public.attachments (work_order_id);

-- Hijos de una orden: la empresa se toma de la orden, no de lo que mande el cliente.
create function public.set_company_from_work_order() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select company_id into new.company_id from public.work_orders where id = new.work_order_id;
  return new;
end $$;

-- Orden alfabético de triggers: "a_" corre antes que el guard de ítems.
create trigger a_set_company before insert on public.work_order_events
  for each row execute function public.set_company_from_work_order();
create trigger a_set_company before insert on public.work_order_items
  for each row execute function public.set_company_from_work_order();
create trigger a_set_company before insert on public.attachments
  for each row execute function public.set_company_from_work_order();
create trigger b_guard before insert or update on public.work_order_items
  for each row execute function public.work_order_items_guard();

-- ---------------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------------
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  number int not null default 0, -- lo asigna el trigger
  customer_id uuid not null,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'), -- [{ material_id?, description, quantity, unit_price }]
  total numeric(14, 2) not null default 0, -- se calcula desde items
  status public.quote_status not null default 'borrador',
  valid_until date,
  work_order_id uuid,
  created_at timestamptz not null default now(),
  unique (company_id, number),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete set null (work_order_id)
);
create index on public.quotes (company_id, status);

create function public.quotes_before_write() returns trigger
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
  return new;
end $$;
create trigger quotes_before_write before insert or update on public.quotes
  for each row execute function public.quotes_before_write();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.customers enable row level security;
alter table public.sites enable row level security;
alter table public.assets enable row level security;
alter table public.service_types enable row level security;
alter table public.materials enable row level security;
alter table public.company_counters enable row level security; -- sin políticas: solo vía next_number()
alter table public.work_orders enable row level security;
alter table public.work_order_events enable row level security;
alter table public.work_order_items enable row level security;
alter table public.attachments enable row level security;
alter table public.quotes enable row level security;

-- Empresas: los miembros la ven; solo el dueño la edita (y solo datos básicos, ver grants).
-- Se crean con create_company().
create policy "miembros leen" on public.companies for select using (public.is_member(id));
create policy "dueño edita" on public.companies for update
  using (public.my_role(id) = 'owner') with check (public.my_role(id) = 'owner');

-- Miembros: el equipo se ve entre sí; solo el dueño agrega, edita o retira.
create policy "miembros leen" on public.memberships for select using (public.is_member(company_id));
create policy "dueño agrega" on public.memberships for insert with check (public.my_role(company_id) = 'owner');
create policy "dueño edita" on public.memberships for update
  using (public.my_role(company_id) = 'owner') with check (public.my_role(company_id) = 'owner');
create policy "dueño retira" on public.memberships for delete using (public.my_role(company_id) = 'owner');

-- El dueño no puede cambiarse el rol, desactivarse ni borrarse a sí mismo
-- (la empresa quedaría sin dueño), ni mover una membership a otra empresa o usuario.
create function public.memberships_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    if old.user_id = auth.uid() then
      raise exception using errcode = '42501', message = 'No puedes retirarte a ti mismo';
    end if;
    return old;
  end if;
  if new.user_id <> old.user_id or new.company_id <> old.company_id then
    raise exception using errcode = '42501', message = 'No se puede mover una membership';
  end if;
  if old.user_id = auth.uid() and (new.role <> old.role or not new.active) then
    raise exception using errcode = '42501', message = 'No puedes cambiar tu propio rol ni desactivarte';
  end if;
  return new;
end $$;
create trigger memberships_guard before update or delete on public.memberships
  for each row execute function public.memberships_guard();

-- Catálogos, clientes y cotizaciones: todo el equipo lee; dueño y despachador escriben.
do $$
declare t text;
begin
  foreach t in array array['customers', 'sites', 'assets', 'service_types', 'materials', 'quotes'] loop
    execute format('create policy "miembros leen" on public.%I for select using (public.is_member(company_id))', t);
    execute format('create policy "staff crea" on public.%I for insert with check (public.is_staff(company_id))', t);
    execute format('create policy "staff edita" on public.%I for update using (public.is_staff(company_id)) with check (public.is_staff(company_id))', t);
    execute format('create policy "staff borra" on public.%I for delete using (public.is_staff(company_id))', t);
  end loop;
end $$;

-- Órdenes: dueño y despachador todo; el técnico solo ve y actualiza las suyas.
create policy "staff y técnico asignado leen" on public.work_orders for select
  using (public.is_staff(company_id) or public.is_my_membership(technician_id));
create policy "staff crea" on public.work_orders for insert with check (public.is_staff(company_id));
create policy "staff y técnico asignado actualizan" on public.work_orders for update
  using (public.is_staff(company_id) or public.is_my_membership(technician_id))
  with check (public.is_staff(company_id) or public.is_my_membership(technician_id));
create policy "staff borra" on public.work_orders for delete using (public.is_staff(company_id));

-- Historial: se lee como la orden; se agrega a nombre propio; no se edita ni se borra.
create policy "leen como la orden" on public.work_order_events for select
  using (public.is_staff(company_id) or public.is_my_work_order(work_order_id));
create policy "agregan a nombre propio" on public.work_order_events for insert
  with check (user_id = auth.uid() and (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id)));

-- Ítems: staff todo; técnico solo en sus órdenes abiertas.
create policy "leen como la orden" on public.work_order_items for select
  using (public.is_staff(company_id) or public.is_my_work_order(work_order_id));
create policy "staff o técnico con orden abierta crean" on public.work_order_items for insert
  with check (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id));
create policy "staff o técnico con orden abierta editan" on public.work_order_items for update
  using (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id))
  with check (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id));
create policy "staff o técnico con orden abierta borran" on public.work_order_items for delete
  using (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id));

-- Adjuntos: staff todo; técnico sube a sus órdenes abiertas y solo borra lo que él subió.
create policy "leen como la orden" on public.attachments for select
  using (public.is_staff(company_id) or public.is_my_work_order(work_order_id));
create policy "suben a nombre propio" on public.attachments for insert
  with check (uploaded_by = auth.uid() and (public.is_staff(company_id) or public.is_my_open_work_order(work_order_id)));
create policy "staff o autor con orden abierta borran" on public.attachments for delete
  using (public.is_staff(company_id) or (uploaded_by = auth.uid() and public.is_my_open_work_order(work_order_id)));

-- ---------------------------------------------------------------------------
-- Privilegios. RLS no aplica a TRUNCATE ni protege columnas, así que se ajustan aparte.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke all on public.company_counters from authenticated;

-- De la empresa, el dueño solo edita los datos básicos; plan y suscripción no.
revoke update on public.companies from authenticated;
grant update (name, nit, logo_url, phone) on public.companies to authenticated;

-- Funciones: nada para anon salvo el reporte público; las internas, para nadie.
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;
revoke execute on function public.next_number(uuid, text) from authenticated;
revoke execute on function public.assert_technician(uuid, uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- Registro: crea la empresa y la membership del dueño en una sola transacción.
-- ---------------------------------------------------------------------------
create function public.create_company(
  p_company_name text,
  p_full_name text,
  p_nit text default null,
  p_phone text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Debes iniciar sesión';
  end if;
  insert into public.companies (name, nit, phone) values (trim(p_company_name), nullif(trim(p_nit), ''), nullif(trim(p_phone), ''))
  returning id into cid;
  insert into public.memberships (user_id, company_id, role, full_name, phone)
  values (auth.uid(), cid, 'owner', trim(p_full_name), nullif(trim(p_phone), ''));
  return cid;
end $$;
revoke execute on function public.create_company(text, text, text, text) from public, anon;
grant execute on function public.create_company(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Reporte público: el cliente final lo abre con el token, sin login.
-- Solo órdenes completadas; no expone la cédula de quien firmó.
-- ---------------------------------------------------------------------------
create function public.public_report(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', wo.number,
    'title', wo.title,
    'status', wo.status,
    'completed_at', wo.completed_at,
    'started_at', (select min(e.created_at) from public.work_order_events e
                   where e.work_order_id = wo.id and e.type = 'estado' and e.payload ->> 'a' = 'en_proceso'),
    'observations', wo.observations,
    'checklist', wo.checklist_state,
    'signer_name', wo.signer_name,
    'total', wo.total,
    'company', jsonb_build_object('name', c.name, 'logo_url', c.logo_url, 'phone', c.phone),
    'customer', cu.name,
    'neighborhood', s.neighborhood,
    'city', s.city,
    'service_type', st.name,
    'technician', m.full_name,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity,
                                          'unit_price', i.unit_price, 'total', i.total) order by i.created_at)
      from public.work_order_items i where i.work_order_id = wo.id), '[]'::jsonb),
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object('kind', a.kind, 'path', a.storage_path) order by a.created_at)
      from public.attachments a where a.work_order_id = wo.id), '[]'::jsonb)
  )
  from public.work_orders wo
  join public.companies c on c.id = wo.company_id
  join public.customers cu on cu.id = wo.customer_id
  left join public.sites s on s.id = wo.site_id
  left join public.service_types st on st.id = wo.service_type_id
  left join public.memberships m on m.id = wo.technician_id
  where length(p_token) >= 32 and wo.public_token = p_token and wo.status = 'completada'
$$;
grant execute on function public.public_report(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado "evidencias", ruta {company_id}/{work_order_id}/{archivo}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Convierte texto a uuid sin fallar (las rutas las escribe el cliente).
create function public.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when invalid_text_representation then
  return null;
end $$;

-- Permiso sobre un archivo según su ruta. p_write = subir.
create function public.can_access_evidence(p_path text, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  with parts as (
    select public.try_uuid(split_part(p_path, '/', 1)) as company_id,
           public.try_uuid(split_part(p_path, '/', 2)) as work_order_id
  )
  select coalesce((
    select exists (
      select 1 from public.work_orders w
      where w.id = parts.work_order_id and w.company_id = parts.company_id
        and (public.is_staff(w.company_id)
             or case when p_write then public.is_my_open_work_order(w.id) else public.is_my_work_order(w.id) end)
    )
    from parts
  ), false)
$$;
grant execute on function public.try_uuid(text) to anon, authenticated;
grant execute on function public.can_access_evidence(text, boolean) to anon, authenticated;

create policy "evidencias: leer" on storage.objects for select
  using (bucket_id = 'evidencias' and public.can_access_evidence(name, false));
create policy "evidencias: subir" on storage.objects for insert
  with check (bucket_id = 'evidencias' and public.can_access_evidence(name, true));
create policy "evidencias: borrar (staff)" on storage.objects for delete
  using (bucket_id = 'evidencias' and public.is_staff(public.try_uuid(split_part(name, '/', 1))));

-- ---------------------------------------------------------------------------
-- Realtime: el panel y la app escuchan cambios de órdenes (respeta RLS).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.work_orders;
  end if;
end $$;
