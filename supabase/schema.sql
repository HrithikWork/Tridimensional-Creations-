-- ==============================================================================
-- TRIDIMENSIONAL CREATION — PRODUCTION DATABASE & STORAGE ARCHITECTURE
-- Phase 1: Core Relational Tables
-- Phase 2: Storage Buckets & Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DATA TABLES SETUP
-- ==============================================================================

-- 1.1 Customer Inquiries, Custom Quotes & Appointment Submissions
CREATE TABLE IF NOT EXISTS public.quotes_and_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_type TEXT,
    appointment_date TEXT,
    message TEXT,
    uploaded_file_url TEXT
);

-- 1.2 Portfolio Showcase & Gallery Media
CREATE TABLE IF NOT EXISTS public.portfolio_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    category TEXT NOT NULL, -- e.g. 'CNC', 'Resin', 'Decor', 'Furniture', 'Retail', 'Art'
    title TEXT NOT NULL,
    image_url TEXT NOT NULL
);

-- 1.3 Page Specific Assets
CREATE TABLE IF NOT EXISTS public.page_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    page_name TEXT NOT NULL, -- e.g. 'Home', 'About', 'Catalog', 'Contact'
    image_url TEXT NOT NULL
);

-- 1.4 Studio Journal & Blog Articles
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    author TEXT DEFAULT 'Tridimensional Atelier',
    published_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.quotes_and_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 2.1 quotes_and_appointments Policies:
-- Allow anyone (public/anon) to insert quote inquiries
CREATE POLICY "Allow public customer inquiry submissions" 
ON public.quotes_and_appointments
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Restrict read/update/delete access on customer inquiries to authenticated admin staff only
CREATE POLICY "Allow authenticated staff to view quotes" 
ON public.quotes_and_appointments
FOR SELECT 
TO authenticated 
USING (true);

-- 2.2 Public Read Policies for Website Content
CREATE POLICY "Allow public read access to portfolio_galleries" 
ON public.portfolio_galleries 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow authenticated staff to manage portfolio" 
ON public.portfolio_galleries 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public read access to page_assets" 
ON public.page_assets 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow authenticated staff to manage page_assets" 
ON public.page_assets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public read access to blogs" 
ON public.blogs 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow authenticated staff to manage blogs" 
ON public.blogs 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 3. STORAGE BUCKETS (FILE & PHOTO UPLOADS)
-- ==============================================================================

-- 3.1 Insert Buckets into storage.buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('public-website-assets', 'public-website-assets', true),
    ('customer-uploads', 'customer-uploads', false)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public;

-- 3.2 Storage RLS Policies: public-website-assets
-- Allow public viewing of website assets, gallery images, and blog covers
CREATE POLICY "Public website assets are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public-website-assets');

-- Restrict uploads, updates, and deletes to authenticated admins
CREATE POLICY "Admins can upload to public-website-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-website-assets');

CREATE POLICY "Admins can modify public-website-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public-website-assets');

CREATE POLICY "Admins can delete public-website-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public-website-assets');

-- 3.3 Storage RLS Policies: customer-uploads (STLs, blueprints, reference images)
-- Allow public visitors to upload files via the quote/appointment forms
CREATE POLICY "Visitors can upload reference files and STLs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'customer-uploads');

-- Restrict downloading/viewing customer uploads to authenticated admins only
CREATE POLICY "Admins only can view and download customer uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'customer-uploads');
