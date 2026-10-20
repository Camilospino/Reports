-- Reporte público para el cliente (/r/[token]): datos de pago de la empresa,
-- calificación del servicio y una versión ampliada de public_report().

-- ---------------------------------------------------------------------------
-- Datos de pago que ve el cliente al tocar "Pagar" (los configura el dueño en Ajustes).
-- ---------------------------------------------------------------------------
alter table public.companies
  add column payment_nequi text check (payment_nequi ~ '^[0-9]{10}$'),
  add column payment_bank text check (length(payment_bank) <= 60),
  add column payment_account_type text check (payment_account_type in ('ahorros', 'corriente')),
  add column payment_account_number text check (payment_account_number ~ '^[0-9-]{4,30}$'),
  add column payment_account_holder text check (length(payment_account_holder) <= 120),
  add column payment_holder_id text check (length(payment_holder_id) <= 30),
  add column payment_notes text check (length(payment_notes) <= 300);

grant update (payment_nequi, payment_bank, payment_account_type, payment_account_number,
              payment_account_holder, payment_holder_id, payment_notes)
  on public.companies to authenticated;

-- ---------------------------------------------------------------------------
-- Calificación del cliente: una por orden. El cliente no tiene cuenta, así que solo
-- se escribe con las funciones de abajo (con el token); el equipo la lee.
-- ---------------------------------------------------------------------------
create table public.work_order_ratings (
  work_order_id uuid primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text check (length(comment) <= 500),
  created_at timestamptz not null default now(),
  commented_at timestamptz,
  foreign key (company_id, work_order_id) references public.work_orders (company_id, id) on delete cascade
);
create index on public.work_order_ratings (company_id, created_at);

alter table public.work_order_ratings enable row level security;
create policy "el equipo lee las calificaciones" on public.work_order_ratings for select
  using (public.is_staff(company_id) or public.is_my_work_order(work_order_id));
revoke all on public.work_order_ratings from anon;
revoke insert, update, delete, truncate, references, trigger on public.work_order_ratings from authenticated;

-- Orden completada a partir del token (las funciones públicas solo trabajan con esto).
create function public.report_order(p_token text) returns public.work_orders
language sql stable security definer set search_path = '' as $$
  select * from public.work_orders
  where p_token ~ '^[0-9a-f]{32}$' and public_token = p_token and status = 'completada'
$$;
revoke execute on function public.report_order(text) from public, anon, authenticated;

-- Guarda las estrellas una sola vez. Devuelve la calificación que quedó guardada.
create function public.rate_report(p_token text, p_stars int) returns int
language plpgsql security definer set search_path = '' as $$
declare wo public.work_orders := public.report_order(p_token);
declare saved int;
begin
  if wo.id is null then
    raise exception using errcode = 'P0002', message = 'Reporte no encontrado';
  end if;
  if p_stars is null or p_stars not between 1 and 5 then
    raise exception using errcode = '22023', message = 'La calificación va de 1 a 5';
  end if;
  insert into public.work_order_ratings (work_order_id, company_id, stars)
  values (wo.id, wo.company_id, p_stars)
  on conflict (work_order_id) do nothing;
  select stars into saved from public.work_order_ratings where work_order_id = wo.id;
  return saved;
end $$;

-- Comentario opcional después de calificar: una sola vez y dentro de 7 días.
create function public.comment_report(p_token text, p_comment text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare wo public.work_orders := public.report_order(p_token);
declare c text := nullif(trim(p_comment), '');
begin
  if wo.id is null then
    raise exception using errcode = 'P0002', message = 'Reporte no encontrado';
  end if;
  if c is null then return false; end if;
  if length(c) > 500 then
    raise exception using errcode = '22001', message = 'El comentario puede tener máximo 500 caracteres';
  end if;
  update public.work_order_ratings
  set comment = c, commented_at = now()
  where work_order_id = wo.id and comment is null and created_at > now() - interval '7 days';
  return found;
end $$;

grant execute on function public.rate_report(text, int) to anon, authenticated;
grant execute on function public.comment_report(text, text) to anon, authenticated;

-- Hora en texto que mandó el celular (puede venir mal escrita): null si no es válida.
create function public.try_timestamptz(p text) returns timestamptz
language plpgsql immutable set search_path = '' as $$
begin
  return p::timestamptz;
exception when others then
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- public_report() ampliado: técnico, llegada, garantía, fotos con id (las sirve el
-- servidor), materiales vs. mano de obra, calificación y datos de pago.
-- Sigue sin exponer la cédula de quien firmó ni datos de contacto del cliente.
-- ---------------------------------------------------------------------------
drop function public.public_report(text);
create function public.public_report(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', wo.number,
    'title', wo.title,
    'status', wo.status,
    'completed_at', wo.completed_at,
    'started_at', (
      select min(coalesce(case when e.type = 'llegada' then public.try_timestamptz(e.payload ->> 'at') end, e.created_at))
      from public.work_order_events e
      where e.work_order_id = wo.id
        and (e.type = 'llegada' or (e.type = 'estado' and e.payload ->> 'a' = 'en_proceso'))),
    'observations', wo.observations,
    'checklist', wo.checklist_state,
    'signer_name', wo.signer_name,
    'total', wo.total,
    'company', jsonb_build_object(
      'name', c.name, 'nit', c.nit, 'logo_url', c.logo_url, 'phone', c.phone,
      'payment', jsonb_build_object(
        'nequi', c.payment_nequi, 'bank', c.payment_bank, 'account_type', c.payment_account_type,
        'account_number', c.payment_account_number, 'holder', c.payment_account_holder,
        'holder_id', c.payment_holder_id, 'notes', c.payment_notes)),
    'customer', cu.name,
    'neighborhood', s.neighborhood,
    'city', s.city,
    'service_type', st.name,
    'warranty_months', st.warranty_months,
    'technician', m.full_name,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity,
                                          'unit_price', i.unit_price, 'total', i.total,
                                          'is_material', i.material_id is not null)
                       order by i.created_at, i.id)
      from public.work_order_items i where i.work_order_id = wo.id), '[]'::jsonb),
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'kind', a.kind, 'caption', a.caption, 'path', a.storage_path)
                       order by a.created_at, a.id)
      from public.attachments a where a.work_order_id = wo.id), '[]'::jsonb),
    'rating', (select jsonb_build_object('stars', r.stars, 'comment', r.comment, 'can_comment',
                                         r.comment is null and r.created_at > now() - interval '7 days')
               from public.work_order_ratings r where r.work_order_id = wo.id)
  )
  from public.work_orders wo
  join public.companies c on c.id = wo.company_id
  join public.customers cu on cu.id = wo.customer_id
  left join public.sites s on s.id = wo.site_id
  left join public.service_types st on st.id = wo.service_type_id
  left join public.memberships m on m.id = wo.technician_id
  where p_token ~ '^[0-9a-f]{32}$' and wo.public_token = p_token and wo.status = 'completada'
$$;
grant execute on function public.public_report(text) to anon, authenticated;

alter publication supabase_realtime add table public.work_order_ratings;
