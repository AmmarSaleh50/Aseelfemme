-- 003_storage_bucket.sql
-- Supabase Storage Configuration
-- Run this migration after 002_row_level_security.sql

-- ============================================
-- CREATE UPLOADS BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow public read access to uploads
CREATE POLICY "Public can view uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete uploads
CREATE POLICY "Authenticated users can delete uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
