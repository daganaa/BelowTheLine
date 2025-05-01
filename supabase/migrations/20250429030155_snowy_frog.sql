/*
  # Add Rough Cut Applications Schema

  1. New Tables
    - `rough_cut_applications`
      - `id` (uuid, primary key)
      - `portfolio_item_id` (uuid, references portfolio_items)
      - `applicant_id` (uuid, references profiles)
      - `comment` (text)
      - `status` (enum: pending/accepted/rejected)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for managing applications
*/

CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE rough_cut_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES portfolio_items ON DELETE CASCADE,
  applicant_id uuid REFERENCES profiles ON DELETE CASCADE,
  comment text NOT NULL,
  status application_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_item_id, applicant_id)
);

ALTER TABLE rough_cut_applications ENABLE ROW LEVEL SECURITY;

-- Everyone can view applications for items they own or have applied to
CREATE POLICY "Users can view relevant applications" ON rough_cut_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND (
        pi.profile_id = auth.uid() OR
        applicant_id = auth.uid()
      )
    )
  );

-- Users can apply to rough cuts they don't own
CREATE POLICY "Users can apply to rough cuts" ON rough_cut_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND pi.type = 'work_in_progress'
      AND pi.profile_id != auth.uid()
    )
  );

-- Only rough cut owners can update application status
CREATE POLICY "Owners can update application status" ON rough_cut_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND pi.profile_id = auth.uid()
    )
  );