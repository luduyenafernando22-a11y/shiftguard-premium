-- ShiftGuard initial multi-tenant schema.
-- Apply with Supabase migrations or the SQL editor.

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

create table if not exists public.roles (
  name text primary key check (name in ('admin', 'manager', 'auditor', 'employee')),
  description text not null
);

insert into public.roles (name, description) values
  ('admin', 'Full organization administration'),
  ('manager', 'Create and edit employees and shifts'),
  ('auditor', 'Read-only compliance and reporting access'),
  ('employee', 'Read-only access to the employee profile and own shifts')
on conflict (name) do update set description = excluded.description;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null default '',
  role text not null references public.roles(name) default 'employee',
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_code text not null,
  full_name text not null,
  profession text not null default 'registeredNurse',
  custom_profession text not null default '',
  department text not null default '',
  contracted_hours numeric(5,2) not null default 38.5 check (contracted_hours >= 0 and contracted_hours <= 168),
  status text not null default 'active' check (status in ('active', 'inactive')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, employee_code)
);

alter table public.profiles
  drop constraint if exists profiles_employee_id_fkey;
alter table public.profiles
  add constraint profiles_employee_id_fkey foreign key (employee_id) references public.employees(id) on delete set null;

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes >= 0 and break_minutes <= 1440),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists employees_organization_id_idx on public.employees(organization_id);
create index if not exists shifts_organization_date_idx on public.shifts(organization_id, shift_date);
create index if not exists shifts_employee_date_idx on public.shifts(employee_id, shift_date);

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = any(required_roles), false)
$$;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(value, 'organization'))), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  org_name := coalesce(nullif(trim(new.raw_user_meta_data->>'organization_name'), ''), 'New Organization');
  base_slug := coalesce(nullif(public.slugify(org_name), ''), 'organization');
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  insert into public.organizations (name, slug)
  values (org_name, final_slug)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations for each row execute procedure public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at before update on public.employees for each row execute procedure public.set_updated_at();
drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at before update on public.shifts for each row execute procedure public.set_updated_at();

alter table public.roles enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.shifts enable row level security;

drop policy if exists roles_authenticated_read on public.roles;
create policy roles_authenticated_read on public.roles for select to authenticated using (true);

drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read on public.organizations for select to authenticated using (id = public.current_organization_id());
drop policy if exists organizations_admin_update on public.organizations;
create policy organizations_admin_update on public.organizations for update to authenticated using (id = public.current_organization_id() and public.has_role(array['admin'])) with check (id = public.current_organization_id());

drop policy if exists profiles_same_org_read on public.profiles;
create policy profiles_same_org_read on public.profiles for select to authenticated using (organization_id = public.current_organization_id());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid() and organization_id = public.current_organization_id()) with check (id = auth.uid() and organization_id = public.current_organization_id());
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles for all to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin'])) with check (organization_id = public.current_organization_id());

drop policy if exists employees_same_org_read on public.employees;
create policy employees_same_org_read on public.employees for select to authenticated using (organization_id = public.current_organization_id());
drop policy if exists employees_manager_write on public.employees;
create policy employees_manager_write on public.employees for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_role(array['admin','manager']));
create policy employees_manager_update on public.employees for update to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin','manager'])) with check (organization_id = public.current_organization_id());
create policy employees_admin_delete on public.employees for delete to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin']));

drop policy if exists shifts_same_org_read on public.shifts;
create policy shifts_same_org_read on public.shifts for select to authenticated using (
  organization_id = public.current_organization_id()
  and (public.current_user_role() <> 'employee' or employee_id = (select employee_id from public.profiles where id = auth.uid()))
);
drop policy if exists shifts_manager_write on public.shifts;
create policy shifts_manager_write on public.shifts for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_role(array['admin','manager']));
create policy shifts_manager_update on public.shifts for update to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin','manager'])) with check (organization_id = public.current_organization_id());
create policy shifts_manager_delete on public.shifts for delete to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin','manager']));

-- Prevent clients from assigning rows to another tenant through foreign-key IDs.
create or replace function public.validate_employee_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.employees where id = new.employee_id and organization_id = new.organization_id) then
    raise exception 'employee does not belong to the current organization';
  end if;
  return new;
end;
$$;

drop trigger if exists shifts_validate_employee_org on public.shifts;
create trigger shifts_validate_employee_org before insert or update on public.shifts for each row execute procedure public.validate_employee_organization();
