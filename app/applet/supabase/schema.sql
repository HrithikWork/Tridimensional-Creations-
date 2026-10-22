-- ==============================================================================
-- Tridimensional Creations - Supabase Database Schema (Step 1)
-- Core Data Tables, Indexing, and Row-Level Security (RLS) Configuration
-- ==============================================================================

-- 1. Enable UUID Extension (pgcrypto is built into Supabase/PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Table: quotes_and_appointments
-- Customer inquiries, quote requests, and consultation appointments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quotes_and_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT,
    service_type TEXT NOT NULL,
    appointment_date DATE,
    message TEXT NOT NULL,
    uploaded_file_url TEXT
);

-- ==============================================================================
-- 3. Table: portfolio_galleries
-- Showcase items categorized by medium (CNC, Resin, 3D Sculpting, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL
);

-- ==============================================================================
-- 4. Table: page_assets
-- Dynamic visuals and imagery mapped to specific site sections (Home, About, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.page_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    page_name TEXT NOT NULL,
    image_url TEXT NOT NULL
);

-- ==============================================================================
-- 5. Table: blogs
-- Editorial articles, project case studies, and studio news
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    author TEXT NOT NULL DEFAULT 'Tridimensional Creations',
    published_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_quotes_created_at 
    ON public.quotes_and_appointments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_category 
    ON public.portfolio_galleries (category);

CREATE INDEX IF NOT EXISTS idx_page_assets_page 
    ON public.page_assets (page_name);

CREATE INDEX IF NOT EXISTS idx_blogs_published_date 
    ON public.blogs (published_date DESC);

-- ==============================================================================
-- 7. Row Level Security (RLS) Configuration
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.quotes_and_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Policies: quotes_and_appointments
-- Public users can submit quotes (INSERT only).
-- Only authenticated studio staff/admins can view and manage submissions.
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can submit quotes and appointments"
    ON public.quotes_and_appointments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated admins can view and manage quote submissions"
    ON public.quotes_and_appointments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Policies: portfolio_galleries
-- Public users can view showcase gallery items (SELECT).
-- Authenticated admins have full CRUD permissions.
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view portfolio galleries"
    ON public.portfolio_galleries
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated admins can manage portfolio galleries"
    ON public.portfolio_galleries
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Policies: page_assets
-- Public users can view page assets (SELECT).
-- Authenticated admins have full CRUD permissions.
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view page assets"
    ON public.page_assets
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated admins can manage page assets"
    ON public.page_assets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Policies: blogs
-- Public users can view published blog posts (SELECT).
-- Authenticated admins have full CRUD permissions.
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view published blogs"
    ON public.blogs
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated admins can manage blogs"
    ON public.blogs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
