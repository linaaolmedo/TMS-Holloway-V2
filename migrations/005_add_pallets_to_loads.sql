-- Add pallets column to loads table
-- This allows tracking the number of pallets in a load as an optional field

ALTER TABLE public.loads
ADD COLUMN pallets INTEGER;

COMMENT ON COLUMN public.loads.pallets IS 'Optional number of pallets in the load';

