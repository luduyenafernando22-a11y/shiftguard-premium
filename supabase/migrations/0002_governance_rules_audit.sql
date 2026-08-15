-- ShiftGuard Phase 2: governance, configurable rules and immutable audit history.

alter table public.profiles add column if not exists email text not null default '';

create table if not exists public.organization_rules (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  standard_daily_hours numeric(5,2) not null default 8 check (standard_daily_hours > 0 and standard_daily_hours <= 24),
  maximum_daily_hours numeric(5,2) not null default 10 check (maximum_daily_hours > 0 and maximum_daily_hours <= 24),
  break_threshold_hours numeric(5,2) not null default 6 check (break_threshold_hours >= 0 and break_threshold_hours <= 24),
  break_threshold_long_hours numeric(5,2) not null default 9 check (break_threshold_long_hours >= 0 and break_threshold_long_hours <= 24),
  break_minutes_standard integer not null default 30 check (break_minutes_standard >= 0 and break_minutes_standard <= 1440),
  break_minutes_long integer not null default 45 check (break_minutes_long >= 0 and break_minutes_long <= 1440),
  minimum_rest_hours numeric(5,2) not null default 11 check (minimum_rest_hours >= 0 and minimum_rest_hours <= 48),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (maximum_daily_hours >= standard_daily_hours),
  check (break_threshold_long_hours >= break_threshold_hours),
  check (break_minutes_long >= break_minutes_standard)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  entity_type text not null check (entity_type in ('shift', 'employee', 'profile', 'organization_rules')),
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.ensure_organization_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_rules (organization_id)
  values (new.id)
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

drop trigger if exists organizations_create_default_rules on public.organizations;
create trigger organizations_create_default_rules
after insert on public.organizations
for each row execute procedure public.ensure_organization_rules();

insert into public.organization_rules (organization_id)
select id from public.organizations
on conflict (organization_id) do nothing;

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

  insert into public.organizations (name, slug) values (org_name, final_slug) returning id into new_org_id;
  insert into public.profiles (id, organization_id, full_name, email, role)
  values (new.id, new_org_id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(new.email, ''), 'admin');
  return new;
end;
$$;

create or replace function public.audit_shift_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
    values (new.organization_id, auth.uid(), 'created', 'shift', new.id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, before_data, after_data)
    values (new.organization_id, auth.uid(), 'updated', 'shift', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, before_data)
    values (old.organization_id, auth.uid(), 'deleted', 'shift', old.id, to_jsonb(old));
    return old;
  end if;
end;
$$;

drop trigger if exists shifts_audit_log on public.shifts;
create trigger shifts_audit_log
after insert or update or delete on public.shifts
for each row execute procedure public.audit_shift_change();

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

drop trigger if exists audit_logs_immutable_update on public.audit_logs;
create trigger audit_logs_immutable_update before update or delete on public.audit_logs for each row execute procedure public.prevent_audit_log_mutation();

alter table public.organization_rules enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists rules_same_org_read on public.organization_rules;
create policy rules_same_org_read on public.organization_rules for select to authenticated using (organization_id = public.current_organization_id());
drop policy if exists rules_admin_write on public.organization_rules;
create policy rules_admin_write on public.organization_rules for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_role(array['admin']));
create policy rules_admin_update on public.organization_rules for update to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin'])) with check (organization_id = public.current_organization_id());

drop policy if exists audit_logs_same_org_read on public.audit_logs;
create policy audit_logs_same_org_read on public.audit_logs for select to authenticated using (organization_id = public.current_organization_id());
-- No client insert/update/delete policies: only SECURITY DEFINER triggers may write audit records.

-- Admin-only profile role management. Other profile fields remain self-manageable.
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles for all to authenticated using (organization_id = public.current_organization_id() and public.has_role(array['admin'])) with check (organization_id = public.current_organization_id());
