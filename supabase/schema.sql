-- ==============================================================================
-- TRIDIMENSIONAL CREATION PVT LTD — COMPLETE MASTER DATABASE & STORAGE ARCHITECTURE
-- Production Supabase Tables, RLS Policies, and Dedicated Storage Buckets
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DATA TABLES
-- ==============================================================================

-- 1.1 Customer Inquiries & Uploaded Files (Quotes + Studio Appointments)
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT DEFAULT 'Studio Appointment', -- 'Product Quote' or 'Studio Appointment'
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_type TEXT,
    product_title TEXT,
    width_x TEXT,
    height_y TEXT,
    thickness_z TEXT,
    appointment_date TEXT,
    message TEXT,
    status TEXT DEFAULT 'New', -- 'New', 'Reviewed', 'In Production', 'Completed'
    reference_file_url TEXT,
    reference_file_name TEXT
);

-- Backward-compatibility view or table for quotes_and_appointments
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

-- 1.2 Portfolio Galleries
CREATE TABLE IF NOT EXISTS public.portfolio_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. '2D CNC Router Works', '3D CNC Router Works', '3D Printing', 'Architectural Decor', 'Bespoke Furniture', 'Retail & Commercial', 'Fine Art & Sculptures'
    sub_gallery TEXT DEFAULT 'all', -- 'all', 'decor', 'furniture', 'retail', 'art'
    caption TEXT,
    specs_chip TEXT,
    image_url TEXT NOT NULL
);

-- 1.3 18 Catalog Capabilities
CREATE TABLE IF NOT EXISTS public.catalog_capabilities (
    id TEXT PRIMARY KEY, -- Slug or UUID
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    category TEXT NOT NULL, -- '2D CNC Router Works', '3D CNC Router Works (Depth, Relief & Contours)', '3D Printing (Additive Manufacturing)'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    design_scope JSONB DEFAULT '[]'::jsonb,
    where_to_use JSONB DEFAULT '[]'::jsonb,
    tech_specs JSONB DEFAULT '{"thickness": "", "materials": "", "finishes": ""}'::jsonb,
    customization TEXT,
    image_url TEXT NOT NULL
);

-- 1.4 Blog & Articles Publisher
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    category_badge TEXT DEFAULT 'CNC Engineering',
    reading_time TEXT DEFAULT '5 min read',
    author TEXT DEFAULT 'K. Sanjeev Singha',
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    published_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Page Assets (Home Marquee, Application Cards, About Story)
CREATE TABLE IF NOT EXISTS public.page_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    page_name TEXT NOT NULL, -- 'home', 'about'
    section_name TEXT NOT NULL, -- 'home-marquee', 'home-applications', 'foundation-story'
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes_and_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_assets ENABLE ROW LEVEL SECURITY;

-- 2.1 Public insert & Admin manage for customer_inquiries
CREATE POLICY "Allow public submissions to customer_inquiries"
ON public.customer_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow select on customer_inquiries"
ON public.customer_inquiries FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated staff to update/delete customer_inquiries"
ON public.customer_inquiries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2.2 Public read & Full access for portfolio, catalog, blogs, page_assets
CREATE POLICY "Public read portfolio_galleries" ON public.portfolio_galleries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Manage portfolio_galleries" ON public.portfolio_galleries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read catalog_capabilities" ON public.catalog_capabilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Manage catalog_capabilities" ON public.catalog_capabilities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read blogs" ON public.blogs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Manage blogs" ON public.blogs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read page_assets" ON public.page_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Manage page_assets" ON public.page_assets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 3. DEDICATED STORAGE BUCKETS SETUP
-- ==============================================================================
-- 1. site-assets (Home & About Page Assets)
-- 2. gallery-images (Portfolio Galleries)
-- 3. catalog-images (18 Catalog Capabilities)
-- 4. blog-images (Blog Cover/Inline Images)
-- 5. customer-uploads (Customer Quote & Appointment File Uploads)

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('site-assets', 'site-assets', true),
    ('gallery-images', 'gallery-images', true),
    ('catalog-images', 'catalog-images', true),
    ('blog-images', 'blog-images', true),
    ('customer-uploads', 'customer-uploads', true)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public;

-- Storage Policies: Public read on all public buckets
CREATE POLICY "Public Access for site-assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'site-assets');
CREATE POLICY "Public Access for gallery-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'gallery-images');
CREATE POLICY "Public Access for catalog-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'catalog-images');
CREATE POLICY "Public Access for blog-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'blog-images');
CREATE POLICY "Public Access for customer-uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'customer-uploads');

-- Storage Upload Policies: Allow uploads
CREATE POLICY "Upload to site-assets" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "Upload to gallery-images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'gallery-images');
CREATE POLICY "Upload to catalog-images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'catalog-images');
CREATE POLICY "Upload to blog-images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "Upload to customer-uploads" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'customer-uploads');

CREATE POLICY "Modify/Delete site-assets" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'site-assets') WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "Modify/Delete gallery-images" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'gallery-images') WITH CHECK (bucket_id = 'gallery-images');
CREATE POLICY "Modify/Delete catalog-images" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'catalog-images') WITH CHECK (bucket_id = 'catalog-images');
CREATE POLICY "Modify/Delete blog-images" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'blog-images') WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "Modify/Delete customer-uploads" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'customer-uploads') WITH CHECK (bucket_id = 'customer-uploads');
