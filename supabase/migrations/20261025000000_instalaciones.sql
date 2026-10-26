-- Instalaciones: lo que la empresa dejó instalado en cada cliente (equipos, garantía,
-- mantenimiento, accesos, fotos y plano).
--
-- * Los equipos son los mismos assets de la sede: una instalación agrupa varios.
-- * El próximo mantenimiento lo calcula la base desde el último y la frecuencia; el último
--   se actualiza solo al completar una orden de un tipo de servicio de mantenimiento.
-- * Las contraseñas de los accesos viven cifradas en Vault. Solo el dueño y el técnico con
--   una orden abierta en la instalación las leen, con reveal_installation_password(), que
--   deja registro de cada vista.

create type public.installation_system as enum ('cctv', 'alarma', 'red', 'acceso', 'aire', 'otro');
create type public.installation_status as enum ('activa', 'retirada');
create type public.asset_status as enum ('funcionando', 'con_falla', 'retirado');

-- Tipos de servicio que cuentan como mantenimiento (actualizan el último mantenimiento).
alter table public.service_types add column is_maintenance boolean not null default false;
update public.service_types set is_maintenance = true where name ilike 'mantenimiento%';

-- ---------------------------------------------------------------------------
-- Instalaciones
-- ---------------------------------------------------------------------------
create table public.installations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  number int not null default 0, -- lo asigna el trigger; se muestra como INS-1001
  customer_id uuid not null,
  site_id uuid not null,
  origin_work_order_id uuid,
  name text not null check (length(trim(name)) between 1 and 120),
  system_type public.installation_system not null,
  installed_on date not null,
  warranty_until date,
  maintenance_every_months int check (maintenance_every_months between 1 and 60), -- null = sin plan
  last_maintenance date,
  next_maintenance date, -- lo calcula el trigger
  status public.installation_status not null default 'activa',
  installed_by uuid,
  notes text check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  unique (company_id, number),
  unique (company_id, id),
  check (warranty_until is null or warranty_until >= installed_on),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, site_id) references public.sites (company_id, id),
  foreign key (company_id, origin_work_order_id) references public.work_orders (company_id, id) on delete set null (origin_work_order_id),
  foreign key (company_id, installed_by) references public.memberships (company_id, id) on delete set null (installed_by)
);
create index on public.installations (company_id, customer_id);
create index on public.installations (company_id, next_maintenance);

create function public.installations_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.number := public.next_number(new.company_id, 'installation');
  elsif new.company_id <> old.company_id or new.number <> old.number then
    raise exception using errcode = '42501', message = 'La empresa y el número de la instalación no se pueden cambiar';
  end if;

  if not exists (select 1 from public.sites where id = new.site_id and customer_id = new.customer_id and company_id = new.company_id) then
    raise exception using errcode = '23514', message = 'La sede no es de este cliente';
  end if;
  if tg_op = 'INSERT' or new.installed_by is distinct from old.installed_by then
    perform public.assert_technician(new.company_id, new.installed_by);
  end if;

  new.next_maintenance := case when new.maintenance_every_months is not null then
    coalesce(new.last_maintenance, new.installed_on) + make_interval(months => new.maintenance_every_months) end;
  return new;
end $$;
create trigger installations_before_write before insert or update on public.installations
  for each row execute function public.installations_before_write();

-- Equipos de la instalación: los assets de la sede, con nombre, grupo, ubicación y estado.
alter table public.assets
  add column installation_id uuid,
  add column name text check (length(trim(name)) between 1 and 80),
  add column category text not null default 'Otros' check (length(trim(category)) between 1 and 40), -- "Cámaras", "Otros"...
  add column location text check (length(location) <= 80),
  add column photo_path text,
  add column status public.asset_status not null default 'funcionando',
  add foreign key (company_id, installation_id) references public.installations (company_id, id) on delete cascade,
  add check (photo_path is null or (photo_path like company_id::text || '/' || installation_id::text || '/%' and photo_path not like '%..%'));
create index on public.assets (installation_id);

-- El equipo queda en la sede de su instalación.
create function public.assets_set_site() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.installation_id is not null then
    select site_id into new.site_id from public.installations
    where id = new.installation_id and company_id = new.company_id;
  end if;
  return new;
end $$;
create trigger assets_set_site before insert or update of installation_id, site_id on public.assets
  for each row execute function public.assets_set_site();

-- Órdenes de una instalación (historial). El técnico no la cambia.
alter table public.work_orders
  add column installation_id uuid,
  add foreign key (company_id, installation_id) references public.installations (company_id, id) on delete set null (installation_id);
create index on public.work_orders (installation_id);

