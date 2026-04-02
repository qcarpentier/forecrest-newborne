-- ============================================
-- Forecrest — Migration 002: Multi-User Collaboration
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================

-- ────────────────────────────────────────────
-- 1. Create tables FIRST (before functions that reference them)
-- ────────────────────────────────────────────

create table if not exists workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner','member','accountant','advisor')),
  invited_by uuid references profiles(id) on delete set null,
  joined_at timestamptz,
  last_seen_at timestamptz,
  current_page text,
  status text default 'invited' check (status in ('active','invited','removed')),
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create index if not exists idx_wm_workspace on workspace_members(workspace_id);
create index if not exists idx_wm_user on workspace_members(user_id);

create table if not exists workspace_invitations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  email text not null,
  role text default 'member' check (role in ('member','accountant','advisor')),
  invited_by uuid references profiles(id) on delete set null not null,
  workspace_name text default '',
  inviter_name text default '',
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_wi_email on workspace_invitations(email);
create index if not exists idx_wi_token on workspace_invitations(token);

create table if not exists element_locks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  element_key text not null,
  locked_by uuid references profiles(id) on delete cascade not null,
  locked_at timestamptz default now(),
  expires_at timestamptz default now() + interval '5 minutes',
  unique(workspace_id, element_key)
);

create index if not exists idx_locks_workspace on element_locks(workspace_id);

-- ────────────────────────────────────────────
-- 2. Helper functions (SECURITY DEFINER = bypass RLS)
--    Now safe: tables exist above
-- ────────────────────────────────────────────

-- Get workspace display name by ID (only for members/owners/invitees)
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

-- Accept invitation RPC (handles everything in one transaction, bypasses RLS)
create or replace function public.accept_invitation(invite_token text)
returns json as $$
declare
  inv record;
begin
  select * into inv from public.workspace_invitations
  where token = invite_token
    and accepted_at is null
    and expires_at > now()
    and lower(email) = lower(auth.jwt()->>'email');

  if inv is null then
    return json_build_object('error', 'Invalid or expired invitation');
  end if;

  update public.workspace_invitations set accepted_at = now() where id = inv.id;

  insert into public.workspace_members (workspace_id, user_id, role, status, joined_at, invited_by)
  values (inv.workspace_id, auth.uid(), inv.role, 'active', now(), inv.invited_by)
  on conflict (workspace_id, user_id)
  do update set role = inv.role, status = 'active', joined_at = now();

  return json_build_object(
    'success', true,
    'workspace_id', inv.workspace_id,
    'role', inv.role,
    'workspace_name', inv.workspace_name
  );
end;
$$ language plpgsql security definer set search_path = '';

-- Leave workspace (member removes themselves)
create or replace function public.leave_workspace(ws_id uuid)
returns void as $$
begin
  update public.workspace_members
  set status = 'removed'
  where workspace_id = ws_id
    and user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = '';

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

-- List workspace members with profile info (bypasses RLS for cross-table reads)
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

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable set search_path = '';

create or replace function public.is_workspace_editor(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'member')
  );
$$ language sql security definer stable set search_path = '';

create or replace function public.is_workspace_owner_fn(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable set search_path = '';

create or replace function public.shares_workspace_with(target_user_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.workspace_members my_wm
    join public.workspace_members their_wm on their_wm.workspace_id = my_wm.workspace_id
    where my_wm.user_id = auth.uid()
      and my_wm.status = 'active'
      and their_wm.user_id = target_user_id
      and their_wm.status = 'active'
  );
$$ language sql security definer stable set search_path = '';

-- ────────────────────────────────────────────
-- 3. RLS policies for workspace_members
-- ────────────────────────────────────────────

alter table workspace_members enable row level security;

drop policy if exists "Members read workspace members" on workspace_members;
create policy "Members read workspace members" on workspace_members
  for select using (
    public.is_workspace_member(workspace_id)
    or public.is_workspace_owner_fn(workspace_id)
  );

drop policy if exists "Owner manages members" on workspace_members;
create policy "Owner manages members" on workspace_members
  for all using (
    public.is_workspace_owner_fn(workspace_id)
  )
  with check (
    public.is_workspace_owner_fn(workspace_id)
  );

-- Invitation acceptance is handled via the accept_invitation RPC only.
drop policy if exists "Invitees insert own membership" on workspace_members;
drop policy if exists "Members update own presence" on workspace_members;

-- ────────────────────────────────────────────
-- 4. RLS policies for workspace_invitations
-- ────────────────────────────────────────────

alter table workspace_invitations enable row level security;

drop policy if exists "Owner manages invitations" on workspace_invitations;
create policy "Owner manages invitations" on workspace_invitations
  for all using (
    public.is_workspace_owner_fn(workspace_id)
  )
  with check (
    public.is_workspace_owner_fn(workspace_id)
  );

drop policy if exists "Invitee reads own invitation" on workspace_invitations;
create policy "Invitee reads own invitation" on workspace_invitations
  for select using (
    lower(email) = lower(auth.jwt()->>'email')
  );

-- Invitation acceptance is handled via the accept_invitation RPC only.
drop policy if exists "Invitee updates own invitation" on workspace_invitations;

-- ────────────────────────────────────────────
-- 5. RLS policies for element_locks
-- ────────────────────────────────────────────

alter table element_locks enable row level security;

drop policy if exists "Members read locks" on element_locks;
create policy "Members read locks" on element_locks
  for select using (
    public.is_workspace_member(workspace_id)
  );

drop policy if exists "Members insert own locks" on element_locks;
create policy "Members insert own locks" on element_locks
  for insert with check (locked_by = auth.uid());

drop policy if exists "Members delete own locks" on element_locks;
create policy "Members delete own locks" on element_locks
  for delete using (locked_by = auth.uid());

-- ────────────────────────────────────────────
-- 6. Update workspaces RLS for shared access
-- ────────────────────────────────────────────

drop policy if exists "Users CRUD own workspaces" on workspaces;

drop policy if exists "Workspace select" on workspaces;
create policy "Workspace select" on workspaces
  for select using (
    auth.uid() = user_id
    or public.is_workspace_member(id)
  );

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

drop policy if exists "Workspace insert" on workspaces;
create policy "Workspace insert" on workspaces
  for insert with check (auth.uid() = user_id);

drop policy if exists "Workspace delete" on workspaces;
create policy "Workspace delete" on workspaces
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────
-- 7. Profiles: allow members to read co-members
-- ────────────────────────────────────────────

drop policy if exists "Members read co-member profiles" on profiles;
create policy "Members read co-member profiles" on profiles
  for select using (
    auth.uid() = id
    or public.shares_workspace_with(id)
  );

-- ────────────────────────────────────────────
-- 8. Backfill: existing users become owners
-- ────────────────────────────────────────────

insert into workspace_members (workspace_id, user_id, role, status, joined_at)
select id, user_id, 'owner', 'active', created_at
from workspaces
on conflict (workspace_id, user_id) do nothing;
