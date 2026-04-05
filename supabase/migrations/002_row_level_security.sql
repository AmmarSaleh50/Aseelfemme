-- 002_row_level_security.sql
-- Row Level Security (RLS) Policies
-- Run this migration after 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES
-- Anyone can read published/active content
-- ============================================

CREATE POLICY "Public can read published products" ON products
  FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Public can read ingredients" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public can read product_ingredients" ON product_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read highlights" ON highlights
  FOR SELECT USING (true);

CREATE POLICY "Public can read testimonials" ON testimonials
  FOR SELECT USING (true);

-- ============================================
-- PUBLIC WRITE POLICIES
-- Newsletter signup and contact form
-- ============================================

CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- ADMIN POLICIES
-- Authenticated users can do everything
-- ============================================

CREATE POLICY "Admins can do everything on products" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on ingredients" ON ingredients
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on product_ingredients" ON product_ingredients
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on highlights" ON highlights
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on testimonials" ON testimonials
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read subscribers" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete subscribers" ON subscribers
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can read contact submissions" ON contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');
