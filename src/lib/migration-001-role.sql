-- ============================================
-- Forecrest — Migration 001: Add role column
-- Run this if you already have the base schema
-- ============================================

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update RLS: allow admin to read all profiles
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can update any profile (change roles)
DROP POLICY IF EXISTS "Admin update any profile" ON profiles;
CREATE POLICY "Admin update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can read all workspaces
DROP POLICY IF EXISTS "Admin read all workspaces" ON workspaces;
CREATE POLICY "Admin read all workspaces" ON workspaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Set yourself as admin (replace with your email):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
