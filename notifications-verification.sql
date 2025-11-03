-- Verify notifications table exists and check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- Check existing policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- If you need to add missing policies (run these if policies don't exist):
-- Note: These will error if they already exist, which is fine

DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    -- Try to create SELECT policy
    BEGIN
        CREATE POLICY "Users can view their own notifications"
        ON public.notifications FOR SELECT
        USING (auth.uid() = recipient_id);
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Policy already exists, ignore
    END;
    
    -- Try to create UPDATE policy
    BEGIN
        CREATE POLICY "Users can update their own notifications"
        ON public.notifications FOR UPDATE
        USING (auth.uid() = recipient_id);
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Policy already exists, ignore
    END;
    
    -- Try to create INSERT policy (needed for creating notifications)
    BEGIN
        CREATE POLICY "System can insert notifications"
        ON public.notifications FOR INSERT
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Policy already exists, ignore
    END;
END $$;

-- Verify setup is complete
SELECT 'Notifications table is ready!' as status;

