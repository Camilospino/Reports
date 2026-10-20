-- Datos de prueba: dos empresas con equipo, clientes, materiales y 15 órdenes para hoy.
-- Se carga con `npx supabase db reset`. Contraseña de todos los usuarios: Tecnio2026!
--
-- Seguridad Total S.A.S. (empresa A)          Frío Express (empresa B)
--   dueno@seguridadtotal.test                   dueno@frioexpress.test
--   despacho@seguridadtotal.test                despacho@frioexpress.test
--   tecnico1..3@seguridadtotal.test             tecnico1..3@frioexpress.test

-- ---------------------------------------------------------------------------
-- Usuarios (auth). Los UUID son fijos para que las pruebas los usen.
-- ---------------------------------------------------------------------------
create function pg_temp.seed_user(p_id uuid, p_email text, p_name text) returns void
language sql as $$
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt('Tecnio2026!', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
$$;

select pg_temp.seed_user('a0000000-0000-0000-0000-000000000001', 'dueno@seguridadtotal.test', 'Carolina Restrepo');
select pg_temp.seed_user('a0000000-0000-0000-0000-000000000002', 'despacho@seguridadtotal.test', 'Julián Pardo');
select pg_temp.seed_user('a0000000-0000-0000-0000-000000000003', 'tecnico1@seguridadtotal.test', 'Mateo Vargas');
select pg_temp.seed_user('a0000000-0000-0000-0000-000000000004', 'tecnico2@seguridadtotal.test', 'Diana Gómez');
select pg_temp.seed_user('a0000000-0000-0000-0000-000000000005', 'tecnico3@seguridadtotal.test', 'Andrés Rojas');
select pg_temp.seed_user('b0000000-0000-0000-0000-000000000001', 'dueno@frioexpress.test', 'Luis Fernando Ortiz');
select pg_temp.seed_user('b0000000-0000-0000-0000-000000000002', 'despacho@frioexpress.test', 'Paola Herrera');
select pg_temp.seed_user('b0000000-0000-0000-0000-000000000003', 'tecnico1@frioexpress.test', 'Camilo Suárez');
select pg_temp.seed_user('b0000000-0000-0000-0000-000000000004', 'tecnico2@frioexpress.test', 'Sebastián Mejía');
select pg_temp.seed_user('b0000000-0000-0000-0000-000000000005', 'tecnico3@frioexpress.test', 'Laura Castaño');

-- ---------------------------------------------------------------------------
-- Empresas y equipo
-- ---------------------------------------------------------------------------
insert into public.companies (id, name, nit, phone, plan) values
  ('c0000000-0000-0000-0000-00000000000a', 'Seguridad Total S.A.S.', '901.234.567-1', '573101234567', 'equipo'),
  ('c0000000-0000-0000-0000-00000000000b', 'Frío Express', '900.765.432-8', '573207654321', 'arranque');

insert into public.memberships (id, user_id, company_id, role, full_name, phone, skills) values
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000a', 'owner',      'Carolina Restrepo', '573101112233', '{}'),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000a', 'dispatcher', 'Julián Pardo',      '573102223344', '{}'),
  ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-00000000000a', 'technician', 'Mateo Vargas',      '573103334455', '{CCTV,Redes}'),
  ('a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-00000000000a', 'technician', 'Diana Gómez',       '573104445566', '{CCTV,Alarmas}'),
  ('a1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-00000000000a', 'technician', 'Andrés Rojas',      '573105556677', '{Redes,Eléctrico}'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000b', 'owner',      'Luis Fernando Ortiz','573201112233', '{}'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000b', 'dispatcher', 'Paola Herrera',     '573202223344', '{}'),
  ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-00000000000b', 'technician', 'Camilo Suárez',     '573203334455', '{Aires,Refrigeración}'),
  ('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-00000000000b', 'technician', 'Sebastián Mejía',   '573204445566', '{Aires}'),
  ('b1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-00000000000b', 'technician', 'Laura Castaño',     '573205556677', '{Refrigeración,Eléctrico}');

