-- Tecnio: esquema inicial multi-tenant.
-- Cada tabla de negocio lleva company_id y Row Level Security impide que una
-- empresa vea datos de otra. Los técnicos solo ven las órdenes asignadas a ellos.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'dispatcher', 'technician');
create type subscription_status as enum ('trial', 'active', 'past_due', 'canceled');
create type work_order_status as enum ('pending', 'assigned', 'en_route', 'in_progress', 'completed', 'canceled');
create type work_order_priority as enum ('low', 'normal', 'high', 'urgent');
create type item_kind as enum ('material', 'labor');
create type attachment_kind as enum ('photo_before', 'photo_after', 'signature', 'other');
create type quote_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired');
create type message_channel as enum ('whatsapp_link', 'whatsapp_api', 'email');
create type message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed');

-- ---------------------------------------------------------------------------
-- Tenant y usuarios
-- ---------------------------------------------------------------------------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nit text,
  logo_url text,
  plan text not null default 'arranque',
  subscription_status subscription_status not null default 'trial',
  trial_ends_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

-- Un perfil por usuario de Supabase Auth. Login por celular + código (OTP).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'technician',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on profiles (company_id);

-- Helpers para las políticas. security definer evita recursión de RLS sobre profiles.
create function current_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid() and active
$$;

create function current_role_is(roles user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = any (roles) from profiles where id = auth.uid() and active), false)
$$;

create function is_staff() returns boolean
language sql stable as $$ select current_role_is(array['owner', 'dispatcher']::user_role[]) $$;

-- ---------------------------------------------------------------------------
-- Clientes, sedes y equipos
-- ---------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  name text not null,
  whatsapp text,
  email text,
  document_id text, -- NIT o CC
  data_consent_at timestamptz, -- autorización Ley 1581 de 2012
  created_at timestamptz not null default now()
);
create index on customers (company_id);

create table sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  address text not null,
  lat double precision,
  lng double precision,
  access_notes text,
  created_at timestamptz not null default now()
);
create index on sites (customer_id);

create table assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  site_id uuid not null references sites (id) on delete cascade,
  kind text not null, -- aire, DVR, router...
  brand text,
  model text,
  serial text,
  created_at timestamptz not null default now()
);
create index on assets (site_id);

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------
create table service_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  name text not null,
  estimated_minutes int not null default 60,
  checklist jsonb not null default '[]'::jsonb, -- [{ "label": "Limpiar filtros" }, ...]
  created_at timestamptz not null default now()
);
create index on service_types (company_id);

