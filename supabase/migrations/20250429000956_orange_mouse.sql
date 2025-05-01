/*
  # Portfolio Contributors Schema

  1. New Tables
    - `portfolio_contributors`
      - `id` (uuid, primary key)
      - `portfolio_item_id` (uuid, references portfolio_items)
      - `profile_id` (uuid, references profiles)
      - `role` (text) - specific role in the project
      - `department` (text) - department/category of the role
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for viewing and managing contributors
*/

CREATE TABLE portfolio_contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES portfolio_items ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  role text NOT NULL,
  department text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_item_id, profile_id, role)
);

ALTER TABLE portfolio_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio contributors are viewable by everyone" ON portfolio_contributors
  FOR SELECT USING (true);

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

CREATE POLICY "Portfolio owners can update contributors" ON portfolio_contributors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND auth.uid() = pi.profile_id
    )
  );

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