-- Migration: Create route_tracking table for ETA and progress tracking
-- Description: Tracks active route progress, ETAs, and distance remaining

CREATE TABLE IF NOT EXISTS public.route_tracking (
    id BIGSERIAL PRIMARY KEY,
    load_id BIGINT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    current_lat NUMERIC(10, 7),
    current_lng NUMERIC(11, 7),
    eta_pickup TIMESTAMPTZ,
    eta_delivery TIMESTAMPTZ,
    distance_remaining NUMERIC(10, 2), -- Distance in miles
    route_progress NUMERIC(5, 2), -- Percentage complete (0-100)
    status TEXT CHECK (status IN ('en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active route lookups
CREATE INDEX IF NOT EXISTS idx_route_tracking_load_id ON public.route_tracking(load_id);
CREATE INDEX IF NOT EXISTS idx_route_tracking_driver_id ON public.route_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_tracking_status ON public.route_tracking(status);

-- Composite index for active routes
CREATE INDEX IF NOT EXISTS idx_route_tracking_active ON public.route_tracking(load_id, status, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.route_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can view/update their own routes
DROP POLICY IF EXISTS route_tracking_driver_policy ON public.route_tracking;
CREATE POLICY route_tracking_driver_policy ON public.route_tracking
    FOR ALL
    USING (auth.uid() = driver_id);

-- Policy: Dispatchers, customers, and carriers can view routes for their loads
DROP POLICY IF EXISTS route_tracking_select_policy ON public.route_tracking;
CREATE POLICY route_tracking_select_policy ON public.route_tracking
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dispatch', 'executive')
        )
        OR EXISTS (
            SELECT 1 FROM public.loads l
            JOIN public.users u ON u.company_id = l.customer_id
            WHERE l.id = route_tracking.load_id 
            AND u.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.loads l
            JOIN public.users u ON u.company_id = l.carrier_id
            WHERE l.id = route_tracking.load_id 
            AND u.id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE public.route_tracking IS 'Real-time route progress tracking with ETAs and distance remaining';

