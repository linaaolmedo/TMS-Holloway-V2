-- Add last_login tracking to users table
-- Safe for UAT: Adds nullable column with default

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for active users
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC NULLS LAST);

-- Add comments
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of user last successful login';
COMMENT ON COLUMN public.users.is_active IS 'If false, user account is deactivated and cannot login';

