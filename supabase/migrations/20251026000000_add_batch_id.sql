-- Add the batch_id column to transcription_reports
ALTER TABLE public.transcription_reports
ADD COLUMN batch_id UUID NULL;

-- Optional: Add comment for clarity
COMMENT ON COLUMN public.transcription_reports.batch_id IS 'Identifier linking multiple reports created from a single batch job.';
