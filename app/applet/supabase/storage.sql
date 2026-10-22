-- ==============================================================================
-- Tridimensional Creations - Supabase Storage Buckets & Policies (Step 2)
-- Buckets and Row Level Security (RLS) for storage.objects
-- ==============================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('public-website-assets', 'public-website-assets', true),
    ('customer-uploads', 'customer-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. Policies for 'public-website-assets'
-- (Blog images, page assets, gallery photos)
-- ==============================================================================

-- Public read access: anyone can view public website assets
CREATE POLICY "Public Read Access for Public Website Assets"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'public-website-assets');

-- Authenticated admins upload access
CREATE POLICY "Admin Upload Access for Public Website Assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'public-website-assets');

-- Authenticated admins update access
CREATE POLICY "Admin Update Access for Public Website Assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'public-website-assets')
    WITH CHECK (bucket_id = 'public-website-assets');

-- Authenticated admins delete access
CREATE POLICY "Admin Delete Access for Public Website Assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'public-website-assets');

-- ==============================================================================
-- 3. Policies for 'customer-uploads'
-- (Customer reference images, STL 3D models, technical CAD submissions)
-- ==============================================================================

-- Public upload access: visitors submitting quote/appointment forms can upload files
CREATE POLICY "Public Upload Access for Customer Files"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'customer-uploads');

-- Authenticated admins read/download access: protect client files from public scraping
CREATE POLICY "Admin Read Access for Customer Uploads"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'customer-uploads');

-- Authenticated admins update access
CREATE POLICY "Admin Update Access for Customer Uploads"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'customer-uploads')
    WITH CHECK (bucket_id = 'customer-uploads');

-- Authenticated admins delete access
CREATE POLICY "Admin Delete Access for Customer Uploads"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'customer-uploads');
