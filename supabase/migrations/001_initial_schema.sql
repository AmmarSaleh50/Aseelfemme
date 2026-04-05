-- 001_initial_schema.sql
-- AseelFemme Initial Database Schema
-- Run this migration first to create all tables and enums

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE skin_type AS ENUM ('ALL', 'DRY', 'OILY', 'COMBINATION', 'SENSITIVE');
CREATE TYPE product_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- ============================================
-- CORE TABLES
-- ============================================

-- PRODUCTS TABLE
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name_en TEXT,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  short_description_en TEXT,
  short_description_ar TEXT,
  long_description_en TEXT,
  long_description_ar TEXT,
  category_en TEXT,
  category_ar TEXT,
  shape TEXT,
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  hero_image_url TEXT NOT NULL,
  gallery_image_urls TEXT[] DEFAULT '{}',
  benefits_en TEXT[] DEFAULT '{}',
  benefits_ar TEXT[] DEFAULT '{}',
  skin_type skin_type DEFAULT 'ALL',
  scent_profile_en TEXT,
  scent_profile_ar TEXT,
  weight_grams INTEGER,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_cruelty_free BOOLEAN DEFAULT TRUE,
  is_fragrance_free BOOLEAN DEFAULT FALSE,
  beeorder_url TEXT,
  status product_status DEFAULT 'DRAFT',
  field_updated_at JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INGREDIENTS TABLE
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name_en TEXT,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  benefits_en TEXT[] DEFAULT '{}',
  benefits_ar TEXT[] DEFAULT '{}',
  image_url TEXT,
  field_updated_at JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT_INGREDIENTS JUNCTION TABLE
CREATE TABLE product_ingredients (
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

-- CATEGORIES TABLE
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- HIGHLIGHTS TABLE
CREATE TABLE highlights (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  "order" INTEGER DEFAULT 0
);

-- TESTIMONIALS TABLE
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIBERS TABLE
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACT SUBMISSIONS TABLE
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ingredients_updated_at BEFORE UPDATE ON ingredients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_ingredients_slug ON ingredients(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_highlights_section ON highlights(section);