-- ---------------------------------------------------------------------------
-- Clientes (8 por empresa), una sede por cliente
-- ---------------------------------------------------------------------------
insert into public.customers (company_id, name, contact_name, phone_whatsapp, email, tax_id)
select 'c0000000-0000-0000-0000-00000000000a', c.name, c.contact, c.phone, c.email, c.tax
from (values
  ('Clínica Dental Sonrisas',   'Marcela Ruiz',    '573001110001', 'admin@sonrisas.test',   '900111001-1'),
  ('Edificio Torres del Parque','Hernán Molina',   '573001110002', 'admon@torres.test',     '900111002-2'),
  ('Supermercado La Economía',  'Gloria Peña',     '573001110003', null,                    '900111003-3'),
  ('Colegio San Bartolomé Norte','Rector Álvarez', '573001110004', 'rectoria@sbn.test',     '900111004-4'),
  ('Ferretería El Tornillo',    'Jairo Cárdenas',  '573001110005', null,                    '79111005'),
  ('Restaurante Mar y Tierra',  'Natalia Silva',   '573001110006', 'natalia@marytierra.test','900111006-6'),
  ('Conjunto Reservas de Cedritos','Óscar Lemus',  '573001110007', null,                    '900111007-7'),
  ('Droguería Salud Total',     'Patricia Mora',   '573001110008', null,                    '52111008')
) as c(name, contact, phone, email, tax);

insert into public.customers (company_id, name, contact_name, phone_whatsapp, email, tax_id)
select 'c0000000-0000-0000-0000-00000000000b', c.name, c.contact, c.phone, c.email, c.tax
from (values
  ('Hotel Casa Blanca',          'Ricardo Gil',      '573002220001', 'mantenimiento@casablanca.test', '900222001-1'),
  ('Oficinas Grupo Andino',      'Sandra Pinzón',    '573002220002', 'sandra@andino.test',  '900222002-2'),
  ('Panadería La Espiga',        'Fabio Ramírez',    '573002220003', null,                  '80222003'),
  ('Centro Médico El Poblado',   'Dra. Valencia',    '573002220004', 'admin@cmpoblado.test','900222004-4'),
  ('Gimnasio Fit Zone',          'Kevin Arango',     '573002220005', null,                  '900222005-5'),
  ('Carnes Don Pedro',           'Pedro Zuluaga',    '573002220006', null,                  '71222006'),
  ('Apartamento 502 Laureles',   'Mónica Toro',      '573002220007', 'monica.toro@mail.test','43222007'),
  ('Tienda Naturista Vida',      'Esteban Quintero', '573002220008', null,                  '900222008-8')
) as c(name, contact, phone, email, tax);

insert into public.sites (company_id, customer_id, address, neighborhood, city, lat, lng, access_notes)
select cu.company_id, cu.id,
       'Calle ' || (40 + row_number() over w) || ' # ' || (10 + row_number() over w) || '-' || (20 + row_number() over w),
       (case when cu.company_id = 'c0000000-0000-0000-0000-00000000000a'
             then array['Chapinero','Rosales','Kennedy','Usaquén','Teusaquillo','Chicó','Cedritos','Suba']
             else array['El Poblado','Laureles','Belén','El Poblado','Envigado','Itagüí','Laureles','Sabaneta'] end)[row_number() over w],
       case when cu.company_id = 'c0000000-0000-0000-0000-00000000000a' then 'Bogotá' else 'Medellín' end,
       case when cu.company_id = 'c0000000-0000-0000-0000-00000000000a' then 4.65 else 6.21 end + (row_number() over w) * 0.004,
       case when cu.company_id = 'c0000000-0000-0000-0000-00000000000a' then -74.06 else -75.57 end - (row_number() over w) * 0.003,
       case when row_number() over w % 3 = 0 then 'Anunciarse en portería' end
