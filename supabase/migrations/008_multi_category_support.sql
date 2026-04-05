-- Multi-category support for products
-- Products can now belong to multiple categories via a junction table

-- Create the product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Allow public read access on product_categories"
  ON product_categories FOR SELECT
  USING (true);

-- Policy for authenticated write access
CREATE POLICY "Allow authenticated insert on product_categories"
  ON product_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on product_categories"
  ON product_categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- Migrate existing category data to the junction table
-- This copies the current category (from categoryEn) to the junction table
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c ON c.name_en = p.category_en OR c.name = p.category_en
WHERE p.category_en IS NOT NULL
  AND p.category_en != ''
ON CONFLICT (product_id, category_id) DO NOTHING;
