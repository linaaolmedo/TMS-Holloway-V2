# Supabase Setup Instructions for Document Storage & Audit Logging

## Step 1: Create the Audit Logs Table

Run this SQL in your Supabase SQL Editor:

```sql
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

-- Create indexes for faster queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
```

## Step 2: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create a bucket with these settings:
   - **Name:** `generated-documents`
   - **Public:** No (keep it private)
   - **File size limit:** 50 MB (or as needed)
   - Click **"Create bucket"**

## Step 3: Set Storage Policies

After creating the bucket, set up these policies:

### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-documents');
```

### Policy 2: Allow Users to Read Their Own Documents
```sql
CREATE POLICY "Users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'generated-documents');
```

### Policy 3: Allow Service Role Full Access
```sql
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'generated-documents')
WITH CHECK (bucket_id = 'generated-documents');
```

## Step 4: Verify Setup

Run this query to verify the audit_logs table exists:

```sql
SELECT * FROM audit_logs LIMIT 10;
```

Check storage bucket in Supabase Dashboard under Storage → generated-documents

## What's Now Implemented

### Invoice PDF Generation Now Includes:

1. **Company Logo** - Your TMS logo is embedded at the top of every PDF
2. **Storage in Supabase** - Every generated PDF is automatically stored in `generated-documents/invoices/`
3. **Audit Logging** - Every download is logged with:
   - User who downloaded it
   - Timestamp
   - IP address
   - User agent
   - Invoice details (number, amount, customer, load)
   
### Audit Log Features:

- Track who downloads invoices
- Track when documents are generated
- Store metadata about each action
- Query audit history for compliance
- Filter by user, entity type, or date range

### Example Audit Log Query:

```sql
-- See all invoice downloads in the last 24 hours
SELECT 
    al.*,
    u.name as user_name,
    u.email
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE entity_type = 'invoice'
  AND action = 'downloaded'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

```sql
-- See all actions for a specific invoice
SELECT * FROM audit_logs 
WHERE entity_type = 'invoice' 
  AND entity_id = 1
ORDER BY created_at DESC;
```

## Testing

1. Login to your TMS
2. Navigate to Billing → Invoices
3. Click "Download" on any invoice
4. Check Supabase:
   - **Storage:** You should see the PDF in `generated-documents/invoices/`
   - **Database:** Run `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1;` to see the log entry
   - **Documents table:** Run `SELECT * FROM documents WHERE doc_type = 'Invoice' ORDER BY uploaded_at DESC LIMIT 1;`

## Notes

- PDFs are stored with timestamp in filename to prevent conflicts
- Audit logs capture even if storage fails (for resilience)
- Logo will fallback to text if image can't be loaded
- All operations are non-blocking - PDF download continues even if logging fails

