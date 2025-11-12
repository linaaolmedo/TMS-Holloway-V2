-- Migration: Create load_locations table for geocoded addresses
-- Description: Stores geocoded coordinates for pickup and delivery locations

CREATE TABLE IF NOT EXISTS public.load_locations (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    pickup_lat NUMERIC(10, 7),
    pickup_lng NUMERIC(11, 7),
    delivery_lat NUMERIC(10, 7),
    delivery_lng NUMERIC(11, 7),
    geocoded_at TIMESTAMPTZ DEFAULT NOW(),
    geocoding_accuracy TEXT, -- 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one location record per load
CREATE UNIQUE INDEX IF NOT EXISTS idx_load_locations_load_id ON public.load_locations(load_id);

-- Spatial indexes for proximity queries
CREATE INDEX IF NOT EXISTS idx_load_locations_pickup ON public.load_locations(pickup_lat, pickup_lng);
CREATE INDEX IF NOT EXISTS idx_load_locations_delivery ON public.load_locations(delivery_lat, delivery_lng);

-- Enable Row Level Security
ALTER TABLE public.load_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
DROP POLICY IF EXISTS load_locations_select_policy ON public.load_locations;
CREATE POLICY load_locations_select_policy ON public.load_locations
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Allow insert/update for dispatchers and admins
DROP POLICY IF EXISTS load_locations_insert_policy ON public.load_locations;
CREATE POLICY load_locations_insert_policy ON public.load_locations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dispatch', 'csr')
        )
    );

DROP POLICY IF EXISTS load_locations_update_policy ON public.load_locations;
CREATE POLICY load_locations_update_policy ON public.load_locations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dispatch', 'csr')
        )
    );

-- Add comment
COMMENT ON TABLE public.load_locations IS 'Geocoded coordinates for load pickup and delivery locations';


