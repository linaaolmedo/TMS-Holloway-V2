-- System Settings for Admin Portal
-- Safe for UAT: New table with default values, no impact on existing functionality

CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'template')),
    category TEXT NOT NULL CHECK (category IN ('general', 'notifications', 'documents', 'pricing', 'features', 'security')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public) WHERE is_public = TRUE;

-- Insert default settings (safe - doesn't affect existing functionality)
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('default_customer_payment_terms', '"Net 30"', 'string', 'pricing', 'Default payment terms for new customers', false),
('default_margin_percent', '15', 'number', 'pricing', 'Default margin percentage for load pricing', false),
('enable_smart_dispatch', 'true', 'boolean', 'features', 'Enable AI-powered smart dispatch features', false),
('enable_real_time_tracking', 'true', 'boolean', 'features', 'Enable real-time GPS tracking for drivers', false),
('notification_email_from', '"noreply@bulkflow.com"', 'string', 'notifications', 'From email address for system notifications', false),
('invoice_number_prefix', '"INV-"', 'string', 'documents', 'Prefix for invoice numbers', false),
('load_number_prefix', '"LOAD-"', 'string', 'documents', 'Prefix for load numbers', false),
('session_timeout_minutes', '480', 'number', 'security', 'User session timeout in minutes (8 hours default)', false),
('max_login_attempts', '5', 'number', 'security', 'Maximum failed login attempts before lockout', false),
('company_name', '"BulkFlow TMS"', 'string', 'general', 'Company name for documents and emails', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.system_settings IS 'Global system configuration settings manageable through admin portal';
COMMENT ON COLUMN public.system_settings.is_public IS 'If true, setting can be read by non-admin users';

