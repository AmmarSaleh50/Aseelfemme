-- Add new columns for Accessories Upgrade

ALTER TABLE accessories
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS gallery_image_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags_en text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags_ar text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS short_description_en text,
ADD COLUMN IF NOT EXISTS short_description_ar text;

-- Try to populate slug for existing records
UPDATE accessories 
SET slug = lower(regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')) 
WHERE slug IS NULL AND name_en IS NOT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS accessories_slug_idx ON accessories (slug);