from public.customers cu
window w as (partition by cu.company_id order by cu.created_at, cu.name);

-- ---------------------------------------------------------------------------
-- Tipos de servicio y materiales
-- ---------------------------------------------------------------------------
insert into public.service_types (company_id, name, estimated_minutes, checklist) values
  ('c0000000-0000-0000-0000-00000000000a', 'Instalación de cámaras', 210,
   '["Revisar puntos de instalación con el cliente","Tender cableado","Instalar y fijar cámaras","Configurar DVR/NVR","Configurar acceso desde el celular","Explicar el uso al cliente"]'),
  ('c0000000-0000-0000-0000-00000000000a', 'Mantenimiento CCTV', 90,
   '["Limpiar lentes","Revisar conectores","Verificar grabación","Revisar disco duro"]'),
  ('c0000000-0000-0000-0000-00000000000a', 'Instalación de alarma', 180,
   '["Instalar panel","Instalar sensores","Configurar zonas","Prueba con central de monitoreo"]'),
  ('c0000000-0000-0000-0000-00000000000a', 'Cableado de red', 150,
   '["Tender cable UTP","Ponchar conectores","Certificar puntos","Organizar rack"]'),
  ('c0000000-0000-0000-0000-00000000000b', 'Mantenimiento aire acondicionado', 90,
   '["Limpiar filtros","Lavar serpentín","Revisar drenaje","Medir presión de gas","Medir temperatura de salida"]'),
  ('c0000000-0000-0000-0000-00000000000b', 'Instalación minisplit', 240,
   '["Ubicar unidades","Perforar muro","Instalar tubería","Hacer vacío","Cargar gas","Prueba de funcionamiento"]'),
  ('c0000000-0000-0000-0000-00000000000b', 'Reparación de nevera', 120,
   '["Diagnóstico","Revisar compresor","Revisar termostato","Prueba de enfriamiento"]'),
  ('c0000000-0000-0000-0000-00000000000b', 'Carga de gas', 60,
   '["Buscar fugas","Hacer vacío","Cargar gas","Medir presión"]');

insert into public.materials (company_id, name, unit, unit_price)
select 'c0000000-0000-0000-0000-00000000000a', m.name, m.unit, m.price
from (values
  ('Cámara domo 2 MP', 'und', 185000), ('Cámara bala 4 MP', 'und', 245000), ('DVR 8 canales', 'und', 520000),
  ('Disco duro 1 TB', 'und', 280000), ('Cable UTP Cat 6', 'm', 2800), ('Conector RJ45', 'und', 1200),
  ('Fuente 12 V 10 A', 'und', 95000), ('Balun pasivo (par)', 'par', 18000), ('Canaleta 20x12', 'm', 4500),
  ('Mano de obra técnica', 'h', 60000)
) as m(name, unit, price);

insert into public.materials (company_id, name, unit, unit_price)
select 'c0000000-0000-0000-0000-00000000000b', m.name, m.unit, m.price
from (values
  ('Gas R410A', 'lb', 42000), ('Gas R22', 'lb', 48000), ('Tubería de cobre 1/4"', 'm', 22000),
  ('Tubería de cobre 3/8"', 'm', 28000), ('Aislante térmico', 'm', 6500), ('Soporte para condensadora', 'und', 85000),
  ('Capacitor 35 µF', 'und', 38000), ('Termostato universal', 'und', 65000), ('Cinta de aislar', 'und', 6000),
  ('Mano de obra técnica', 'h', 55000)
) as m(name, unit, price);

-- Especialidad de cada tipo de servicio (para sugerir técnico).
update public.service_types set skill = case name
  when 'Instalación de cámaras' then 'CCTV' when 'Mantenimiento CCTV' then 'CCTV'
  when 'Instalación de alarma' then 'Alarmas' when 'Cableado de red' then 'Redes'
  when 'Mantenimiento aire acondicionado' then 'Aires' when 'Instalación minisplit' then 'Aires'
  when 'Reparación de nevera' then 'Refrigeración' when 'Carga de gas' then 'Aires' end;