create function public.work_orders_installation_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.installation_id is not distinct from old.installation_id then return new; end if;
  if tg_op = 'UPDATE' and auth.uid() is not null and public.my_role(old.company_id) = 'technician' then
    raise exception using errcode = '42501', message = 'El técnico no puede cambiar la instalación de la orden';
  end if;
  if new.installation_id is not null and not exists (
    select 1 from public.installations
    where id = new.installation_id and company_id = new.company_id and customer_id = new.customer_id
  ) then
    raise exception using errcode = '23514', message = 'La instalación no es de este cliente';
  end if;
  return new;
end $$;
create trigger work_orders_installation_guard before insert or update on public.work_orders
  for each row execute function public.work_orders_installation_guard();

-- Al completar un mantenimiento, la instalación toma esa fecha como último mantenimiento.
create function public.work_orders_update_maintenance() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d date := (new.completed_at at time zone 'America/Bogota')::date;
begin
  if new.installation_id is null or new.status <> 'completada' or (tg_op = 'UPDATE' and old.status = 'completada') then
    return null;
  end if;
  if exists (select 1 from public.service_types where id = new.service_type_id and is_maintenance) then
    update public.installations set last_maintenance = greatest(last_maintenance, d)
    where id = new.installation_id;
  end if;
  return null;
end $$;
create trigger work_orders_update_maintenance after insert or update of status on public.work_orders
  for each row execute function public.work_orders_update_maintenance();

-- ¿El usuario actual tiene una orden abierta en esta instalación?
create function public.has_open_order_in_installation(p_installation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.work_orders w
    join public.memberships m on m.id = w.technician_id
    where w.installation_id = p_installation and m.user_id = (select auth.uid()) and m.active
      and w.status not in ('completada', 'cancelada')
  )
$$;

-- ---------------------------------------------------------------------------
-- Accesos técnicos (DVR, router...). La contraseña está en Vault; aquí solo su id.
-- ---------------------------------------------------------------------------
create table public.installation_credentials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  installation_id uuid not null,
  label text not null default 'DVR' check (length(trim(label)) between 1 and 40),
  host text check (length(host) <= 120),
  username text check (length(username) <= 80),
  secret_id uuid, -- vault.secrets.id
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, installation_id) references public.installations (company_id, id) on delete cascade
);
create index on public.installation_credentials (installation_id);

-- Cada vez que alguien ve una contraseña. Solo se agrega (desde la RPC); no se edita ni se borra.
create table public.installation_credential_views (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  installation_id uuid not null,
  credential_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  foreign key (company_id, installation_id) references public.installations (company_id, id) on delete cascade,
  foreign key (company_id, credential_id) references public.installation_credentials (company_id, id) on delete cascade
);
create index on public.installation_credential_views (installation_id, viewed_at desc);

create function public.can_see_credentials(p_company uuid, p_installation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role(p_company) = 'owner', false) or public.has_open_order_in_installation(p_installation)
$$;

