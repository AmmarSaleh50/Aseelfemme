-- 006_categories_bilingual.sql
-- Add bilingual support to categories table
-- Run this migration after 005_user_settings.sql

-- Add new bilingual columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Migrate existing data: copy 'name' to 'name_en' and 'description' to 'description_en'
UPDATE categories 
SET name_en = name, description_en = description
WHERE name_en IS NULL;

-- Make the old 'name' and 'description' columns nullable for backward compatibility
ALTER TABLE categories ALTER COLUMN name DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN description DROP NOT NULL;

-- Create a trigger to auto-populate 'name' from 'name_en' for backward compatibility
CREATE OR REPLACE FUNCTION sync_category_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name_en is provided, sync it to name
  IF NEW.name_en IS NOT NULL AND NEW.name_en != '' THEN
    NEW.name = NEW.name_en;
  END IF;
  
  -- If description_en is provided, sync it to description
  IF NEW.description_en IS NOT NULL THEN
    NEW.description = NEW.description_en;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_name_sync
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION sync_category_name();