create table materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  name text not null,
  unit text not null default 'und',
  price numeric(14, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on materials (company_id);

-- ---------------------------------------------------------------------------
-- Órdenes de trabajo
-- ---------------------------------------------------------------------------
-- Numeración consecutiva por empresa (OT-1038), no global.
create table company_counters (
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  last_value bigint not null default 1000,
  primary key (company_id, name)
);
alter table company_counters enable row level security; -- sin políticas: solo vía next_number()

create function next_number(p_company uuid, p_name text) returns bigint
language sql security definer set search_path = public as $$
  insert into company_counters (company_id, name, last_value) values (p_company, p_name, 1001)
  on conflict (company_id, name) do update set last_value = company_counters.last_value + 1
  returning last_value
$$;

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  number bigint not null,
  customer_id uuid not null references customers (id),
  site_id uuid references sites (id),
  asset_id uuid references assets (id),
  service_type_id uuid references service_types (id),
  technician_id uuid references profiles (id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status work_order_status not null default 'pending',
  priority work_order_priority not null default 'normal',
  description text,
  checklist jsonb not null default '[]'::jsonb, -- copia del checklist con { label, done }
  total numeric(14, 2) not null default 0,
  report_token text not null unique default encode(gen_random_bytes(16), 'hex'), -- enlace público del reporte
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);
create index on work_orders (company_id, status);
create index on work_orders (technician_id, scheduled_start);

create function work_orders_before_insert() returns trigger
language plpgsql as $$
begin
  if new.number is null then
    new.number := next_number(new.company_id, 'work_order');
  end if;
  if new.checklist = '[]'::jsonb and new.service_type_id is not null then
    select coalesce(jsonb_agg(item || '{"done": false}'::jsonb), '[]'::jsonb) into new.checklist
    from service_types st, jsonb_array_elements(st.checklist) item
    where st.id = new.service_type_id;
  end if;
  if new.technician_id is not null and new.status = 'pending' then
    new.status := 'assigned';
  end if;
  return new;
end $$;
create trigger work_orders_before_insert before insert on work_orders
  for each row execute function work_orders_before_insert();

create table work_order_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  work_order_id uuid not null references work_orders (id) on delete cascade,
  kind text not null, -- created, assigned, status_changed, note...
  data jsonb not null default '{}'::jsonb,
  user_id uuid references profiles (id) default auth.uid(),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index on work_order_events (work_order_id, created_at);

-- Registra cada cambio de estado o técnico en la línea de tiempo.
create function work_orders_log_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into work_order_events (company_id, work_order_id, kind, data, user_id)
    values (new.company_id, new.id, 'created', jsonb_build_object('status', new.status), auth.uid());
  else
    if new.status is distinct from old.status then
      insert into work_order_events (company_id, work_order_id, kind, data, user_id)
      values (new.company_id, new.id, 'status_changed',
              jsonb_build_object('from', old.status, 'to', new.status), auth.uid());
    end if;
    if new.technician_id is distinct from old.technician_id then
      insert into work_order_events (company_id, work_order_id, kind, data, user_id)
      values (new.company_id, new.id, 'assigned', jsonb_build_object('technician_id', new.technician_id), auth.uid());
    end if;
  end if;
  return new;
end $$;
create trigger work_orders_log_event after insert or update on work_orders
  for each row execute function work_orders_log_event();

create table work_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  work_order_id uuid not null references work_orders (id) on delete cascade,
  kind item_kind not null,
  material_id uuid references materials (id),
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index on work_order_items (work_order_id);

-- Mantiene work_orders.total al día.
create function work_order_items_update_total() returns trigger
language plpgsql security definer set search_path = public as $$
declare wo uuid := coalesce(new.work_order_id, old.work_order_id);
begin
  update work_orders set total = coalesce(
    (select sum(quantity * unit_price) from work_order_items where work_order_id = wo), 0)
  where id = wo;
  return null;
end $$;
create trigger work_order_items_update_total after insert or update or delete on work_order_items
  for each row execute function work_order_items_update_total();

create table attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  work_order_id uuid not null references work_orders (id) on delete cascade,
  kind attachment_kind not null,
  storage_path text not null, -- <company_id>/<work_order_id>/<archivo>
  created_at timestamptz not null default now()
);
create index on attachments (work_order_id);

-- ---------------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------------
create table quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  number bigint not null,
  customer_id uuid not null references customers (id),
  site_id uuid references sites (id),
  status quote_status not null default 'draft',
  total numeric(14, 2) not null default 0,
  valid_until date,
  work_order_id uuid references work_orders (id), -- orden creada al aprobarse
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

create function quotes_before_insert() returns trigger
language plpgsql as $$
begin
  if new.number is null then
    new.number := next_number(new.company_id, 'quote');
  end if;
  return new;
end $$;
create trigger quotes_before_insert before insert on quotes
  for each row execute function quotes_before_insert();

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  quote_id uuid not null references quotes (id) on delete cascade,
  kind item_kind not null,
  material_id uuid references materials (id),
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0
);
create index on quote_items (quote_id);