create function public.reveal_installation_password(p_credential uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare cred public.installation_credentials;
declare secret text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Debes iniciar sesión';
  end if;
  select * into cred from public.installation_credentials where id = p_credential;
  if not found or not public.can_see_credentials(cred.company_id, cred.installation_id) then
    raise exception using errcode = '42501', message = 'No tienes acceso a esta contraseña';
  end if;
  insert into public.installation_credential_views (company_id, installation_id, credential_id, user_id)
  values (cred.company_id, cred.installation_id, cred.id, auth.uid());
  select decrypted_secret into secret from vault.decrypted_secrets where id = cred.secret_id;
  return secret;
end $$;

-- El dueño guarda o cambia un acceso. Una contraseña vacía deja la que había.
create function public.save_installation_credential(
  p_installation uuid,
  p_label text,
  p_host text,
  p_username text,
  p_password text,
  p_credential uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inst public.installations;
declare cred public.installation_credentials;
begin
  select * into inst from public.installations where id = p_installation;
  if not found or public.my_role(inst.company_id) is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'Solo el dueño puede guardar accesos';
  end if;

  if p_credential is null then
    insert into public.installation_credentials (company_id, installation_id, label, host, username)
    values (inst.company_id, inst.id, coalesce(nullif(trim(p_label), ''), 'DVR'), nullif(trim(p_host), ''), nullif(trim(p_username), ''))
    returning * into cred;
  else
    update public.installation_credentials
    set label = coalesce(nullif(trim(p_label), ''), 'DVR'), host = nullif(trim(p_host), ''), username = nullif(trim(p_username), '')
    where id = p_credential and installation_id = inst.id
    returning * into cred;
    if not found then
      raise exception using errcode = 'P0002', message = 'Acceso no encontrado';
    end if;
  end if;

  if nullif(p_password, '') is not null then
    if cred.secret_id is null then
      update public.installation_credentials set secret_id = vault.create_secret(p_password, 'installation_credential:' || cred.id)
      where id = cred.id;
    else
      perform vault.update_secret(cred.secret_id, p_password);
    end if;
  end if;
  return cred.id;
end $$;

-- ---------------------------------------------------------------------------
-- Plano y fotos del sitio. Ruta en Storage (bucket "instalaciones"):
-- {company_id}/{installation_id}/{archivo}
-- ---------------------------------------------------------------------------
create table public.installation_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  installation_id uuid not null,
  kind text not null check (kind in ('plano', 'foto')),
  storage_path text not null,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (company_id, installation_id) references public.installations (company_id, id) on delete cascade,
  check (storage_path like company_id::text || '/' || installation_id::text || '/%' and storage_path not like '%..%')
);
create index on public.installation_files (installation_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.installations enable row level security;
alter table public.installation_credentials enable row level security;
alter table public.installation_credential_views enable row level security;
alter table public.installation_files enable row level security;

-- Como clientes y sedes: todo el equipo lee; dueño y despachador escriben.
do $$
declare t text;
begin
  foreach t in array array['installations', 'installation_files'] loop
    execute format('create policy "miembros leen" on public.%I for select using (public.is_member(company_id))', t);
    execute format('create policy "staff crea" on public.%I for insert with check (public.is_staff(company_id))', t);
    execute format('create policy "staff edita" on public.%I for update using (public.is_staff(company_id)) with check (public.is_staff(company_id))', t);
    execute format('create policy "staff borra" on public.%I for delete using (public.is_staff(company_id))', t);
  end loop;
end $$;

-- Accesos: los leen el dueño y el técnico con orden abierta; se escriben con save_installation_credential().
create policy "dueño y técnico con orden abierta leen" on public.installation_credentials for select
  using (public.can_see_credentials(company_id, installation_id));
create policy "dueño borra" on public.installation_credentials for delete
  using (public.my_role(company_id) = 'owner');

create policy "dueño lee" on public.installation_credential_views for select
  using (public.my_role(company_id) = 'owner');

revoke all on public.installations, public.installation_credentials, public.installation_credential_views,
  public.installation_files from anon;
revoke truncate, references, trigger on public.installations, public.installation_credentials,
  public.installation_credential_views, public.installation_files from authenticated;
-- El id del secreto no sale de la base; el registro de vistas solo lo escribe la RPC.
revoke all on public.installation_credentials from authenticated;
grant select (id, company_id, installation_id, label, host, username, created_at) on public.installation_credentials to authenticated;
grant delete on public.installation_credentials to authenticated;
revoke all on public.installation_credential_views from authenticated;
grant select on public.installation_credential_views to authenticated;

revoke execute on function public.installations_before_write() from public, anon, authenticated;
revoke execute on function public.assets_set_site() from public, anon, authenticated;
revoke execute on function public.work_orders_installation_guard() from public, anon, authenticated;
revoke execute on function public.work_orders_update_maintenance() from public, anon, authenticated;
revoke execute on function public.has_open_order_in_installation(uuid) from public, anon;
revoke execute on function public.can_see_credentials(uuid, uuid) from public, anon;
grant execute on function public.has_open_order_in_installation(uuid) to authenticated;
grant execute on function public.can_see_credentials(uuid, uuid) to authenticated;
revoke execute on function public.reveal_installation_password(uuid) from public, anon;
grant execute on function public.reveal_installation_password(uuid) to authenticated;
revoke execute on function public.save_installation_credential(uuid, text, text, text, text, uuid) from public, anon;
grant execute on function public.save_installation_credential(uuid, text, text, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado "instalaciones", ruta {company_id}/{installation_id}/{archivo}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('instalaciones', 'instalaciones', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.can_access_installation_file(p_path text, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  with parts as (
    select public.try_uuid(split_part(p_path, '/', 1)) as company_id,
           public.try_uuid(split_part(p_path, '/', 2)) as installation_id
  )
  select coalesce((
    select exists (
      select 1 from public.installations i
      where i.id = parts.installation_id and i.company_id = parts.company_id
        and case when p_write then public.is_staff(i.company_id) else public.is_member(i.company_id) end
    )
    from parts
  ), false)
$$;
revoke execute on function public.can_access_installation_file(text, boolean) from public, anon;
grant execute on function public.can_access_installation_file(text, boolean) to authenticated;

create policy "instalaciones: leer" on storage.objects for select
  using (bucket_id = 'instalaciones' and public.can_access_installation_file(name, false));
create policy "instalaciones: subir" on storage.objects for insert
  with check (bucket_id = 'instalaciones' and public.can_access_installation_file(name, true));
create policy "instalaciones: borrar (staff)" on storage.objects for delete
  using (bucket_id = 'instalaciones' and public.can_access_installation_file(name, true));
