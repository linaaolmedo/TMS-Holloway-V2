-- Migration: Create route_stops table for multi-stop route planning
-- Description: Manages multiple pickup/delivery stops for optimized routing

CREATE TABLE IF NOT EXISTS public.route_stops (
    id BIGSERIAL PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    load_id BIGINT REFERENCES public.loads(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    location TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(11, 7),
    stop_type TEXT NOT NULL CHECK (stop_type IN ('pickup', 'delivery', 'waypoint')),
    scheduled_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'skipped')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for driver route queries
CREATE INDEX IF NOT EXISTS idx_route_stops_driver_id ON public.route_stops(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_load_id ON public.route_stops(load_id);

-- Index for ordered stop sequence
CREATE INDEX IF NOT EXISTS idx_route_stops_sequence ON public.route_stops(driver_id, stop_sequence, status);

-- Index for active stops
CREATE INDEX IF NOT EXISTS idx_route_stops_active ON public.route_stops(driver_id, status, scheduled_time);

-- Enable Row Level Security
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can view/update their own stops
DROP POLICY IF EXISTS route_stops_driver_policy ON public.route_stops;
CREATE POLICY route_stops_driver_policy ON public.route_stops
    FOR ALL
    USING (auth.uid() = driver_id);

-- Policy: Dispatchers can manage all stops
DROP POLICY IF EXISTS route_stops_dispatch_policy ON public.route_stops;
CREATE POLICY route_stops_dispatch_policy ON public.route_stops
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dispatch')
        )
    );

-- Policy: Customers and carriers can view stops for their loads
DROP POLICY IF EXISTS route_stops_select_policy ON public.route_stops;
CREATE POLICY route_stops_select_policy ON public.route_stops
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loads l
            JOIN public.users u ON u.company_id IN (l.customer_id, l.carrier_id)
            WHERE l.id = route_stops.load_id 
            AND u.id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE public.route_stops IS 'Multi-stop route planning and optimization for drivers';


