/*
  # Add Social Links to Profiles

  1. Changes
    - Add social media columns to profiles table:
      - `instagram_url` (text)
      - `email_public` (text)
      - `other_social_links` (jsonb array)

  2. Security
    - Existing RLS policies will cover the new columns
*/

ALTER TABLE profiles
ADD COLUMN instagram_url text,
ADD COLUMN email_public text,
ADD COLUMN other_social_links jsonb DEFAULT '[]'::jsonb;