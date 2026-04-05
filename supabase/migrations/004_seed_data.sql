-- 004_seed_data.sql
-- Optional: Seed data for initial setup
-- Run this migration after 003_storage_bucket.sql

-- ============================================
-- SEED CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, description, "order", is_active) VALUES
  ('Rose', 'rose', 'Rose-scented products', 1, true),
  ('Mint', 'mint', 'Mint-infused products', 2, true),
  ('Citrus & Spice', 'citrus-spice', 'Warm citrus and spice blends', 3, true),
  ('Lavender', 'lavender', 'Calming lavender products', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED HIGHLIGHTS
-- ============================================
INSERT INTO highlights (section, title, body, "order") VALUES
  ('why', 'Truly Organic & Handcrafted', 'Made in small batches for purity.', 1),
  ('why', 'Thoughtful Ingredients', 'Real botanicals, no harsh sulfates.', 2),
  ('why', 'Gentle on Skin', 'Kind to sensitive skin types.', 3),
  ('why', 'Small-Batch Freshness', 'Crafted fresh, always.', 4),
  ('hero_subtitle', 'AseelFemme Presents: The Art of Clean Luxury', 'Because with AseelFemme, beauty isn''t just seen — it''s felt.', 1),
  ('ritual_step', 'Embrace Natural Freshness', 'A mindful cleanse to begin and end your day.', 1)
ON CONFLICT DO NOTHING;