-- Garantía: instalaciones 6 meses, mantenimientos y reparaciones 3.
update public.service_types set warranty_months = case when name like 'Instalación%' then 6 else 3 end;

-- Inventario: dos materiales por empresa quedan bajos de stock.
update public.materials set stock = case when unit in ('m', 'lb') then 120 else 15 end,
                            min_stock = case when unit in ('m', 'lb') then 30 else 4 end
where name <> 'Mano de obra técnica';
update public.materials set stock = 2 where name in ('Disco duro 1 TB', 'Gas R410A');
update public.materials set stock = 8 where name = 'Gas R410A';
update public.materials set stock = 1 where name in ('DVR 8 canales', 'Capacitor 35 µF');

-- ---------------------------------------------------------------------------
-- Historial: órdenes completadas en los últimos ~45 días (para la facturación del mes).
-- ---------------------------------------------------------------------------
do $$
declare
  co uuid;
  techs uuid[];
  custs uuid[];
  stypes uuid[];
  today date := (now() at time zone 'America/Bogota')::date;
  d int;
  i int := 0;
  wo uuid;
  ts timestamptz;
begin
  foreach co in array array['c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b']::uuid[] loop
    select array_agg(id order by full_name) into techs from public.memberships where company_id = co and role = 'technician';
    select array_agg(id order by name) into custs from public.customers where company_id = co;
    select array_agg(id order by name) into stypes from public.service_types where company_id = co;
    for d in reverse 45 .. 1 by 2 loop
      i := i + 1;
      ts := (today - d + time '08:00' + make_interval(hours => i % 7)) at time zone 'America/Bogota';
      insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, technician_id,
                                      scheduled_start, status, completed_at, signer_name)
      select co, custs[1 + (i % 8)], s.id, stypes[1 + (i % 4)],
             (select name from public.service_types where id = stypes[1 + (i % 4)]),
             techs[1 + (i % 3)], ts, 'completada', ts + interval '2 hours', 'Encargado del sitio'
      from public.sites s where s.customer_id = custs[1 + (i % 8)]
      returning id into wo;
      insert into public.work_order_items (work_order_id, material_id, description, quantity, unit_price)
      select wo, m.id, m.name, 1 + (i % 3), m.unit_price
      from public.materials m where m.company_id = co
      order by m.unit_price desc offset (i % 5) limit 2;
      insert into public.work_order_items (work_order_id, description, quantity, unit_price)
      values (wo, 'Mano de obra', 1, 120000 + (i % 4) * 30000);
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 15 órdenes para hoy por empresa, en distintos estados
-- ---------------------------------------------------------------------------
do $$
declare
  co uuid;
  techs uuid[];
  custs uuid[];
  stypes uuid[];
  today date := (now() at time zone 'America/Bogota')::date;
  -- hora de inicio, estado, índice de técnico (0 = sin asignar), prioridad
  plan text[] := array[
    '07:00|completada|1|normal', '07:30|completada|2|normal', '08:00|completada|3|alta',
    '08:30|completada|1|normal', '09:30|en_proceso|2|normal', '10:00|en_proceso|3|alta',
    '10:30|en_camino|1|normal',  '11:00|en_camino|3|baja',    '11:30|asignada|2|normal',
    '13:00|asignada|1|normal',   '14:00|asignada|3|normal',   '15:00|asignada|2|baja',
    '13:30|pendiente|0|alta',    '15:30|pendiente|0|normal',  '16:00|cancelada|1|normal'];
  p text[];
  i int;
  wo uuid;
  st_name text;
