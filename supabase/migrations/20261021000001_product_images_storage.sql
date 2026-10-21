-- ============================================================================
-- TindaMate — Product Images Supabase Storage Bucket & Policies
-- File: supabase/migrations/20261021000001_product_images_storage.sql
--
-- Purpose:
--   Creates the public 'products' storage bucket in Supabase and sets up
--   Row Level Security policies allowing:
--   - Anyone (including customers/app viewers) to view product pictures.
--   - Authenticated store owners to upload, update, and manage product photos.
-- ============================================================================

-- 1. Create or ensure the 'products' bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public read access to all product photos
DROP POLICY IF EXISTS "Public product image access" ON storage.objects;
CREATE POLICY "Public product image access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- 3. Allow authenticated vendors to upload product images
DROP POLICY IF EXISTS "Authenticated vendors can upload product images" ON storage.objects;
CREATE POLICY "Authenticated vendors can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

-- 4. Allow authenticated vendors to update or replace product images
DROP POLICY IF EXISTS "Authenticated vendors can update product images" ON storage.objects;
CREATE POLICY "Authenticated vendors can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products');

-- 5. Allow authenticated vendors to delete product images
DROP POLICY IF EXISTS "Authenticated vendors can delete product images" ON storage.objects;
CREATE POLICY "Authenticated vendors can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

