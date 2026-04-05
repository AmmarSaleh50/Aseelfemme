-- Add bilingual fields for shape and color
-- This allows products to have localized shape and color names

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shape_en TEXT,
  ADD COLUMN IF NOT EXISTS shape_ar TEXT,
  ADD COLUMN IF NOT EXISTS color_en TEXT,
  ADD COLUMN IF NOT EXISTS color_ar TEXT;

-- Migrate existing data: copy current shape/color to the English fields
UPDATE products SET shape_en = shape WHERE shape IS NOT NULL AND shape_en IS NULL;
UPDATE products SET color_en = color WHERE color IS NOT NULL AND color_en IS NULL;

-- Also add tags_en and tags_ar columns if not exist
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tags_en TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_ar TEXT[] DEFAULT '{}';
