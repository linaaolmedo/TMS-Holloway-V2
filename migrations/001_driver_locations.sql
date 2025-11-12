-- Migration: Create driver_locations table for real-time GPS tracking
-- Description: Stores driver location data for real-time tracking and route optimization

CREATE TABLE IF NOT EXISTS public.driver_locations (
    id BIGSERIAL PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(11, 7) NOT NULL,
    heading NUMERIC(5, 2), -- Direction in degrees (0-360)
    speed NUMERIC(6, 2), -- Speed in mph
    accuracy NUMERIC(8, 2), -- GPS accuracy in meters
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by driver
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);

-- Index for time-based queries (get latest location)
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON public.driver_locations(timestamp DESC);

-- Composite index for driver + recent locations
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_timestamp ON public.driver_locations(driver_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can only update their own location
DROP POLICY IF EXISTS driver_locations_insert_policy ON public.driver_locations;
CREATE POLICY driver_locations_insert_policy ON public.driver_locations
    FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

-- Policy: Dispatchers and admins can view all locations
DROP POLICY IF EXISTS driver_locations_select_policy ON public.driver_locations;
CREATE POLICY driver_locations_select_policy ON public.driver_locations
    FOR SELECT
    USING (
        auth.uid() = driver_id 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dispatch', 'executive')
        )
    );

-- Add comment
COMMENT ON TABLE public.driver_locations IS 'Real-time GPS location tracking for drivers';

