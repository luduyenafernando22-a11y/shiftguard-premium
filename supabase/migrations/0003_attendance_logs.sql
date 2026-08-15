-- ShiftGuard Phase 3: operational attendance logs.

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('CLOCK_IN', 'CLOCK_OUT')),
  timestamp timestamptz not null default now(),
  location_coords jsonb,
  is_offline_sync boolean not null default false,
  verified_at timestamptz
);

create index if not exists attendance_logs_org_timestamp_idx on public.attendance_logs(organization_id, timestamp desc);
create index if not exists attendance_logs_user_timestamp_idx on public.attendance_logs(user_id, timestamp desc);

alter table public.attendance_logs enable row level security;

-- Employees can only create and read their own attendance history.
drop policy if exists attendance_employee_insert_own on public.attendance_logs;
create policy attendance_employee_insert_own on public.attendance_logs
for insert to authenticated
with check (
  user_id = auth.uid()
  and organization_id = public.current_organization_id()
);

drop policy if exists attendance_employee_select_own on public.attendance_logs;
create policy attendance_employee_select_own on public.attendance_logs
for select to authenticated
using (
  user_id = auth.uid()
  and organization_id = public.current_organization_id()
);

-- Managers and admins can monitor all attendance logs for their organization.
drop policy if exists attendance_manager_admin_select_org on public.attendance_logs;
create policy attendance_manager_admin_select_org on public.attendance_logs
for select to authenticated
using (
  organization_id = public.current_organization_id()
  and public.has_role(array['admin', 'manager'])
);

-- No update/delete policies: attendance records are append-only from the client.

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'attendance_logs'
  ) then
    alter publication supabase_realtime add table public.attendance_logs;
  end if;
exception
  when undefined_object then
    null;
end;
$$;
