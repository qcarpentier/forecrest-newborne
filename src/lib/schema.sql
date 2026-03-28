-- ============================================
-- Forecrest — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles (auto-created on signup)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  role text default 'user',  -- 'user' | 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: profiles
alter table profiles enable row level security;
drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);
drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);
-- Note: admin policies (read all profiles/workspaces) require a Supabase Edge Function
-- to avoid RLS recursion. Will be added when multi-user admin is needed.

-- 2. Workspaces (one per user, stores full app state as JSONB)
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text default 'Mon entreprise',
  app_state jsonb default '{}',
  schema_version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workspaces_user on workspaces(user_id);

-- RLS: workspaces
alter table workspaces enable row level security;
drop policy if exists "Users CRUD own workspaces" on workspaces;
create policy "Users CRUD own workspaces" on workspaces
  for all using (auth.uid() = user_id);
