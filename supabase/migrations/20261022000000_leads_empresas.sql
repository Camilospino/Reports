-- La página pública pasa de dueños de propiedades a empresas de servicio técnico de varios sectores:
-- se pregunta el tipo de empresa y cuántos técnicos tiene, y se guarda desde qué página llegó.

alter table public.leads drop constraint leads_property_type_check;
alter table public.leads drop constraint leads_properties_check;

alter table public.leads rename column property_type to company_type;
alter table public.leads rename column properties to technicians;

-- Las filas que existan de la versión anterior pasan a "otra" / "1-3" para cumplir las nuevas reglas.
update public.leads set company_type = 'otra'
  where company_type not in ('aire', 'seguridad', 'internet', 'electricidad', 'mantenimiento', 'otra');
update public.leads set technicians = '1-3' where technicians not in ('1-3', '4-10', '11-30', '30+');

alter table public.leads
  add constraint leads_company_type_check
    check (company_type in ('aire', 'seguridad', 'internet', 'electricidad', 'mantenimiento', 'otra')),
  add constraint leads_technicians_check check (technicians in ('1-3', '4-10', '11-30', '30+')),
  add column source text check (source ~ '^/[a-z0-9/-]{0,60}$'); -- "/" o "/para/<sector>"
