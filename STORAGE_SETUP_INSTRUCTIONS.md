# Supabase Storage Setup Instructions

## Create Storage Bucket for Documents

To enable PDF storage for rate confirmations and other documents, you need to create a storage bucket in Supabase.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Create the Documents Bucket**
   - Click on "Storage" in the left sidebar
   - Click "New bucket"
   - Bucket name: `documents`
   - Public bucket: **No** (Keep it private for security)
   - Click "Create bucket"

3. **Set Up Storage Policies**

Run these SQL commands in the SQL Editor:

```sql
-- Policy: Users can upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy: Users can view documents they have access to
CREATE POLICY "Users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Users can update their documents
CREATE POLICY "Users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Users can delete documents
CREATE POLICY "Users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

4. **Run the Document Type Migration**

Run the SQL migration to add 'RateConfirmation' as a valid document type:

```sql
-- Add 'RateConfirmation' to the documents table doc_type check constraint
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_doc_type_check 
CHECK (doc_type IN ('POD', 'BOL', 'Invoice', 'RateConfirmation'));
```

### Folder Structure

The application will automatically organize documents in folders:
- `rate-confirmations/` - Rate confirmation PDFs
- `pod/` - Proof of Delivery documents (future)
- `bol/` - Bill of Lading documents (future)
- `invoices/` - Invoice PDFs (future)

### Features

✅ **Automatic Storage**: Rate confirmations are automatically saved to storage when generated
✅ **Caching**: Existing PDFs are retrieved from storage instead of regenerating
✅ **Regeneration**: Add `?regenerate=true` to force PDF regeneration
✅ **Audit Trail**: All uploads are tracked in the `documents` table with uploader info

### Example Usage

- View existing PDF: `GET /api/loads/{id}/rate-confirmation`
- Regenerate PDF: `GET /api/loads/{id}/rate-confirmation?regenerate=true`


