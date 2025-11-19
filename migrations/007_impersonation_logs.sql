-- Impersonation Tracking for Admin Portal
-- Safe for UAT: New table, no impact on existing functionality

CREATE TABLE IF NOT EXISTS public.impersonation_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES public.users(id),
    target_user_id UUID NOT NULL REFERENCES public.users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    actions_taken JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_admin ON public.impersonation_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_target ON public.impersonation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_started ON public.impersonation_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_active ON public.impersonation_logs(admin_user_id, target_user_id) WHERE ended_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE public.impersonation_logs IS 'Tracks admin user impersonation sessions for audit and security';
COMMENT ON COLUMN public.impersonation_logs.reason IS 'Admin-provided reason for impersonation';
COMMENT ON COLUMN public.impersonation_logs.actions_taken IS 'Array of actions performed during impersonation session';

