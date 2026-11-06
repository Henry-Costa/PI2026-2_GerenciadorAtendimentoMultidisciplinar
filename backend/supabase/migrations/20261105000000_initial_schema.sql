-- Esquema inicial: cadastros, agenda, LGPD e RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'user');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled');
create type public.attendance_status as enum ('pending', 'present', 'absent', 'cancelled');
create type public.reminder_recipient as enum ('student', 'financial_responsible');
create type public.document_kind as enum ('medical_report', 'contract', 'identity_document', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 3),
  email text not null unique check (email = lower(email)), phone text not null,
  cpf text not null unique, specialty text not null,
  role public.app_role not null default 'user', is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.service_types (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  default_amount numeric(12,2) not null check (default_amount >= 0),
  default_duration_minutes integer not null default 60 check (default_duration_minutes between 15 and 480),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.professional_service_types (
  professional_id uuid not null references public.profiles(id) on delete cascade,
  service_type_id uuid not null references public.service_types(id) on delete restrict,
  created_at timestamptz not null default now(), primary key (professional_id, service_type_id)
);

-- Dados comuns do aluno para a agenda. Identificadores e contatos ficam isolados.
create table public.students (
  id uuid primary key default gen_random_uuid(), full_name text not null check (char_length(trim(full_name)) >= 3),
  birth_date date not null, care_started_at date not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.student_identifiers (
  student_id uuid primary key references public.students(id) on delete cascade,
  cpf text not null unique, rg text not null, cns text unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.student_contacts (
  student_id uuid primary key references public.students(id) on delete cascade,
  email text, phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.student_addresses (
  student_id uuid primary key references public.students(id) on delete cascade,
  postal_code text, street text not null, street_number text not null, complement text,
  neighborhood text not null, city text not null, state char(2) not null check (state ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Dados financeiros ficam em tabelas exclusivas para administradores.
create table public.financial_responsibles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete restrict,
  full_name text not null, cpf text not null unique, phone text not null,
  email text not null check (email = lower(email)), marital_status text not null,
  place_of_birth text not null, occupation text not null,
  income_amount numeric(12,2) not null check (income_amount >= 0),
  hourly_rate numeric(12,2) not null check (hourly_rate >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.financial_responsible_bank_accounts (
  financial_responsible_id uuid primary key references public.financial_responsibles(id) on delete cascade,
  bank_name text not null, branch text not null, checking_account text not null, pix_key text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.student_service_assignments (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete restrict,
  professional_id uuid not null, service_type_id uuid not null,
  starts_on date not null default current_date, ends_on date, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (professional_id, service_type_id) references public.professional_service_types(professional_id, service_type_id),
  check (ends_on is null or ends_on >= starts_on)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.student_service_assignments(id) on delete restrict,
  starts_at timestamptz not null, ends_at timestamptz not null,
  charged_amount numeric(12,2) not null check (charged_amount >= 0),
  status public.appointment_status not null default 'scheduled',
  reminder_recipient public.reminder_recipient not null, reminder_authorized_at timestamptz,
  cancellation_reason text, created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_at > starts_at)
);
create index appointments_assignment_starts_at_idx on public.appointments (assignment_id, starts_at);
create table public.attendance (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  status public.attendance_status not null default 'pending', recorded_by uuid references public.profiles(id) on delete restrict,
  recorded_at timestamptz, updated_at timestamptz not null default now()
);
create table public.session_records (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  content text not null, created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);
create table public.student_documents (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete restrict,
  kind public.document_kind not null, storage_path text not null unique, original_filename text not null,
  mime_type text not null, byte_size bigint not null check (byte_size > 0),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')), entity_table text not null,
  entity_id uuid, changed_fields text[] not null default '{}', occurred_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
declare old_data jsonb := coalesce(to_jsonb(old), '{}'::jsonb); new_data jsonb := coalesce(to_jsonb(new), '{}'::jsonb);
  row_id uuid; fields text[];
begin
  row_id := coalesce((new_data ->> 'id')::uuid, (old_data ->> 'id')::uuid);
  select coalesce(array_agg(key order by key), '{}') into fields from jsonb_each(new_data) as item(key, value)
    where item.value is distinct from (old_data -> item.key);
  insert into public.audit_logs (actor_id, action, entity_table, entity_id, changed_fields)
    values (auth.uid(), tg_op, tg_table_name, row_id, fields);
  if tg_op = 'DELETE' then return old; end if; return new;
end;
$$;
create or replace function public.create_pending_attendance() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.attendance (appointment_id) values (new.id); return new; end;
$$;
create or replace function public.record_attendance(p_appointment_id uuid, p_status public.attendance_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status = 'pending' then raise exception 'Attendance cannot be reset to pending'; end if;
  if not public.is_admin() and not exists (
    select 1 from public.appointments a join public.student_service_assignments ssa on ssa.id = a.assignment_id
    where a.id = p_appointment_id and ssa.professional_id = auth.uid() and ssa.is_active
  ) then raise exception 'Not authorized to record attendance for this appointment'; end if;
  update public.attendance set status = p_status, recorded_by = auth.uid(), recorded_at = now(), updated_at = now()
    where appointment_id = p_appointment_id;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger services_updated before update on public.service_types for each row execute function public.set_updated_at();
create trigger students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger student_ids_updated before update on public.student_identifiers for each row execute function public.set_updated_at();
create trigger student_contacts_updated before update on public.student_contacts for each row execute function public.set_updated_at();
create trigger student_addresses_updated before update on public.student_addresses for each row execute function public.set_updated_at();
create trigger financial_responsibles_updated before update on public.financial_responsibles for each row execute function public.set_updated_at();
create trigger financial_accounts_updated before update on public.financial_responsible_bank_accounts for each row execute function public.set_updated_at();
create trigger assignments_updated before update on public.student_service_assignments for each row execute function public.set_updated_at();
create trigger appointments_updated before update on public.appointments for each row execute function public.set_updated_at();
create trigger attendance_updated before update on public.attendance for each row execute function public.set_updated_at();
create trigger records_updated before update on public.session_records for each row execute function public.set_updated_at();
create trigger appointment_attendance after insert on public.appointments for each row execute function public.create_pending_attendance();
create trigger students_audit after insert or update or delete on public.students for each row execute function public.audit_row();
create trigger appointments_audit after insert or update or delete on public.appointments for each row execute function public.audit_row();
create trigger documents_audit after insert or update or delete on public.student_documents for each row execute function public.audit_row();

alter table public.profiles enable row level security;
alter table public.service_types enable row level security;
alter table public.professional_service_types enable row level security;
alter table public.students enable row level security;
alter table public.student_identifiers enable row level security;
alter table public.student_contacts enable row level security;
alter table public.student_addresses enable row level security;
alter table public.financial_responsibles enable row level security;
alter table public.financial_responsible_bank_accounts enable row level security;
alter table public.student_service_assignments enable row level security;
alter table public.appointments enable row level security;
alter table public.attendance enable row level security;
alter table public.session_records enable row level security;
alter table public.student_documents enable row level security;
alter table public.audit_logs enable row level security;

create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "authenticated read active services" on public.service_types for select to authenticated using (is_active);
create policy "admins manage services" on public.service_types for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage professional services" on public.professional_service_types for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own professional services" on public.professional_service_types for select using (professional_id = auth.uid());
create policy "admins manage students" on public.students for all using (public.is_admin()) with check (public.is_admin());
create policy "users read assigned students" on public.students for select using (exists (
  select 1 from public.student_service_assignments ssa where ssa.student_id = id and ssa.professional_id = auth.uid() and ssa.is_active));
create policy "admins manage student identifiers" on public.student_identifiers for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage student contacts" on public.student_contacts for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage student addresses" on public.student_addresses for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage financial responsibles" on public.financial_responsibles for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage financial accounts" on public.financial_responsible_bank_accounts for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage assignments" on public.student_service_assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own assignments" on public.student_service_assignments for select using (professional_id = auth.uid());
create policy "admins manage appointments" on public.appointments for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own appointments" on public.appointments for select using (exists (
  select 1 from public.student_service_assignments ssa where ssa.id = assignment_id and ssa.professional_id = auth.uid() and ssa.is_active));
create policy "admins manage attendance" on public.attendance for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own attendance" on public.attendance for select using (exists (
  select 1 from public.appointments a join public.student_service_assignments ssa on ssa.id = a.assignment_id
  where a.id = appointment_id and ssa.professional_id = auth.uid() and ssa.is_active));
create policy "admins manage session records" on public.session_records for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage student documents" on public.student_documents for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());

revoke all on function public.record_attendance(uuid, public.attendance_status) from public;
revoke all on function public.is_admin() from public;

-- A Data API não recebe permissões automáticas neste projeto. O acesso é liberado
-- por tabela/função, depois que RLS e as políticas já estiverem definidos.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated, service_role;

-- Frontend autenticado: somente leitura das informações necessárias para agenda
-- e execução controlada do check-in/falta pela RPC. As policies RLS restringem
-- as linhas a cada profissional.
grant select on public.profiles,
  public.service_types,
  public.professional_service_types,
  public.students,
  public.student_service_assignments,
  public.appointments,
  public.attendance
to authenticated;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.record_attendance(uuid, public.attendance_status)
to authenticated, service_role;

-- O backend usa a chave secreta somente no servidor para operações administrativas.
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
insert into storage.buckets (id, name, public) values ('student-documents', 'student-documents', false) on conflict (id) do nothing;
create policy "admins manage student document files" on storage.objects for all to authenticated
  using (bucket_id = 'student-documents' and public.is_admin())
  with check (bucket_id = 'student-documents' and public.is_admin());