begin
  foreach co in array array['c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b']::uuid[] loop
    select array_agg(id order by full_name) into techs from public.memberships where company_id = co and role = 'technician';
    select array_agg(id order by name) into custs from public.customers where company_id = co;
    select array_agg(id order by name) into stypes from public.service_types where company_id = co;

    for i in 1 .. array_length(plan, 1) loop
      p := string_to_array(plan[i], '|');
      select name into st_name from public.service_types where id = stypes[1 + (i % 4)];
      insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, technician_id,
                                      scheduled_start, scheduled_end, status, priority, observations, signer_name, signer_id_number,
                                      completed_at)
      select co, custs[1 + (i % 8)], s.id, stypes[1 + (i % 4)], st_name,
             case when p[3]::int > 0 then techs[p[3]::int] end,
             (today + p[1]::time) at time zone 'America/Bogota',
             (today + p[1]::time + interval '1 hour') at time zone 'America/Bogota',
             p[2]::public.work_order_status, p[4]::public.work_order_priority,
             case when p[2] = 'completada' then 'Trabajo realizado sin novedad.' end,
             case when p[2] = 'completada' then (array['Marta Lucía Gil', 'Jorge Iván Peña', 'Sandra Milena Ruiz', 'Óscar Duarte'])[1 + (i % 4)] end,
             case when p[2] = 'completada' then '10' || (20000000 + i)::text end,
             -- Cierre a los 50 min, igual que el evento "completada" del historial.
             case when p[2] = 'completada' then (today + p[1]::time + interval '50 minutes') at time zone 'America/Bogota' end
      from public.sites s where s.customer_id = custs[1 + (i % 8)]
      returning id into wo;

      -- Materiales en las órdenes completadas y en proceso.
      if p[2] in ('completada', 'en_proceso') then
        insert into public.work_order_items (work_order_id, material_id, description, quantity, unit_price)
        select wo, m.id, m.name, case when m.unit in ('m', 'lb') then 6 else 1 end, m.unit_price
        from public.materials m where m.company_id = co
        order by m.name limit 3;
        insert into public.work_order_items (work_order_id, description, quantity, unit_price)
        values (wo, 'Mano de obra', 1, 180000);
      end if;
    end loop;
  end loop;
end $$;

-- Marca el checklist de las órdenes completadas como hecho.
update public.work_orders
set checklist_state = (select coalesce(jsonb_agg(item || '{"done": true}'), '[]') from jsonb_array_elements(checklist_state) item)
where status = 'completada';

-- Reportes de los técnicos en las órdenes activas (para "Técnicos ahora"), relativos a la
-- hora en que se carga el seed: uno lleva 1 h 10 min, otro sin reportar hace 2 h (sin conexión).
insert into public.work_order_events (company_id, work_order_id, type, user_id, payload, lat, lng, created_at)
select w.company_id, w.id, 'estado', m.user_id, jsonb_build_object('de', 'en_camino', 'a', 'en_proceso'), s.lat, s.lng,
       now() - case when row_number() over (partition by w.company_id order by w.scheduled_start) = 1
                    then interval '70 minutes' else interval '2 hours' end
from public.work_orders w join public.memberships m on m.id = w.technician_id join public.sites s on s.id = w.site_id
where w.status = 'en_proceso';
-- El que lleva 1 h 10 min sigue reportando: marcó un ítem del checklist hace 8 minutos.
insert into public.work_order_events (company_id, work_order_id, type, user_id, payload, created_at)
select company_id, id, 'checklist', user_id, '{"item": 1, "hecho": true}', now() - interval '8 minutes'
from (select w.company_id, w.id, m.user_id,
             row_number() over (partition by w.company_id order by w.scheduled_start) as n
      from public.work_orders w join public.memberships m on m.id = w.technician_id
      where w.status = 'en_proceso') x
where n = 1;
insert into public.work_order_events (company_id, work_order_id, type, user_id, payload, created_at)
select w.company_id, w.id, 'estado', m.user_id, jsonb_build_object('de', 'asignada', 'a', 'en_camino'), now() - interval '12 minutes'
from public.work_orders w join public.memberships m on m.id = w.technician_id
where w.status = 'en_camino';

