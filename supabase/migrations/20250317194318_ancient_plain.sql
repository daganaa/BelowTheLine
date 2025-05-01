/*
  # Add Portfolio Contributors Schema

  1. New Tables
    - `portfolio_contributors`
      - `id` (uuid, primary key)
      - `portfolio_item_id` (uuid, references portfolio_items)
      - `profile_id` (uuid, references profiles)
      - `role` (text) - specific role in the project
      - `created_at` (timestamp)

  2. Changes
    - Move `role` from portfolio_items to portfolio_contributors
    - Each portfolio item can have multiple contributors with different roles

  3. Security
    - Enable RLS
    - Add policies for viewing and managing contributors
*/

-- Create the contributors table
CREATE TABLE portfolio_contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES portfolio_items ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_item_id, profile_id, role)
);

-- Enable RLS
ALTER TABLE portfolio_contributors ENABLE ROW LEVEL SECURITY;

-- Remove role column from portfolio_items as it's now in portfolio_contributors
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio_items' AND column_name = 'role'
  ) THEN
    ALTER TABLE portfolio_items DROP COLUMN role;
  END IF;
END $$;

-- Add policies for portfolio_contributors
CREATE POLICY "Portfolio contributors are viewable by everyone" ON portfolio_contributors
  FOR SELECT USING (true);

-- Users can add themselves or be added by the portfolio item owner
CREATE POLICY "Users can add contributors" ON portfolio_contributors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND (
        auth.uid() = pi.profile_id -- Portfolio owner can add contributors
        OR auth.uid() = profile_id -- Users can add themselves
      )
    )
  );

-- Only the portfolio item owner can update contributor roles
CREATE POLICY "Portfolio owners can update contributors" ON portfolio_contributors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND auth.uid() = pi.profile_id
    )
  );

-- Portfolio owner or the contributor themselves can remove the contribution
CREATE POLICY "Users can remove contributors" ON portfolio_contributors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND (
        auth.uid() = pi.profile_id -- Portfolio owner can remove contributors
        OR auth.uid() = profile_id -- Contributors can remove themselves
      )
    )
  );