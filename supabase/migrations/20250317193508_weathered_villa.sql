/*
  # Connections Schema

  1. New Tables
    - `connections`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `status` (text) - enum: 'pending', 'accepted', 'rejected'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for managing connections
*/

CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Users can send connection requests
CREATE POLICY "Users can send connection requests" ON connections
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    status = 'pending'
  );

-- Users can update connections they're part of
CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (
    auth.uid() IN (sender_id, receiver_id)
  );