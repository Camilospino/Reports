-- Agenda: ausencias de los técnicos (vacaciones, citas, incapacidades).
-- Se muestran en la línea de tiempo y no dejan asignar órdenes encima.

create table public.absences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  technician_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default 'Vacaciones' check (length(trim(reason)) > 0),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (company_id, technician_id) references public.memberships (company_id, id) on delete cascade
);
create index on public.absences (company_id, starts_at);
create index on public.absences (technician_id, starts_at);

-- Solo técnicos activos de la misma empresa.
create function public.absences_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.company_id <> old.company_id then
    raise exception using errcode = '42501', message = 'La empresa de la ausencia no se puede cambiar';
  end if;
  perform public.assert_technician(new.company_id, new.technician_id);
  return new;
end $$;
create trigger absences_before_write before insert or update on public.absences
  for each row execute function public.absences_before_write();

alter table public.absences enable row level security;
create policy "staff y el propio técnico leen" on public.absences for select
  using (public.is_staff(company_id) or public.is_my_membership(technician_id));
create policy "staff crea" on public.absences for insert with check (public.is_staff(company_id));
create policy "staff edita" on public.absences for update
  using (public.is_staff(company_id)) with check (public.is_staff(company_id));
create policy "staff borra" on public.absences for delete using (public.is_staff(company_id));

revoke all on public.absences from anon;
revoke truncate, references, trigger on public.absences from authenticated;
revoke execute on function public.absences_before_write() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.absences;
  end if;
end $$;
