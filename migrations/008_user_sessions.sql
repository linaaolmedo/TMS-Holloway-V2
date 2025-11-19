-- User Sessions Management for Admin Portal
-- Safe for UAT: New table, no impact on existing functionality

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    forced_logout BOOLEAN DEFAULT FALSE,
    forced_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, logout_at) WHERE logout_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_login ON public.user_sessions(login_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions for security monitoring and force logout capability';
COMMENT ON COLUMN public.user_sessions.forced_logout IS 'True if session was terminated by admin';
COMMENT ON COLUMN public.user_sessions.forced_by IS 'Admin user who forced the logout';

