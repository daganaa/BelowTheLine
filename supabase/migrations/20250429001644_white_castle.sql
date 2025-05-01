/*
  # Add Department Column to Portfolio Contributors

  1. Changes
    - Add department column to portfolio_contributors table
    - Set default value to ensure backward compatibility
    - Update existing rows to have a default department

  2. Security
    - No changes to RLS policies needed
*/

-- Add department column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio_contributors' AND column_name = 'department'
  ) THEN
    ALTER TABLE portfolio_contributors ADD COLUMN department text DEFAULT 'Other';
    
    -- Update existing rows to have a default department
    UPDATE portfolio_contributors SET department = 'Other' WHERE department IS NULL;
    
    -- Make department required for future rows
    ALTER TABLE portfolio_contributors ALTER COLUMN department SET NOT NULL;
  END IF;
END $$;