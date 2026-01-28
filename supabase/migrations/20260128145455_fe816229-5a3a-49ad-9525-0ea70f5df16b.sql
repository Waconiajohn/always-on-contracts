-- Add doc_type column to rb_documents table
-- This allows filtering documents by type (resume vs job_description)
ALTER TABLE public.rb_documents 
ADD COLUMN IF NOT EXISTS doc_type text DEFAULT 'resume';

-- Add a comment explaining the column
COMMENT ON COLUMN public.rb_documents.doc_type IS 'Type of document: resume or job_description';