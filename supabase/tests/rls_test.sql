-- Prueba de aislamiento entre empresas y del rol técnico.
-- Ejecutar: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/rls_test.sql
begin;
insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-00000000000a', '573000000001'),
  ('00000000-0000-0000-0000-00000000000b', '573000000002'),
  ('00000000-0000-0000-0000-00000000000c', '573000000003'),
  ('00000000-0000-0000-0000-00000000000d', '573000000004');

create function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Empresa A: dueño crea empresa, cliente, tipo de servicio y dos órdenes.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select create_company('Frío Express', 'Ana Dueña') is not null as company_a;
reset role;
insert into profiles (id, company_id, full_name, role)
select '00000000-0000-0000-0000-00000000000c', company_id, 'Tito Técnico', 'technician'
from profiles where id = '00000000-0000-0000-0000-00000000000a';
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into customers (name) values ('Edificio Central');
insert into service_types (name, checklist) values ('Mantenimiento aire', '[{"label":"Limpiar filtros"},{"label":"Medir presión"}]');
insert into work_orders (customer_id, service_type_id, technician_id)
  select c.id, s.id, '00000000-0000-0000-0000-00000000000c' from customers c, service_types s;
insert into work_orders (customer_id) select id from customers;
select number, status, jsonb_array_length(checklist) as checklist_items from work_orders order by number;

-- Ítems recalculan el total.
insert into work_order_items (work_order_id, kind, description, quantity, unit_price)
  select id, 'material', 'Gas R410', 2, 85000 from work_orders where number = 1001;
select number, total from work_orders where number = 1001;

-- Empresa B: no ve nada de A; su numeración arranca en 1001.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select create_company('Cámaras Seguras', 'Beto Dueño') is not null as company_b;
select count(*) as b_ve_clientes_de_a from customers;
select count(*) as b_ve_ordenes_de_a from work_orders;
insert into customers (name) values ('Tienda Norte');
insert into work_orders (customer_id) select id from customers;
select number as b_primera_orden from work_orders;

-- Técnico de A: ve solo su orden asignada.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select count(*) as tecnico_ve_ordenes from work_orders;
update work_orders set status = 'in_progress' where number = 1001;
select count(*) as tecnico_ve_eventos from work_order_events;

-- Usuario sin empresa no ve nada.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select count(*) as sin_empresa_ve from companies;

-- Reporte público con token, como anónimo.
reset role;
select report_token as tok from work_orders where number = 1001 and company_id =
  (select company_id from profiles where id = '00000000-0000-0000-0000-00000000000a') \gset
set local role anon;
select public_report(:'tok')->>'company' as reporte_empresa, public_report(:'tok')->>'total' as reporte_total;
rollback;
