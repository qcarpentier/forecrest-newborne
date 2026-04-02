-- ============================================
-- Forecrest — Migration 003: Security Hardening
-- Run this in your Supabase SQL Editor on existing databases
-- ============================================

-- Harden profile updates: users can edit their profile content, but not self-promote.
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists birth_date date;

create or replace function public.protect_profile_mutations()
returns trigger as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() = old.id then
    new.id := old.id;
    new.email := old.email;
    new.role := old.role;
    new.created_at := old.created_at;
    new.updated_at := now();
    return new;
  end if;

  if exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    new.updated_at := now();
    return new;
  end if;

  raise exception 'Not authorized to update this profile';
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists protect_profile_mutations on public.profiles;
create trigger protect_profile_mutations
  before update on public.profiles
  for each row execute procedure public.protect_profile_mutations();

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Harden workspace updates: invited editors can update app_state, but not ownership metadata.
create or replace function public.protect_workspace_mutations()
returns trigger as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> old.user_id then
    if new.id is distinct from old.id
      or new.user_id is distinct from old.user_id
      or new.name is distinct from old.name
      or new.schema_version is distinct from old.schema_version
      or new.created_at is distinct from old.created_at then
      raise exception 'Only workspace owners can modify workspace metadata';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists protect_workspace_mutations on public.workspaces;
create trigger protect_workspace_mutations
  before update on public.workspaces
  for each row execute procedure public.protect_workspace_mutations();

drop policy if exists "Workspace update" on workspaces;
create policy "Workspace update" on workspaces
  for update using (
    auth.uid() = user_id
    or public.is_workspace_editor(id)
  )
  with check (
    auth.uid() = user_id
    or public.is_workspace_editor(id)
  );

-- Restrict workspace metadata RPCs and move presence writes behind SECURITY DEFINER functions.
create or replace function public.get_workspace_name(ws_id uuid)
returns text as $$
declare
  can_read boolean;
begin
  can_read := public.is_workspace_member(ws_id)
    or public.is_workspace_owner_fn(ws_id)
    or exists (
      select 1
      from public.workspace_invitations wi
      where wi.workspace_id = ws_id
        and wi.accepted_at is null
        and wi.expires_at > now()
        and lower(wi.email) = lower(auth.jwt()->>'email')
    );

  if not can_read then
    return '';
  end if;

  return coalesce(
    (select w.app_state->>'companyName' from public.workspaces w where w.id = ws_id limit 1),
    (select w.name from public.workspaces w where w.id = ws_id limit 1),
    ''
  );
end;
$$ language plpgsql security definer stable set search_path = '';

create or replace function public.update_my_presence(ws_id uuid, page_id text)
returns void as $$
declare
  safe_page text;
begin
  safe_page := left(trim(coalesce(page_id, '')), 120);

  update public.workspace_members
  set current_page = nullif(safe_page, ''),
      last_seen_at = now()
  where workspace_id = ws_id
    and user_id = auth.uid()
    and status = 'active';
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.get_workspace_members(ws_id uuid)
returns json as $$
begin
  if not (public.is_workspace_member(ws_id) or public.is_workspace_owner_fn(ws_id)) then
    return '[]'::json;
  end if;

  return (
    select coalesce(json_agg(row_to_json(r)), '[]'::json)
    from (
      select
        wm.id, wm.user_id, wm.role, wm.status, wm.joined_at,
        wm.last_seen_at, wm.current_page,
        json_build_object('display_name', p.display_name, 'email', p.email) as profiles
      from public.workspace_members wm
      left join public.profiles p on p.id = wm.user_id
      where wm.workspace_id = ws_id
        and wm.status != 'removed'
      order by wm.created_at asc
    ) r
  );
end;
$$ language plpgsql security definer stable set search_path = '';

-- Remove overly broad invitee/member write access on collaboration tables.
drop policy if exists "Owner manages members" on workspace_members;
create policy "Owner manages members" on workspace_members
  for all using (
    public.is_workspace_owner_fn(workspace_id)
  )
  with check (
    public.is_workspace_owner_fn(workspace_id)
  );

drop policy if exists "Invitees insert own membership" on workspace_members;
drop policy if exists "Members update own presence" on workspace_members;

drop policy if exists "Owner manages invitations" on workspace_invitations;
create policy "Owner manages invitations" on workspace_invitations
  for all using (
    public.is_workspace_owner_fn(workspace_id)
  )
  with check (
    public.is_workspace_owner_fn(workspace_id)
  );

drop policy if exists "Invitee updates own invitation" on workspace_invitations;
