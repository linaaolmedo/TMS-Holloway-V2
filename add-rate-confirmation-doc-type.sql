-- Add 'RateConfirmation' to the documents table doc_type check constraint
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_doc_type_check 
CHECK (doc_type IN ('POD', 'BOL', 'Invoice', 'RateConfirmation'));

