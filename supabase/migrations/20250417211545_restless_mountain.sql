/*
  # Education Table Setup

  1. New Tables
    - `education`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `school` (text)
      - `degree` (text)
      - `field_of_study` (text)
      - `start_date` (date) - stored as date, displayed as month/year
      - `end_date` (date, optional) - stored as date, displayed as month/year
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for viewing and editing education entries
*/

CREATE TABLE education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field_of_study text,
  start_date date NOT NULL,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Education entries are viewable by everyone" ON education
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own education entries" ON education
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own education entries" ON education
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own education entries" ON education
  FOR DELETE USING (auth.uid() = profile_id);