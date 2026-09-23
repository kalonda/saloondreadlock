-- ====================================================================
-- SUPABASE STORAGE BUCKETS & STORAGE POLICIES
-- Run this in your Supabase SQL Editor to create storage buckets
-- ====================================================================

-- 1. Create 'salon-images' bucket for styles, haircuts, and service photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-images', 'salon-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'payment-proofs' bucket for mobile money SMS screenshots & receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for 'salon-images' (Public read, Authenticated/Public upload)
CREATE POLICY "Public Read Salon Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-images');

CREATE POLICY "Allow Upload to Salon Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'salon-images');

CREATE POLICY "Allow Delete Salon Images"
ON storage.objects FOR DELETE
USING (bucket_id = 'salon-images');

-- 4. Storage Policies for 'payment-proofs'
CREATE POLICY "Public Read Payment Proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Allow Upload Payment Proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');
