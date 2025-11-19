-- Enhanced Audit Logging for Admin Portal
-- Safe for UAT: Only adds nullable columns to existing table

-- Add optional columns to existing audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS changes_made JSONB;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_impersonated ON public.audit_logs(impersonated_by) WHERE impersonated_by IS NOT NULL;

-- Extend entity_type check to include new types (safe - only adds, doesn't remove)
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check,
ADD CONSTRAINT audit_logs_entity_type_check 
CHECK (entity_type IN ('invoice', 'rate_confirmation', 'pod', 'bol', 'document', 'user', 'company', 'load', 'setting', 'system'));

-- Extend action check to include new types (safe - only adds, doesn't remove)
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check,
ADD CONSTRAINT audit_logs_action_check 
CHECK (action IN ('generated', 'downloaded', 'viewed', 'uploaded', 'deleted', 'created', 'updated', 'login', 'logout', 'role_changed', 'impersonated', 'bulk_update'));

-- Add comment for documentation
COMMENT ON COLUMN public.audit_logs.impersonated_by IS 'If action was performed during impersonation, this is the admin user ID';
COMMENT ON COLUMN public.audit_logs.changes_made IS 'JSON object containing before/after values for updates';