-- Cotizaciones: una reciente y una sin respuesta hace 5 días por empresa, más una aprobada.
insert into public.quotes (company_id, customer_id, items, status, valid_until, sent_at)
select c.company_id, c.id, q.items::jsonb, q.status::public.quote_status,
       (now() at time zone 'America/Bogota')::date + 15, now() - q.age
from (select company_id, id, row_number() over (partition by company_id order by name) as n from public.customers) c
join (values
  (1, '[{"description":"Equipos y materiales","quantity":1,"unit_price":2450000},{"description":"Mano de obra","quantity":1,"unit_price":380000}]', 'enviada', interval '1 day'),
  (2, '[{"description":"Equipos y materiales","quantity":1,"unit_price":1600000},{"description":"Mano de obra","quantity":1,"unit_price":390000}]', 'enviada', interval '5 days'),
  (3, '[{"description":"Mantenimiento preventivo","quantity":4,"unit_price":180000}]', 'aprobada', interval '8 days')
) as q(n, items, status, age) on q.n = c.n;

-- ---------------------------------------------------------------------------
-- Agenda: órdenes de los próximos días, pendientes sin fecha y ausencias.
-- ---------------------------------------------------------------------------
do $$
declare
  co uuid;
  techs uuid[];
  custs uuid[];
  stypes uuid[];
  today date := (now() at time zone 'America/Bogota')::date;
  d int;
  k int;
  n int := 0;
begin
  foreach co in array array['c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b']::uuid[] loop
    select array_agg(id order by full_name) into techs from public.memberships where company_id = co and role = 'technician';
    select array_agg(id order by name) into custs from public.customers where company_id = co;
    select array_agg(id order by name) into stypes from public.service_types where company_id = co;

    -- Andrés / Camilo tiene cita médica hoy en la tarde; Diana / Sebastián sale a vacaciones en 2 días.
    insert into public.absences (company_id, technician_id, starts_at, ends_at, reason) values
      (co, techs[1], (today + time '15:00') at time zone 'America/Bogota', (today + time '17:00') at time zone 'America/Bogota', 'Cita médica'),
      (co, techs[2], (today + 2) at time zone 'America/Bogota', (today + 5) at time zone 'America/Bogota', 'Vacaciones');

    -- Dos órdenes por técnico y día durante los próximos 6 días (sin pisar las vacaciones).
    for d in 1 .. 6 loop
      for k in 1 .. 3 loop
        continue when k = 2 and d between 2 and 4;
        n := n + 1;
        insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, technician_id, scheduled_start, scheduled_end)
        select co, custs[1 + (n % 8)], s.id, stypes[1 + (n % 4)],
               (select name from public.service_types where id = stypes[1 + (n % 4)]), techs[k],
               (today + d + time '08:00' + make_interval(mins => 30 * ((n * 7) % 5))) at time zone 'America/Bogota',
               (today + d + time '10:00' + make_interval(mins => 30 * ((n * 7) % 5))) at time zone 'America/Bogota'
        from public.sites s where s.customer_id = custs[1 + (n % 8)];
        insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, technician_id, scheduled_start, scheduled_end)
        select co, custs[1 + ((n + 3) % 8)], s.id, stypes[1 + ((n + 1) % 4)],
               (select name from public.service_types where id = stypes[1 + ((n + 1) % 4)]), techs[k],
               (today + d + time '13:00' + make_interval(mins => 30 * (n % 4))) at time zone 'America/Bogota',
               (today + d + time '15:00' + make_interval(mins => 30 * (n % 4))) at time zone 'America/Bogota'
        from public.sites s where s.customer_id = custs[1 + ((n + 3) % 8)];
      end loop;
    end loop;

    -- Pendientes sin técnico: una para mañana y una sin fecha.
    insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, scheduled_start, priority)
    select co, custs[3], s.id, stypes[2], (select name from public.service_types where id = stypes[2]),
           (today + 1 + time '10:00') at time zone 'America/Bogota', 'normal'
    from public.sites s where s.customer_id = custs[3];
    insert into public.work_orders (company_id, customer_id, site_id, service_type_id, title, priority)
    select co, custs[6], s.id, stypes[3], (select name from public.service_types where id = stypes[3]), 'baja'
    from public.sites s where s.customer_id = custs[6];
  end loop;
