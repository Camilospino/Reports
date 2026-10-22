-- Interesados que piden una demo desde la página pública (/api/lead).
-- No pertenecen a ninguna empresa: solo el servidor los escribe y los lee, con la llave secreta.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  contact text not null check (length(trim(contact)) between 3 and 160), -- correo o WhatsApp
  property_type text not null
    check (property_type in ('conjunto', 'oficinas', 'hotel', 'colegio', 'bodega', 'otra')),
  properties text not null check (properties in ('1', '2-5', '6+')),
  -- Autorización de tratamiento de datos (Ley 1581 de 2012): se guarda el texto exacto que aceptó.
  consent boolean not null check (consent),
  consent_text text not null,
  ip_hash text, -- huella de la IP (HMAC), solo para limitar envíos repetidos
  user_agent text check (length(user_agent) <= 400),
  created_at timestamptz not null default now()
);

create index leads_ip_hash_created_at_idx on public.leads (ip_hash, created_at desc);

-- RLS activa y sin políticas: el navegador (anon) y los usuarios del panel no pueden ni leer ni escribir.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
