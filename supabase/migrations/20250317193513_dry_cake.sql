/*
  # Accolades Schema

  1. New Tables
    - `accolades`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `title` (text)
      - `issuer` (text)
      - `description` (text)
      - `date_received` (date)
      - `url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for viewing and managing accolades
*/

CREATE TABLE accolades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  description text,
  date_received date,
  url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accolades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accolades are viewable by everyone" ON accolades
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own accolades" ON accolades
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own accolades" ON accolades
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own accolades" ON accolades
  FOR DELETE USING (auth.uid() = profile_id);