end $$;

-- Lo completado en días anteriores ya está facturado; lo de hoy queda por facturar.
update public.work_orders set invoiced_at = completed_at
where status = 'completada' and completed_at < (now() at time zone 'America/Bogota')::date at time zone 'America/Bogota';

-- Llegada (con GPS en la dirección) y cierre de las órdenes completadas hoy, para el historial.
insert into public.work_order_events (company_id, work_order_id, type, user_id, payload, lat, lng, created_at)
select w.company_id, w.id, 'estado', m.user_id, jsonb_build_object('de', 'en_camino', 'a', 'en_proceso'),
       s.lat + 0.0003, s.lng - 0.0002, w.scheduled_start - interval '6 minutes'
from public.work_orders w join public.memberships m on m.id = w.technician_id join public.sites s on s.id = w.site_id
where w.status = 'completada' and w.invoiced_at is null;
insert into public.work_order_events (company_id, work_order_id, type, user_id, payload, created_at)
select w.company_id, w.id, 'estado', m.user_id, jsonb_build_object('de', 'en_proceso', 'a', 'completada'),
       w.scheduled_start + interval '50 minutes'
from public.work_orders w join public.memberships m on m.id = w.technician_id
where w.status = 'completada' and w.invoiced_at is null;

-- Las órdenes del seed se "crearon" antes de su servicio (no a la hora en que se carga el seed).
update public.work_orders set created_at = least(created_at, scheduled_start - interval '2 days')
where scheduled_start is not null;
update public.work_order_events e set created_at = w.created_at
from public.work_orders w where w.id = e.work_order_id and e.type = 'creada';
update public.quotes set created_at = sent_at - interval '2 hours' where sent_at is not null;

-- Datos de pago que ve el cliente en el reporte.
update public.companies set payment_nequi = '3101234567', payment_bank = 'Bancolombia', payment_account_type = 'ahorros',
  payment_account_number = '123-456789-01', payment_account_holder = 'Seguridad Total S.A.S.', payment_holder_id = 'NIT 901.234.567-1',
  payment_notes = 'Envía el comprobante por WhatsApp con el número de la orden.'
where id = 'c0000000-0000-0000-0000-00000000000a';
update public.companies set payment_nequi = '3207654321'
where id = 'c0000000-0000-0000-0000-00000000000b';

-- Calificaciones de clientes en parte del historial (las de hoy quedan sin calificar).
insert into public.work_order_ratings (work_order_id, company_id, stars, comment, created_at, commented_at)
select w.id, w.company_id, (array[5, 5, 4, 5, 3])[1 + (w.number % 5)],
       case w.number % 4 when 0 then 'Muy puntual y dejó todo limpio.' when 1 then 'Buen trabajo, explicó todo.' end,
       w.completed_at + interval '3 hours', case when w.number % 4 in (0, 1) then w.completed_at + interval '3 hours' end
from public.work_orders w
where w.status = 'completada' and w.invoiced_at is not null and w.number % 3 <> 0;

-- La mano de obra no lleva stock. El resto arranca con un movimiento de inventario inicial.
update public.materials set track_stock = false where name = 'Mano de obra técnica';
insert into public.stock_movements (company_id, material_id, delta, stock_after, reason, created_at)
select company_id, id, stock, stock, 'Inventario inicial', now() - interval '30 days'
from public.materials where track_stock and stock <> 0;
