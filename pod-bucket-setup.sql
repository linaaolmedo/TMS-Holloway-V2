-- ============================================
-- Supabase Storage Setup for POD (Proof of Delivery) Documents
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create the POD bucket
-- and set up the necessary storage policies
-- ============================================

-- Step 1: Create the 'pods' storage bucket
-- This bucket will store all Proof of Delivery documents uploaded by drivers and carriers
INSERT INTO storage.buckets (id, name, public)
VALUES ('pods', 'pods', false)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up storage policies for the 'pods' bucket

-- Policy: Authenticated users (drivers and carriers) can upload PODs
CREATE POLICY "Authenticated users can upload PODs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pods');

-- Policy: Authenticated users can view PODs
CREATE POLICY "Authenticated users can view PODs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pods');

-- Policy: Users can update their own PODs
CREATE POLICY "Users can update PODs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pods');

-- Policy: Only dispatch users can delete PODs
CREATE POLICY "Dispatch users can delete PODs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pods' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'dispatch'
  )
);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the bucket and policies were created successfully

-- Check if bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'pods';

-- Check if policies were created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%POD%';

-- ============================================
-- Usage Notes
-- ============================================
-- 1. The 'pods' bucket is PRIVATE (not public) for security
-- 2. Files will be organized in the 'pods/' folder structure
-- 3. Filename format: pod_{load_id}_{timestamp}.{extension}
-- 4. Supported file types: JPG, PNG, PDF
-- 5. Drivers and carriers can upload via the "Upload POD" page
-- 6. POD uploads automatically create a record in the documents table
-- 7. When a POD is uploaded for an in-transit load, the load status automatically changes to "delivered"

