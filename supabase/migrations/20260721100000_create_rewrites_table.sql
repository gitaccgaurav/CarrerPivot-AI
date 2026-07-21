/*
# Create rewrites table

## 1. New Table
- `rewrites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `target_job_title` (text)
  - `target_industry` (text, nullable)
  - `job_description` (text, nullable)
  - `rewritten_bullets` (jsonb) — [{original, rewritten, note}]
  - `transferable_skills` (text[])
  - `keywords_matched` (text[])
  - `keywords_missing` (text[])
  - `ats_score` (integer)
  - `cover_letter` (text)
  - `created_at` (timestamptz)

## 2. Security (RLS)
- Enable RLS.
- Users can SELECT and INSERT only their own rows.
- No client-side UPDATE/DELETE policies (rows are immutable history).
*/

CREATE TABLE IF NOT EXISTS rewrites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_job_title text NOT NULL,
  target_industry text,
  job_description text,
  rewritten_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  transferable_skills text[] NOT NULL DEFAULT '{}',
  keywords_matched text[] NOT NULL DEFAULT '{}',
  keywords_missing text[] NOT NULL DEFAULT '{}',
  ats_score integer NOT NULL DEFAULT 0,
  cover_letter text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewrites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rewrites" ON rewrites;
CREATE POLICY "select_own_rewrites"
  ON rewrites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rewrites" ON rewrites;
CREATE POLICY "insert_own_rewrites"
  ON rewrites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
