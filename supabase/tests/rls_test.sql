-- Aislamiento entre empresas y permisos por rol. Usa los datos de seed.sql.
-- Ejecutar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(164);

-- ---------------------------------------------------------------------------
-- Contexto (como postgres, antes de cambiar de usuario)
-- ---------------------------------------------------------------------------
-- Un borrador de cotización en A (no debe verse por enlace).
insert into quotes (company_id, customer_id, items)
select 'c0000000-0000-0000-0000-00000000000a', id, '[{"description":"X","quantity":1,"unit_price":1}]'
from customers where company_id = 'c0000000-0000-0000-0000-00000000000a' limit 1;

create temp table ctx as select
  'c0000000-0000-0000-0000-00000000000a'::uuid as co_a,
  'c0000000-0000-0000-0000-00000000000b'::uuid as co_b,
  'a0000000-0000-0000-0000-000000000001'::uuid as owner_a,
  'a0000000-0000-0000-0000-000000000002'::uuid as disp_a,
  'a0000000-0000-0000-0000-000000000003'::uuid as tech_a,
  'a1000000-0000-0000-0000-000000000003'::uuid as tech_a_m,
  'a1000000-0000-0000-0000-000000000004'::uuid as tech2_a_m,
  'a1000000-0000-0000-0000-000000000002'::uuid as disp_a_m,
  'b1000000-0000-0000-0000-000000000003'::uuid as tech_b_m,
  (select id from customers where company_id = 'c0000000-0000-0000-0000-00000000000a' limit 1) as cust_a,
  (select id from customers where company_id = 'c0000000-0000-0000-0000-00000000000b' limit 1) as cust_b,
  (select id from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000b' limit 1) as wo_b,
  (select id from work_orders where technician_id = 'a1000000-0000-0000-0000-000000000003' and status = 'asignada' limit 1) as wo_tech_open,
  (select id from work_orders where technician_id = 'a1000000-0000-0000-0000-000000000003' and status = 'completada' limit 1) as wo_tech_done,
  (select id from work_orders where technician_id = 'a1000000-0000-0000-0000-000000000004' and status = 'asignada' limit 1) as wo_other_tech,
  (select id from materials where company_id = 'c0000000-0000-0000-0000-00000000000a' and name = 'Cable UTP Cat 6') as mat_a,
  (select public_token from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'completada' limit 1) as token_done,
  (select count(*)::int from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000a') as n_a,
  (select count(*)::int from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000b') as n_b,
  (select max(number) from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000a') as max_a,
  (select id from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'completada' and invoiced_at is null limit 1) as wo_done_a,
  (select id from work_orders where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'pendiente' limit 1) as wo_pending_a,
  (select id from quotes where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'aprobada' limit 1) as quote_ok_a,
  (select id from quotes where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'enviada' limit 1) as quote_sent_a,
  (select public_token from quotes where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'enviada' limit 1) as quote_token_a,
  (select id from quotes where company_id = 'c0000000-0000-0000-0000-00000000000b' and status = 'aprobada' limit 1) as quote_ok_b,
  (select public_token from quotes where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'borrador' limit 1) as quote_draft_token,
  (select public_token from work_orders w where company_id = 'c0000000-0000-0000-0000-00000000000a' and status = 'completada'
     and not exists (select 1 from work_order_ratings r where r.work_order_id = w.id) limit 1) as token_unrated;
grant select on ctx to authenticated, anon;

-- Archivo de la empresa B en Storage, para probar que A no lo ve.
insert into storage.objects (bucket_id, name)
select 'evidencias', co_b || '/' || wo_b || '/foto.jpg' from ctx;

-- Un equipo (asset) en cada empresa: el seed no trae.
insert into assets (company_id, site_id, type, brand)
select company_id, id, 'DVR', 'Hikvision' from sites
where id in ((select id from sites where company_id = (select co_a from ctx) limit 1),
             (select id from sites where company_id = (select co_b from ctx) limit 1));

-- Una instalación con acceso en B (A tiene INS-1001 en el seed), para probar el aislamiento.
insert into installations (id, company_id, customer_id, site_id, name, system_type, installed_on)
select 'e2000000-0000-0000-0000-000000000001', company_id, customer_id, id, 'Aires lobby', 'aire', current_date - 30
from sites where customer_id = (select cust_b from ctx);
insert into installation_credentials (id, company_id, installation_id, label, host, username, secret_id)
values ('e2100000-0000-0000-0000-000000000001', (select co_b from ctx), 'e2000000-0000-0000-0000-000000000001',
        'Router', '10.0.0.1', 'admin', vault.create_secret('ClaveDeB', 'prueba-b'));
insert into installation_credential_views (company_id, installation_id, credential_id, user_id)
values ((select co_b from ctx), 'e2000000-0000-0000-0000-000000000001', 'e2100000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001');

-- Pruebas genéricas: recorren TODAS las tablas con company_id, así una tabla nueva
-- queda cubierta sin escribir pruebas a mano. Devuelven las tablas que fallan.
create function pg_temp.company_tables() returns setof text language sql as $$
  select c.table_name::text from information_schema.columns c
  join information_schema.tables t using (table_schema, table_name)
  where c.table_schema = 'public' and c.column_name = 'company_id' and t.table_type = 'BASE TABLE'
  order by 1
$$;
create function pg_temp.leaks(co uuid, action text) returns text[] language plpgsql as $$
declare t text; n int; bad text[] := '{}';
begin
  for t in select pg_temp.company_tables() loop
    begin
      if action = 'select' then
        execute format('select count(*)::int from public.%I where company_id = $1', t) into n using co;
      elsif action = 'update' then
        execute format('update public.%I set company_id = company_id where company_id = $1', t) using co;
        get diagnostics n = row_count;
      else
        execute format('delete from public.%I where company_id = $1', t) using co;
        get diagnostics n = row_count;
      end if;
    exception when insufficient_privilege then
      n := 0; -- sin permiso sobre la tabla: tampoco hay fuga
    end;
    if n > 0 then bad := bad || t; end if;
  end loop;
  return bad;
end $$;
create function pg_temp.readable_tables() returns text[] language plpgsql as $$
declare t text; ok text[] := '{}';
begin
  for t in select c.relname from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
           where ns.nspname = 'public' and c.relkind = 'r' loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      ok := ok || t;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
  return ok;
end $$;

create function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

-- Datos del seed
select ok((select n_a >= 15 from ctx), 'seed: al menos 15 órdenes en A');
select ok((select n_b >= 15 from ctx), 'seed: al menos 15 órdenes en B');
select is((select min(number) from work_orders where company_id = (select co_b from ctx)), 1001, 'numeración por empresa: B también empieza en 1001');
select ok((select bool_and(public_token is not null) from work_orders where status = 'completada'), 'las completadas tienen token público');
select is(array(select c.relname::text from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
                where ns.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), '{}'::text[], 'todas las tablas tienen RLS');
select ok((select count(*) >= 14 from pg_temp.company_tables()), 'las pruebas genéricas recorren todas las tablas con company_id');

-- ---------------------------------------------------------------------------
-- Dueño de A no lee nada de B
-- ---------------------------------------------------------------------------
select pg_temp.login((select owner_a from ctx));
select is((select count(*)::int from companies), 1, 'A ve solo su empresa');
select is((select count(*)::int from memberships where company_id = (select co_b from ctx)), 0, 'A no ve memberships de B');
select is((select count(*)::int from customers where company_id = (select co_b from ctx)), 0, 'A no ve clientes de B');
select is((select count(*)::int from sites where company_id = (select co_b from ctx)), 0, 'A no ve sedes de B');
select is((select count(*)::int from service_types where company_id = (select co_b from ctx)), 0, 'A no ve tipos de servicio de B');
select is((select count(*)::int from materials where company_id = (select co_b from ctx)), 0, 'A no ve materiales de B');
select is((select count(*)::int from work_orders where company_id = (select co_b from ctx)), 0, 'A no ve órdenes de B');
select is((select count(*)::int from work_order_events where company_id = (select co_b from ctx)), 0, 'A no ve eventos de B');
select is((select count(*)::int from work_order_items where company_id = (select co_b from ctx)), 0, 'A no ve ítems de B');
select is((select count(*)::int from quotes where company_id = (select co_b from ctx)), 0, 'A no ve cotizaciones de B');
select is((select count(*)::int from storage.objects where bucket_id = 'evidencias' and name like (select co_b::text from ctx) || '/%'), 0, 'A no ve archivos de B');
select is((select count(*)::int from customers), 8, 'A ve sus 8 clientes');
select is(pg_temp.leaks((select co_b from ctx), 'select'), '{}'::text[], 'dueño A: ninguna tabla deja leer filas de B');
select is(pg_temp.leaks((select co_b from ctx), 'update'), '{}'::text[], 'dueño A: ninguna tabla deja editar filas de B');
select is(pg_temp.leaks((select co_b from ctx), 'delete'), '{}'::text[], 'dueño A: ninguna tabla deja borrar filas de B');
select is((select count(*)::int from assets where company_id <> (select co_a from ctx)), 0, 'A ve solo sus equipos (assets)');
select throws_ok($$insert into assets (company_id, site_id, type) select co_b, (select id from sites where company_id = co_b limit 1), 'X' from ctx$$, '42501', null, 'A no crea equipos en B');
select throws_ok($$insert into sites (company_id, customer_id, address) select co_b, cust_b, 'X' from ctx$$, '42501', null, 'A no crea sedes en B');
select is((select count(*)::int from work_orders), (select n_a from ctx), 'A ve todas sus órdenes');
select throws_ok('select * from company_counters', '42501', null, 'nadie lee los contadores');
select is((select count(*)::int from work_order_ratings where company_id = (select co_b from ctx)), 0, 'A no ve calificaciones de B');
select ok((select count(*) > 0 from work_order_ratings), 'A ve las calificaciones de sus clientes');
select throws_ok($$insert into work_order_ratings (work_order_id, company_id, stars) select wo_done_a, co_a, 5 from ctx$$, '42501', null, 'la empresa no se pone calificaciones');
select lives_ok($$update companies set payment_nequi = '3109998877' where id = (select co_a from ctx)$$, 'el dueño edita sus datos de pago');
select throws_ok($$select dashboard_kpis((select co_b from ctx))$$, '42501', null, 'A no ve los indicadores de B');

-- Dueño de A no escribe en B
select throws_ok($$insert into customers (company_id, name) select co_b, 'Intruso' from ctx$$, '42501', null, 'A no crea clientes en B');
select throws_ok($$insert into materials (company_id, name) select co_b, 'Intruso' from ctx$$, '42501', null, 'A no crea materiales en B');
select throws_ok($$insert into service_types (company_id, name) select co_b, 'Intruso' from ctx$$, '42501', null, 'A no crea tipos de servicio en B');
select throws_ok($$insert into work_orders (company_id, customer_id, title) select co_b, cust_b, 'Intruso' from ctx$$, '42501', null, 'A no crea órdenes en B');
select throws_ok($$insert into quotes (company_id, customer_id) select co_b, cust_b from ctx$$, '42501', null, 'A no crea cotizaciones en B');
select throws_ok($$insert into memberships (user_id, company_id, role, full_name) select owner_a, co_b, 'owner', 'Intruso' from ctx$$, '42501', null, 'A no se mete como dueño en B');
select throws_ok($$insert into work_order_events (work_order_id, type) select wo_b, 'nota' from ctx$$, '42501', null, 'A no agrega eventos a órdenes de B');
select throws_ok($$insert into work_order_items (work_order_id, description) select wo_b, 'Intruso' from ctx$$, '42501', null, 'A no agrega ítems a órdenes de B');
select throws_ok($$insert into attachments (work_order_id, kind, storage_path) select wo_b, 'foto_antes', co_b || '/' || wo_b || '/x.jpg' from ctx$$, '42501', null, 'A no agrega adjuntos a órdenes de B');
select throws_ok($$insert into storage.objects (bucket_id, name) select 'evidencias', co_b || '/' || wo_b || '/x.jpg' from ctx$$, '42501', null, 'A no sube archivos a la carpeta de B');
select throws_ok($$insert into storage.objects (bucket_id, name) select 'evidencias', co_a || '/' || wo_b || '/x.jpg' from ctx$$, '42501', null, 'A no sube a una orden de B dentro de su carpeta');
select lives_ok($$insert into storage.objects (bucket_id, name) select 'evidencias', co_a || '/' || wo_tech_open || '/x.jpg' from ctx$$, 'A sube archivos a sus órdenes');

-- Llaves compuestas: no se puede enlazar una orden de A con un cliente de B.
select throws_ok($$insert into work_orders (company_id, customer_id, title) select co_a, cust_b, 'Mezcla' from ctx$$, '23503', null, 'orden de A con cliente de B: rechazada');
select throws_ok($$insert into work_orders (company_id, customer_id, title, technician_id) select co_a, cust_a, 'Mezcla', tech_b_m from ctx$$, '23514', null, 'orden de A con técnico de B: rechazada');
select throws_ok($$insert into work_orders (company_id, customer_id, title, technician_id) select co_a, cust_a, 'Mal', disp_a_m from ctx$$, '23514', null, 'no se asigna a un despachador como técnico');

-- Intentos de modificar o borrar B (no deben afectar filas; se verifica más abajo).
update customers set name = 'hackeado' where company_id = (select co_b from ctx);
update work_orders set status = 'cancelada' where company_id = (select co_b from ctx);
delete from materials where company_id = (select co_b from ctx);
delete from work_orders where company_id = (select co_b from ctx);
update companies set name = 'hackeado' where id = (select co_b from ctx);

-- Datos de facturación protegidos
select throws_ok($$update companies set plan = 'empresa' where id = (select co_a from ctx)$$, '42501', null, 'el dueño no cambia su plan');
select throws_ok($$update companies set subscription_status = 'active' where id = (select co_a from ctx)$$, '42501', null, 'el dueño no cambia su suscripción');
select lives_ok($$update companies set name = 'Seguridad Total S.A.S' where id = (select co_a from ctx)$$, 'el dueño sí cambia el nombre');
select throws_ok($$update work_orders set total = 1 where id = (select wo_tech_open from ctx)$$, '42501', null, 'el total no se edita a mano');
select throws_ok($$update work_orders set public_token = repeat('a', 32) where id = (select wo_tech_open from ctx)$$, '42501', null, 'el token no se edita a mano');
select throws_ok($$update memberships set role = 'technician' where user_id = (select owner_a from ctx)$$, '42501', null, 'el dueño no se quita su propio rol');

-- Numeración consecutiva por empresa
insert into work_orders (company_id, customer_id, title) select co_a, cust_a, 'Nueva' from ctx;
select is((select number from work_orders where title = 'Nueva'), (select max_a + 1 from ctx), 'la siguiente orden de A es la consecutiva');

-- ---------------------------------------------------------------------------
-- Despachador
-- ---------------------------------------------------------------------------
select pg_temp.login((select disp_a from ctx));
select is(pg_temp.leaks((select co_b from ctx), 'select'), '{}'::text[], 'despachador A: ninguna tabla deja leer filas de B');
select is(pg_temp.leaks((select co_b from ctx), 'update'), '{}'::text[], 'despachador A: ninguna tabla deja editar filas de B');
select throws_ok($$insert into memberships (user_id, company_id, role, full_name) select disp_a, co_a, 'owner', 'Yo' from ctx$$, '42501', null, 'el despachador no crea miembros');
update companies set name = 'hackeado' where id = (select co_a from ctx);
select lives_ok($$update work_orders set technician_id = (select tech_a_m from ctx) where status = 'pendiente' and company_id = (select co_a from ctx)$$, 'el despachador asigna órdenes');

-- ---------------------------------------------------------------------------
-- Técnico de A
-- ---------------------------------------------------------------------------
select pg_temp.login((select tech_a from ctx));
select is(pg_temp.leaks((select co_b from ctx), 'select'), '{}'::text[], 'técnico A: ninguna tabla deja leer filas de B');
select is(pg_temp.leaks((select co_b from ctx), 'delete'), '{}'::text[], 'técnico A: ninguna tabla deja borrar filas de B');
select is((select count(*)::int from work_orders where technician_id is distinct from (select tech_a_m from ctx)), 0, 'el técnico solo ve sus órdenes');
select ok((select count(*) from work_orders) > 0, 'el técnico ve sus órdenes');
select is((select count(*)::int from work_order_events where work_order_id = (select wo_other_tech from ctx)), 0, 'el técnico no ve eventos de órdenes ajenas');
select is((select count(*)::int from customers), 8, 'el técnico ve los clientes de su empresa');
select lives_ok($$update work_orders set status = 'en_camino' where id = (select wo_tech_open from ctx)$$, 'el técnico marca "en camino"');
select throws_ok($$update work_orders set title = 'otro' where id = (select wo_tech_open from ctx)$$, '42501', null, 'el técnico no cambia el título');
select throws_ok($$update work_orders set technician_id = null where id = (select wo_tech_open from ctx)$$, '42501', null, 'el técnico no se desasigna');
select throws_ok($$update work_orders set status = 'cancelada' where id = (select wo_tech_open from ctx)$$, '42501', null, 'el técnico no cancela');
select throws_ok($$update work_orders set status = 'en_proceso' where id = (select wo_tech_done from ctx)$$, '42501', null, 'el técnico no reabre una orden cerrada');
update work_orders set status = 'en_proceso' where id = (select wo_other_tech from ctx);

-- Materiales: del catálogo, al precio del catálogo, solo en órdenes abiertas.
select throws_ok($$insert into work_order_items (work_order_id, description, unit_price) select wo_tech_open, 'Inventado', 999999 from ctx$$, '42501', null, 'el técnico no agrega ítems libres');
insert into work_order_items (work_order_id, material_id, description, quantity, unit_price)
select wo_tech_open, mat_a, 'barato', 10, 1 from ctx;
select is((select unit_price from work_order_items where work_order_id = (select wo_tech_open from ctx) and material_id = (select mat_a from ctx)), 2800::numeric(14,2), 'el precio sale del catálogo');
select is((select total from work_orders where id = (select wo_tech_open from ctx)), 28000::numeric(14,2), 'el total de la orden se recalcula');
select throws_ok($$update work_order_items set unit_price = 1 where work_order_id = (select wo_tech_open from ctx)$$, '42501', null, 'el técnico no cambia precios');
select throws_ok($$insert into work_order_items (work_order_id, material_id, quantity) select wo_tech_done, mat_a, 1 from ctx$$, '42501', null, 'el técnico no agrega ítems a órdenes cerradas');

-- Historial y archivos
select throws_ok($$insert into work_order_events (work_order_id, type, user_id) select wo_tech_open, 'nota', owner_a from ctx$$, '42501', null, 'el técnico no registra eventos a nombre de otro');
select lives_ok($$insert into work_order_events (work_order_id, type, lat, lng) select wo_tech_open, 'llegada', 4.65, -74.06 from ctx$$, 'el técnico registra su llegada');
delete from work_order_events where work_order_id = (select wo_tech_open from ctx);
select throws_ok($$insert into storage.objects (bucket_id, name) select 'evidencias', co_a || '/' || wo_other_tech || '/x.jpg' from ctx$$, '42501', null, 'el técnico no sube fotos a órdenes ajenas');
select throws_ok($$insert into customers (company_id, name) select co_a, 'X' from ctx$$, '42501', null, 'el técnico no crea clientes');
select throws_ok($$select dashboard_kpis((select co_a from ctx))$$, '42501', null, 'el técnico no ve los indicadores del panel');

-- Cerrar la orden genera el token del reporte
update work_orders set status = 'en_proceso' where id = (select wo_tech_open from ctx);
update work_orders set status = 'completada', signer_name = 'Cliente' where id = (select wo_tech_open from ctx);
select ok((select public_token is not null and completed_at is not null from work_orders where id = (select wo_tech_open from ctx)), 'al completar se genera el token y la hora');

-- ---------------------------------------------------------------------------
-- Ausencias de técnicos (agenda)
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.login((select owner_a from ctx));
select is((select count(*)::int from absences where company_id = (select co_b from ctx)), 0, 'A no ve ausencias de B');
select ok((select count(*) from absences) >= 2, 'A ve las ausencias de sus técnicos');
select throws_ok($$insert into absences (company_id, technician_id, starts_at, ends_at) select co_b, tech_b_m, now(), now() + interval '1 hour' from ctx$$, '42501', null, 'A no crea ausencias en B');
select throws_ok($$insert into absences (company_id, technician_id, starts_at, ends_at) select co_a, tech_b_m, now(), now() + interval '1 hour' from ctx$$, '23514', null, 'A no registra ausencias de técnicos de B');
select throws_ok($$insert into absences (company_id, technician_id, starts_at, ends_at) select co_a, disp_a_m, now(), now() + interval '1 hour' from ctx$$, '23514', null, 'solo los técnicos tienen ausencias');
select lives_ok($$insert into absences (company_id, technician_id, starts_at, ends_at, reason) select co_a, tech_a_m, now() + interval '1 day', now() + interval '2 days', 'Permiso' from ctx$$, 'el dueño registra una ausencia');

select pg_temp.login((select tech_a from ctx));
select ok((select count(*) = 1 and bool_and(technician_id = (select tech_a_m from ctx)) from absences), 'el técnico solo ve sus propias ausencias');
select throws_ok($$insert into absences (company_id, technician_id, starts_at, ends_at) select co_a, tech_a_m, now(), now() + interval '1 hour' from ctx$$, '42501', null, 'el técnico no crea ausencias');
delete from absences;
reset role;
select is((select count(*)::int from absences where technician_id = (select tech_a_m from ctx)), 1, 'el técnico no borra su ausencia');

-- ---------------------------------------------------------------------------
-- Facturación y cotizaciones
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.login((select tech_a from ctx));
select throws_ok($$update work_orders set invoiced_at = now() where id = (select wo_tech_done from ctx)$$, '42501', null, 'el técnico no factura');

select pg_temp.login((select disp_a from ctx));
select throws_ok($$update work_orders set invoiced_at = now() where id = (select wo_pending_a from ctx)$$, '23514', null, 'no se factura una orden sin completar');
select lives_ok($$update work_orders set invoiced_at = '2000-01-01' where id = (select wo_done_a from ctx)$$, 'el despachador factura una orden completada');
select ok((select invoiced_at > now() - interval '1 minute' from work_orders where id = (select wo_done_a from ctx)), 'la fecha de facturación la pone el sistema');
select ok(exists (select 1 from work_order_events where work_order_id = (select wo_done_a from ctx) and type = 'facturada'), 'facturar queda en el historial');
select throws_ok($$insert into work_order_items (work_order_id, description, quantity, unit_price) select wo_done_a, 'Extra', 1, 1000 from ctx$$, '42501', null, 'una orden facturada no cambia sus materiales');
select throws_ok($$update work_orders set status = 'en_proceso' where id = (select wo_done_a from ctx)$$, '23514', null, 'una orden facturada no se reabre');

select throws_ok($$select convert_quote_to_order((select quote_sent_a from ctx))$$, '23514', null, 'solo se convierten cotizaciones aprobadas');
select throws_ok($$select convert_quote_to_order((select quote_ok_b from ctx))$$, '42501', null, 'A no convierte cotizaciones de B');
select lives_ok($$select convert_quote_to_order((select quote_ok_a from ctx))$$, 'el despachador convierte una cotización aprobada');
select ok((select count(*) > 0 from work_order_items i join quotes q on q.work_order_id = i.work_order_id where q.id = (select quote_ok_a from ctx)), 'la orden nueva trae los ítems de la cotización');
select is(convert_quote_to_order((select quote_ok_a from ctx)), (select work_order_id from quotes where id = (select quote_ok_a from ctx)), 'convertir dos veces no duplica la orden');

select pg_temp.login((select tech_a from ctx));
select throws_ok($$select convert_quote_to_order((select quote_ok_a from ctx))$$, '42501', null, 'el técnico no convierte cotizaciones');

-- ---------------------------------------------------------------------------
-- Anónimo (cliente final con el enlace)
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok('select * from work_orders', '42501', null, 'anon no lee tablas');
select is(pg_temp.readable_tables(), '{}'::text[], 'anon no puede leer ninguna tabla');
select throws_ok($$select create_company('X', 'Y')$$, '42501', null, 'anon no crea empresas');
select ok(public_report((select token_done from ctx)) is not null, 'el reporte abre con el token');
select ok(not (public_report((select token_done from ctx)) ? 'signer_id_number'), 'el reporte no expone la cédula');
select is(public_report(repeat('0', 32)), null, 'token falso: nada');
select throws_ok('select * from absences', '42501', null, 'anon no lee ausencias');
select ok(public_quote((select quote_token_a from ctx)) ->> 'total' is not null, 'la cotización enviada abre con su enlace');
select ok(not (public_quote((select quote_token_a from ctx)) ? 'customer_id'), 'la cotización pública no expone ids internos');
select is(public_quote((select quote_draft_token from ctx)), null, 'un borrador no se ve por enlace');
select throws_ok($$select convert_quote_to_order((select quote_ok_a from ctx))$$, '42501', null, 'anon no convierte cotizaciones');
select throws_ok('select * from work_order_ratings', '42501', null, 'anon no lee calificaciones');
select is(rate_report((select token_unrated from ctx), 4), 4, 'el cliente califica con el enlace');
select is(rate_report((select token_unrated from ctx), 1), 4, 'la calificación se guarda una sola vez');
select ok(comment_report((select token_unrated from ctx), '  Excelente servicio  '), 'el cliente deja un comentario');
select ok(not comment_report((select token_unrated from ctx), 'Otro'), 'el comentario no se reescribe');
select throws_ok($$select rate_report(repeat('0', 32), 5)$$, 'P0002', null, 'token falso no califica');
select throws_ok($$select rate_report((select token_unrated from ctx), 6)$$, '22023', null, 'solo de 1 a 5 estrellas');
select is(public_report((select token_unrated from ctx)) -> 'rating' ->> 'stars', '4', 'el reporte muestra la calificación');
select ok(public_report((select token_unrated from ctx)) -> 'company' -> 'payment' ->> 'nequi' is not null, 'el reporte trae los datos de pago');

-- ---------------------------------------------------------------------------
-- Inventario: el stock solo cambia con movimientos registrados
-- ---------------------------------------------------------------------------
reset role;
create temp table ctx_inv as select
  (select id from materials where company_id = (select co_a from ctx) and track_stock order by name limit 1) as mat_a,
  (select id from materials where company_id = (select co_b from ctx) order by name limit 1) as mat_b;
grant select on ctx_inv to authenticated;
select pg_temp.login((select disp_a from ctx));
select throws_ok($$update materials set stock = 999 where id = (select mat_a from ctx_inv)$$, '42501', null, 'el stock no se edita directo');
select ok(adjust_stock((select mat_a from ctx_inv), 'entrada', 5, 'Compra') > 0, 'el despachador registra una entrada');
select is((select reason from stock_movements where material_id = (select mat_a from ctx_inv) order by created_at desc limit 1), 'Entrada · Compra', 'la entrada queda en los movimientos');
select throws_ok($$select adjust_stock((select mat_b from ctx_inv), 'entrada', 5)$$, '42501', null, 'no ajusta stock de otra empresa');
reset role;
select pg_temp.login((select tech_a from ctx));
select throws_ok($$select adjust_stock((select mat_a from ctx_inv), 'salida', 1)$$, '42501', null, 'el técnico no ajusta stock');
select is((select count(*)::int from stock_movements), 0, 'el técnico no ve los movimientos');

-- ---------------------------------------------------------------------------
-- Instalaciones: aislamiento, accesos técnicos y registro de vistas
-- ---------------------------------------------------------------------------
reset role;
create temp table ctx_ins as select
  'e1000000-0000-0000-0000-000000000001'::uuid as inst_a,
  'e2000000-0000-0000-0000-000000000001'::uuid as inst_b,
  (select id from installation_credentials where installation_id = 'e1000000-0000-0000-0000-000000000001') as cred_a,
  'e2100000-0000-0000-0000-000000000001'::uuid as cred_b,
  'a0000000-0000-0000-0000-000000000004'::uuid as tech2_a, -- Diana: solo una orden cerrada en la instalación
  (select id from work_orders where installation_id = 'e1000000-0000-0000-0000-000000000001' and status = 'asignada') as wo_open_ins,
  (select id from customers where company_id = 'c0000000-0000-0000-0000-00000000000a' and name <> 'Clínica Dental Sonrisas' limit 1) as other_cust_a;
grant select on ctx_ins to authenticated;

select is((select number from installations where id = (select inst_a from ctx_ins)), 1001, 'seed: la instalación de A es INS-1001');
select is((select count(*)::int from assets where installation_id = (select inst_a from ctx_ins)), 8, 'seed: 8 equipos en la instalación');
select is((select count(*)::int from work_orders where installation_id = (select inst_a from ctx_ins)), 4, 'seed: 4 órdenes en el historial');
select is((select last_maintenance from installations where id = (select inst_a from ctx_ins)),
          (now() at time zone 'America/Bogota')::date - 165, 'completar un mantenimiento actualiza el último mantenimiento');
select is((select next_maintenance from installations where id = (select inst_a from ctx_ins)),
          ((now() at time zone 'America/Bogota')::date - 165 + interval '6 months')::date, 'el próximo mantenimiento sale de la frecuencia');

-- Dueño de A: ve la suya y su contraseña (con registro); nada de B.
select pg_temp.login((select owner_a from ctx));
select is((select count(*)::int from installations), 1, 'dueño A: solo ve las instalaciones de A');
select is((select count(*)::int from installation_credentials), 1, 'dueño A: ve los accesos de A');
select is(reveal_installation_password((select cred_a from ctx_ins)), 'Sonrisas#2025', 'dueño A: descifra la contraseña');
select is((select count(*)::int from installation_credential_views where user_id = (select owner_a from ctx)), 1, 'ver la contraseña deja registro');
select throws_ok($$select reveal_installation_password((select cred_b from ctx_ins))$$, '42501', null, 'dueño A: no descifra contraseñas de B');
select is((select count(*)::int from installation_credential_views where company_id = (select co_b from ctx)), 0, 'dueño A: no ve el registro de B');
select throws_ok($$select secret_id from installation_credentials$$, '42501', null, 'el id del secreto no se puede leer');
select throws_ok($$insert into installation_credential_views (company_id, installation_id, credential_id, user_id)
                   select company_id, installation_id, id, auth.uid() from installation_credentials$$, '42501', null,
                 'el registro de vistas no se escribe directo');
select throws_ok($$insert into work_orders (company_id, customer_id, installation_id, title)
                   values ((select co_a from ctx), (select other_cust_a from ctx_ins), (select inst_a from ctx_ins), 'X')$$,
                 '23514', null, 'una orden no se liga a la instalación de otro cliente');
select throws_ok($$update installations set number = 1 where id = (select inst_a from ctx_ins)$$, '42501', null, 'el número de la instalación no cambia');
select ok(save_installation_credential((select inst_a from ctx_ins), 'Router', '192.168.1.1', 'admin', 'Nueva#1') is not null,
          'dueño A: guarda un acceso nuevo');

-- Despachador: ve la instalación, pero no los accesos.
reset role;
select pg_temp.login((select disp_a from ctx));
select is((select count(*)::int from installations), 1, 'despachador A: ve la instalación');
select is((select count(*)::int from installation_credentials), 0, 'despachador A: no ve los accesos');
select throws_ok($$select reveal_installation_password((select cred_a from ctx_ins))$$, '42501', null, 'despachador A: no descifra la contraseña');
select throws_ok($$select save_installation_credential((select inst_a from ctx_ins), 'X', null, null, 'x')$$, '42501', null, 'despachador A: no guarda accesos');

-- Técnico con orden abierta en la instalación: ve los accesos; no ve el registro ni cambia la instalación de su orden.
reset role;
select pg_temp.login((select tech_a from ctx));
select is((select count(*)::int from installation_credentials where installation_id = (select inst_a from ctx_ins)), 2, 'técnico con orden abierta: ve los accesos');
select is(reveal_installation_password((select cred_a from ctx_ins)), 'Sonrisas#2025', 'técnico con orden abierta: descifra la contraseña');
select is((select count(*)::int from installation_credential_views), 0, 'el técnico no ve el registro de vistas');
select throws_ok($$update work_orders set installation_id = null where id = (select wo_open_ins from ctx_ins)$$, '42501', null,
                 'el técnico no cambia la instalación de su orden');
select is((select count(*)::int from installations where company_id = (select co_b from ctx)), 0, 'técnico A: no ve instalaciones de B');

-- Técnico que solo tiene órdenes cerradas en la instalación: no ve los accesos.
reset role;
select pg_temp.login((select tech2_a from ctx_ins));
select is((select count(*)::int from installation_credentials), 0, 'técnico sin orden abierta: no ve los accesos');
select throws_ok($$select reveal_installation_password((select cred_a from ctx_ins))$$, '42501', null, 'técnico sin orden abierta: no descifra la contraseña');

reset role;
select is((select count(*)::int from installation_credential_views where installation_id = (select inst_a from ctx_ins)), 2,
          'quedaron registradas las dos vistas (dueño y técnico)');

-- ---------------------------------------------------------------------------
-- Verificaciones finales como postgres
-- ---------------------------------------------------------------------------
reset role;
select is((select count(*)::int from customers where name = 'hackeado'), 0, 'nadie renombró clientes de B');
select is((select count(*)::int from work_orders where company_id = (select co_b from ctx)), (select n_b from ctx), 'las órdenes de B siguen ahí');
select is((select count(*)::int from work_orders where company_id = (select co_b from ctx) and status = 'cancelada'), 1, 'nadie canceló órdenes de B');
select is((select count(*)::int from materials where company_id = (select co_b from ctx)), 10, 'los materiales de B siguen ahí');
select is((select count(*)::int from companies where name = 'hackeado'), 0, 'nadie renombró empresas (ni B, ni A por el despachador)');
select is((select count(*)::int from storage.objects where name like (select co_b::text from ctx) || '/%'), 1, 'el archivo de B sigue ahí');
select isnt((select status from work_orders where id = (select wo_other_tech from ctx)), 'en_proceso'::work_order_status, 'el técnico no movió órdenes ajenas');
select ok((select count(*) from work_order_events where work_order_id = (select wo_tech_open from ctx)) > 0, 'el técnico no borró el historial');
select is((select comment from work_order_ratings r join work_orders w on w.id = r.work_order_id where w.public_token = (select token_unrated from ctx)), 'Excelente servicio', 'el comentario quedó guardado (sin espacios)');

select * from finish();
rollback;
