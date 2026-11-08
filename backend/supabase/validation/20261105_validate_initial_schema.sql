-- Validação somente de leitura do esquema inicial no Supabase.
-- Execute este arquivo depois de 20261105000000_initial_schema.sql.

-- 1. Confirma as 15 tabelas da aplicação e se RLS está habilitada.
with expected_tables(table_name) as (
  values
    ('profiles'),
    ('service_types'),
    ('professional_service_types'),
    ('students'),
    ('student_identifiers'),
    ('student_contacts'),
    ('student_addresses'),
    ('financial_responsibles'),
    ('financial_responsible_bank_accounts'),
    ('student_service_assignments'),
    ('appointments'),
    ('attendance'),
    ('session_records'),
    ('student_documents'),
    ('audit_logs')
)
select
  expected_tables.table_name,
  case when class.oid is not null then 'ok' else 'ausente' end as table_status,
  coalesce(class.relrowsecurity, false) as rls_enabled
from expected_tables
left join pg_namespace namespace on namespace.nspname = 'public'
left join pg_class class
  on class.relnamespace = namespace.oid
  and class.relname = expected_tables.table_name
  and class.relkind = 'r'
order by expected_tables.table_name;

-- 2. Lista as políticas RLS aplicadas às tabelas da aplicação.
select
  tablename,
  policyname,
  cmd as operation,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Confirma as funções usadas pelas políticas e pelos gatilhos.
select
  routine_name,
  data_type as return_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_admin',
    'set_updated_at',
    'audit_row',
    'create_pending_attendance',
    'record_attendance'
  )
order by routine_name;

-- 4. Confirma que o bucket de documentos existe e não é público.
select
  id,
  name,
  public
from storage.buckets
where id = 'student-documents';

-- 5. Confirma as permissões mínimas concedidas ao papel autenticado.
with exposed_tables(table_name) as (
  values
    ('profiles'),
    ('service_types'),
    ('professional_service_types'),
    ('students'),
    ('student_service_assignments'),
    ('appointments'),
    ('attendance')
)
select
  table_name,
  has_table_privilege('authenticated', format('public.%I', table_name), 'select') as authenticated_can_select
from exposed_tables
order by table_name;