-- ---------------------------------------------------------------------------
-- Mensajes al cliente (para controlar el gasto de WhatsApp)
-- ---------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references companies (id) on delete cascade,
  work_order_id uuid references work_orders (id) on delete set null,
  channel message_channel not null,
  template text not null, -- en_camino, reporte...
  status message_status not null default 'queued',
  cost_usd numeric(10, 5) not null default 0,
  created_at timestamptz not null default now()
);
create index on messages (company_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table sites enable row level security;
alter table assets enable row level security;
alter table service_types enable row level security;
alter table materials enable row level security;
alter table work_orders enable row level security;
alter table work_order_events enable row level security;
alter table work_order_items enable row level security;
alter table attachments enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table messages enable row level security;

create policy "ver mi empresa" on companies for select using (id = current_company_id());
create policy "dueño edita empresa" on companies for update
  using (id = current_company_id() and current_role_is(array['owner']::user_role[]));

create policy "ver mi equipo" on profiles for select using (company_id = current_company_id());
create policy "dueño gestiona equipo" on profiles for all
  using (company_id = current_company_id() and current_role_is(array['owner']::user_role[]))
  with check (company_id = current_company_id());

-- Tablas que todo el equipo lee y solo dueño/despachador escribe.
do $$
declare t text;
begin
  foreach t in array array['customers', 'sites', 'assets', 'service_types', 'materials', 'quotes', 'quote_items', 'messages'] loop
    execute format('create policy "equipo lee" on %I for select using (company_id = current_company_id())', t);
    execute format('create policy "staff escribe" on %I for all using (company_id = current_company_id() and is_staff()) with check (company_id = current_company_id() and is_staff())', t);
  end loop;
end $$;

-- El técnico registra los avisos que envía desde la app.
create policy "técnico registra mensajes" on messages for insert
  with check (company_id = current_company_id());

-- Órdenes: staff ve todo; técnico solo lo asignado y solo puede actualizarlo.
create policy "staff gestiona órdenes" on work_orders for all
  using (company_id = current_company_id() and is_staff())
  with check (company_id = current_company_id() and is_staff());
create policy "técnico ve sus órdenes" on work_orders for select
  using (company_id = current_company_id() and technician_id = auth.uid());
create policy "técnico actualiza sus órdenes" on work_orders for update
  using (company_id = current_company_id() and technician_id = auth.uid())
  with check (company_id = current_company_id() and technician_id = auth.uid());

-- Hijos de una orden: visibles/escribibles si la orden es visible para el usuario.
create function can_access_work_order(wo uuid) returns boolean
language sql stable as $$
  select exists (select 1 from work_orders where id = wo) -- RLS de work_orders ya filtra
$$;

do $$
declare t text;
begin
  foreach t in array array['work_order_events', 'work_order_items', 'attachments'] loop
    execute format('create policy "acceso por orden" on %I for all using (company_id = current_company_id() and can_access_work_order(work_order_id)) with check (company_id = current_company_id() and can_access_work_order(work_order_id))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Registro: crea la empresa y el perfil del dueño en una sola llamada.
-- ---------------------------------------------------------------------------
create function create_company(p_name text, p_full_name text, p_nit text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from profiles where id = auth.uid()) then raise exception 'user already has a company'; end if;
  insert into companies (name, nit) values (p_name, p_nit) returning id into cid;
  insert into profiles (id, company_id, full_name, phone, role)
  values (auth.uid(), cid, p_full_name, (select phone from auth.users where id = auth.uid()), 'owner');
  return cid;
end $$;
revoke execute on function create_company(text, text, text) from anon;

-- ---------------------------------------------------------------------------
-- Reporte público: el cliente final lo abre con el token, sin login.
-- ---------------------------------------------------------------------------
create function public_report(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'number', wo.number,
    'status', wo.status,
    'completed_at', wo.completed_at,
    'description', wo.description,
    'checklist', wo.checklist,
    'total', wo.total,
    'company', jsonb_build_object('name', c.name, 'logo_url', c.logo_url),
    'customer', cu.name,
    'address', s.address,
    'technician', p.full_name,
    'items', coalesce((select jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity, 'unit_price', i.unit_price))
                       from work_order_items i where i.work_order_id = wo.id), '[]'::jsonb),
    'attachments', coalesce((select jsonb_agg(jsonb_build_object('kind', a.kind, 'path', a.storage_path))
                             from attachments a where a.work_order_id = wo.id), '[]'::jsonb)
  )
  from work_orders wo
  join companies c on c.id = wo.company_id
  join customers cu on cu.id = wo.customer_id
  left join sites s on s.id = wo.site_id
  left join profiles p on p.id = wo.technician_id
  where wo.report_token = p_token
$$;
grant execute on function public_report(text) to anon;

-- ---------------------------------------------------------------------------
-- Almacenamiento de fotos y firmas: ruta <company_id>/<work_order_id>/<archivo>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "empresa lee sus archivos" on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = current_company_id()::text);
create policy "empresa sube sus archivos" on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = current_company_id()::text);
