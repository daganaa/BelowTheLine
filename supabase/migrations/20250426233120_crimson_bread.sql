/*
  # Add Film Comments Schema

  1. New Tables
    - `film_comments`
      - `id` (uuid, primary key)
      - `portfolio_item_id` (uuid, references portfolio_items)
      - `profile_id` (uuid, references profiles)
      - `text` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for managing comments
*/

CREATE TABLE film_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES portfolio_items ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_portfolio_item
    FOREIGN KEY (portfolio_item_id)
    REFERENCES portfolio_items (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_profile
    FOREIGN KEY (profile_id)
    REFERENCES profiles (id)
    ON DELETE CASCADE
);

ALTER TABLE film_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON film_comments FOR SELECT
  USING (true);

-- Users can create comments if they are connected to the film owner
CREATE POLICY "Users can comment if connected"
  ON film_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      JOIN connections c ON 
        (c.sender_id = auth.uid() AND c.receiver_id = pi.profile_id) OR
        (c.receiver_id = auth.uid() AND c.sender_id = pi.profile_id)
      WHERE pi.id = portfolio_item_id
      AND c.status = 'accepted'
    ) OR
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = portfolio_item_id
      AND pi.profile_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON film_comments FOR UPDATE
  USING (auth.uid() = profile_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON film_comments FOR DELETE
  USING (auth.uid() = profile_id);