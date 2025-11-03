-- Create audit_logs table for tracking document generation and access
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('invoice', 'rate_confirmation', 'pod', 'bol', 'document')),
    entity_id BIGINT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('generated', 'downloaded', 'viewed', 'uploaded', 'deleted')),
    user_id UUID REFERENCES public.users(id),
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Create storage bucket for generated documents if it doesn't exist
-- Run this in Supabase Storage settings or via the API
-- Storage bucket name: 'generated-documents'
-- Policies: authenticated users can read/write their own documents

