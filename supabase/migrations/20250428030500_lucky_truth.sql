/*
  # Add Film Ratings Table

  1. New Tables
    - `film_ratings`
      - `id` (uuid, primary key)
      - `portfolio_item_id` (uuid, references portfolio_items)
      - `rater_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for managing ratings
*/

-- Drop the table if it exists to ensure a clean state
DROP TABLE IF EXISTS film_ratings;

CREATE TABLE film_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES portfolio_items ON DELETE CASCADE,
  rater_id uuid REFERENCES profiles ON DELETE CASCADE,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_item_id, rater_id)
);

ALTER TABLE film_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view ratings for items they have access to
CREATE POLICY "Users can view ratings" ON film_ratings
  FOR SELECT USING (true);

-- Users can rate items if they are connected to the item owner or if they own the item
CREATE POLICY "Users can rate if connected or owner" ON film_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      LEFT JOIN connections c ON 
        (c.sender_id = auth.uid() AND c.receiver_id = pi.profile_id) OR
        (c.receiver_id = auth.uid() AND c.sender_id = pi.profile_id)
      WHERE pi.id = portfolio_item_id
      AND (
        c.status = 'accepted'
        OR pi.profile_id = auth.uid()
      )
    )
  );

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON film_ratings
  FOR UPDATE USING (auth.uid() = rater_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON film_ratings
  FOR DELETE USING (auth.uid() = rater_id);