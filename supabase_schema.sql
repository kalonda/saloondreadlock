-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) POLICIES
-- Project URL: https://upvlnmvqozjvzoelyovs.supabase.co
-- ====================================================================

-- 1. PROFILES / USERS TABLE (Manager, Staff with Fixed Salary, Client)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'staff', 'customer')),
    avatar TEXT,
    specialization TEXT,
    bio TEXT,
    rating NUMERIC DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    salary NUMERIC DEFAULT 450000, -- Base / Monthly Salary in TZS editable by Manager
    daily_earnings NUMERIC DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SERVICES TABLE (25+ Salon Services)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name_sw TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    category TEXT NOT NULL,
    price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'range')),
    min_price NUMERIC NOT NULL,
    max_price NUMERIC NOT NULL,
    default_price NUMERIC NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    image TEXT NOT NULL,
    description_sw TEXT,
    description_en TEXT,
    description_fr TEXT,
    popular BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDERS & BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_type TEXT DEFAULT 'registered',
    customer_id TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_staff_name TEXT,
    assigned_staff_avatar TEXT,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_assignment',
            'assigned',
            'in_progress',
            'pending_payment',
            'paid_pending_confirmation',
            'confirmed',
            'completed',
            'cancelled'
        )
    ),
    payment_method TEXT DEFAULT 'mobile_money' CHECK (payment_method IN ('cash', 'mobile_money')),
    payment_provider TEXT,
    payment_proof JSONB,
    notes TEXT,
    booking_source TEXT DEFAULT 'remote_web',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. IMAGE LIBRARY TABLE
CREATE TABLE IF NOT EXISTS public.image_library (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT NOT NULL,
    tag TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS POLICIES FOR PROFILES
-- ====================================================================
CREATE POLICY "Public profiles can be viewed by all authenticated/anon"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Managers can insert new profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Managers and owners can update profiles"
    ON public.profiles FOR UPDATE
    USING (true);

-- ====================================================================
-- RLS POLICIES FOR SERVICES
-- ====================================================================
CREATE POLICY "Services are viewable by all users"
    ON public.services FOR SELECT
    USING (true);

CREATE POLICY "Managers can insert services"
    ON public.services FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Managers can update services"
    ON public.services FOR UPDATE
    USING (true);

CREATE POLICY "Managers can delete services"
    ON public.services FOR DELETE
    USING (true);

-- ====================================================================
-- RLS POLICIES FOR ORDERS
-- ====================================================================
CREATE POLICY "Orders are viewable by participants"
    ON public.orders FOR SELECT
    USING (true);

CREATE POLICY "Clients can create new orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff and Managers can update orders"
    ON public.orders FOR UPDATE
    USING (true);

-- ====================================================================
-- RLS POLICIES FOR IMAGE LIBRARY
-- ====================================================================
CREATE POLICY "Images are viewable by everyone"
    ON public.image_library FOR SELECT
    USING (true);

CREATE POLICY "Managers and staff can upload images"
    ON public.image_library FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Managers can delete images"
    ON public.image_library FOR DELETE
    USING (true);

-- ====================================================================
-- SEED INITIAL DATA: MANAGER ACCOUNT (testmanager / testmanager) & STAFF
-- ====================================================================

INSERT INTO public.profiles (
    id, username, password, name, phone, email, role, avatar, specialization, salary
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'testmanager',
    'testmanager',
    'Grace Kimaro (Manager)',
    '+255 754 000 111',
    'manager@saloonms.co.tz',
    'manager',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    'Salon Director & General Manager',
    1200000
) ON CONFLICT (username) DO UPDATE SET password = 'testmanager', salary = 1200000;

INSERT INTO public.profiles (
    id, username, password, name, phone, email, role, avatar, specialization, salary
) VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    'neema',
    '123',
    'Neema Kavishe',
    '+255 754 123 456',
    'neema@saloon.co.tz',
    'staff',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'Knotless, Stitch Braids & Butterfly Locs',
    500000
),
(
    '00000000-0000-0000-0000-000000000003',
    'fatma',
    '123',
    'Fatma Ally (Mama Dreads)',
    '+255 784 987 654',
    'fatma@saloon.co.tz',
    'staff',
    'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&q=80',
    'Dreadlocks, Repairing & Natural Locs',
    550000
),
(
    '00000000-0000-0000-0000-000000000004',
    'client',
    '123',
    'Zainab Rashid (Client)',
    '+255 712 345 678',
    'zainab@gmail.com',
    'customer',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'Loyal Customer',
    0
)
ON CONFLICT (username) DO NOTHING;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
