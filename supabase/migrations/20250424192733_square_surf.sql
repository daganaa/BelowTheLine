/*
  # Portfolio Items Schema

  1. New Tables
    - `portfolio_items`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `type` (text) - enum: 'film', 'professional', 'work_in_progress'
      - `url` (text)
      - `image_url` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `rating` (integer) - Only for films, 1-5 stars
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for viewing and managing portfolio items
*/

CREATE TYPE portfolio_item_type AS ENUM ('film', 'professional', 'work_in_progress');

CREATE TABLE portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type portfolio_item_type NOT NULL,
  url text,
  image_url text,
  start_date date,
  end_date date,
  rating integer CHECK (
    (type = 'film' AND rating BETWEEN 1 AND 5) OR
    (type != 'film' AND rating IS NULL)
  ),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio items are viewable by everyone" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own portfolio items" ON portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own portfolio items" ON portfolio_items
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own portfolio items" ON portfolio_items
  FOR DELETE USING (auth.uid() = profile_id);