/*
# Create profiles table + resumes storage bucket

## 1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `email` (text) — cached email for display
  - `rewrites_used` (integer, default 0) — number of free rewrites consumed
  - `rewrites_limit` (integer, default 3) — cap on free rewrites
  - `created_at` (timestamptz) — row creation time
  - `updated_at` (timestamptz) — last update time

## 2. Automation
- `handle_new_user()` trigger function: when a row is inserted into
  `auth.users`, automatically inserts a matching `profiles` row with
  default `rewrites_used = 0` and `rewrites_limit = 3`.
- Trigger `on_auth_user_created` fires AFTER INSERT on auth.users.

## 3. Security (RLS)
- Enable RLS on `profiles`.
- `select_own_profile`: authenticated users can SELECT only their own row.
- `update_own_profile`: authenticated users can UPDATE only their own row
  (used to increment `rewrites_used`).
- No INSERT/DELETE policies from the client — profiles are created solely
  by the trigger function running with elevated privileges.

## 4. Storage
- Create public-read bucket `resumes` (files served to the owning user only
  via signed URLs, but the bucket itself is not public-listable).
- Storage policies on `resumes` bucket (authenticated only):
  - `select_own_resumes`: allow SELECT of files where the first path
    segment equals the auth user's id.
  - `insert_own_resumes`: allow INSERT (upload) under the same condition.
  - `update_own_resumes`: allow UPDATE on the user's own files.
  - `delete_own_resumes`: allow DELETE on the user's own files.
*/

-- =========================================================
-- profiles table
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  rewrites_used integer NOT NULL DEFAULT 0,
  rewrites_limit integer NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =========================================================
-- auto-create profile on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- resumes storage bucket + policies
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "select_own_resumes" ON storage.objects;
CREATE POLICY "select_own_resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "insert_own_resumes" ON storage.objects;
CREATE POLICY "insert_own_resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_resumes" ON storage.objects;
CREATE POLICY "update_own_resumes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_resumes" ON storage.objects;
CREATE POLICY "delete_own_resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
